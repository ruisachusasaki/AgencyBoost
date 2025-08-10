import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Settings, ChevronUp, ChevronDown, Calendar, MoreHorizontal, ChevronLeft, ChevronRight, Users, Upload, Download, Filter, Save, X } from "lucide-react";
import { SimpleAddClientForm } from "@/components/forms/simple-add-client-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatPhoneNumber } from "@/lib/utils";
import type { Client } from "@shared/schema";

type SortField = 'name' | 'company' | 'phone' | 'email' | 'contactOwner' | 'createdAt' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface ClientFilter {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

interface SmartList {
  id: string;
  name: string;
  description?: string;
  filters: ClientFilter;
  isDefault: boolean;
  createdAt: Date;
}

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  defaultVisible: boolean;
}

const AVAILABLE_COLUMNS: Column[] = [
  { key: 'name', label: 'Name', sortable: true, defaultVisible: true },
  { key: 'company', label: 'Business', sortable: true, defaultVisible: true },
  { key: 'phone', label: 'Phone Number', sortable: true, defaultVisible: true },
  { key: 'email', label: 'Email', sortable: true, defaultVisible: true },
  { key: 'contactOwner', label: 'Contact Owner', sortable: true, defaultVisible: true },
  { key: 'createdAt', label: 'Created Date', sortable: true, defaultVisible: true },
  { key: 'lastActivity', label: 'Last Activity', sortable: true, defaultVisible: true },
  { key: 'tags', label: 'Tags', sortable: false, defaultVisible: false },
  { key: 'city', label: 'City', sortable: true, defaultVisible: false },
  { key: 'state', label: 'State', sortable: true, defaultVisible: false },
  { key: 'clientVertical', label: 'Client Vertical', sortable: true, defaultVisible: false },
  { key: 'status', label: 'Status', sortable: true, defaultVisible: false },
  { key: 'website', label: 'Website', sortable: false, defaultVisible: false },
  { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true },
];

interface PaginatedClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.key))
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filtering state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<ClientFilter>({
    conditions: [],
    logic: 'AND'
  });
  const [activeSmartList, setActiveSmartList] = useState<string | null>(null);
  const [smartListName, setSmartListName] = useState("");
  const [smartListDescription, setSmartListDescription] = useState("");
  const [isSaveSmartListOpen, setIsSaveSmartListOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: clientsData, isLoading } = useQuery<PaginatedClientsResponse>({
    queryKey: [`/api/clients?page=${currentPage}&limit=${pageSize}`],
  });

  const clients = clientsData?.clients || [];
  const pagination = clientsData?.pagination;

  // Fetch custom fields data for dynamic name display
  const { data: customFieldsData } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
    queryKey: ['/api/custom-fields'],
  });

  // Fetch current user role to check admin permissions
  const { data: currentUser } = useQuery<{ id: string; role: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  // Fetch staff data to display contact owner names
  const { data: staff = [] } = useQuery<Array<{ id: string; firstName: string; lastName: string }>>({
    queryKey: ['/api/staff'],
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'Admin';

  // Helper function to get contact owner display name
  const getContactOwnerName = (contactOwnerId: string | null) => {
    if (!contactOwnerId || !staff) return '-';
    const staffMember = staff.find(s => s.id === contactOwnerId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : '-';
  };

  // Helper functions to get dynamic names from custom fields
  const getClientDisplayName = (client: Client) => {
    if (!client || !customFieldsData) return client?.name || "";
    
    // Check if custom field values exist
    if (!client.customFieldValues) {
      return client.name || "";
    }
    
    // Find First Name and Last Name fields by exact name match
    const firstNameField = customFieldsData.find(field => 
      field.name === 'First Name' || field.name === 'FirstName' || field.name === 'first name'
    );
    const lastNameField = customFieldsData.find(field => 
      field.name === 'Last Name' || field.name === 'LastName' || field.name === 'last name'
    );
    
    const customFieldValues = client.customFieldValues as Record<string, any> || {};
    const firstName = firstNameField ? customFieldValues[firstNameField.id] || "" : "";
    const lastName = lastNameField ? customFieldValues[lastNameField.id] || "" : "";
    
    // If we have both first and last name from custom fields, use them
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    // If we only have first name, use it
    if (firstName) {
      return firstName;
    }
    // Otherwise fall back to database name
    return client.name || "";
  };

  const getBusinessDisplayName = (client: Client) => {
    if (!client || !customFieldsData) return client?.company || "";
    
    // Check if custom field values exist
    if (!client.customFieldValues) {
      return client.company || "";
    }
    
    // Find Business Name field by exact name match
    const businessNameField = customFieldsData.find(field => 
      field.name === 'Business Name' || field.name === 'Company Name' || field.name === 'business name'
    );
    
    const customFieldValues = client.customFieldValues as Record<string, any> || {};
    const businessName = businessNameField ? customFieldValues[businessNameField.id] || "" : "";
    
    // If we have business name from custom fields, use it
    if (businessName) {
      return businessName;
    }
    // Otherwise fall back to database company
    return client.company || "";
  };

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
        description: "The client has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Apply filtering and sorting to clients
  const filteredAndSortedClients = useMemo(() => {
    if (!clients || clients.length === 0) return clients;

    // First apply filters
    const filtered = applyClientFilter(clients, currentFilter);

    // Then apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'name':
          aValue = getClientDisplayName(a).toLowerCase();
          bValue = getClientDisplayName(b).toLowerCase();
          break;
        case 'company':
          aValue = getBusinessDisplayName(a).toLowerCase();
          bValue = getBusinessDisplayName(b).toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'contactOwner':
          const aOwner = staff?.find((s: any) => s.id === a.contactOwner);
          const bOwner = staff?.find((s: any) => s.id === b.contactOwner);
          aValue = (aOwner ? `${aOwner.firstName} ${aOwner.lastName}` : '').toLowerCase();
          bValue = (bOwner ? `${bOwner.firstName} ${bOwner.lastName}` : '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'lastActivity':
          // For now, use createdAt as lastActivity placeholder
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (sortField === 'createdAt' || sortField === 'lastActivity') {
        // Handle date sorting
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Handle string sorting
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return sorted;
  }, [clients, sortField, sortDirection, staff, customFieldsData, currentFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Import CSV handler
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Import successful",
          description: `${result.imported} clients imported successfully`,
        });
        // Refresh the clients data
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      } else {
        toast({
          title: "Import failed",
          description: result.message || "Failed to import clients",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: "An error occurred while importing clients",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  // Export CSV handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/clients/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export successful",
          description: "Clients exported successfully",
        });
      } else {
        const result = await response.json();
        toast({
          title: "Export failed",
          description: result.message || "Failed to export clients",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export error",
        description: "An error occurred while exporting clients",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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

  // Filter condition management
  const addFilterCondition = () => {
    setCurrentFilter(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'contains', value: '' }]
    }));
  };

  const updateFilterCondition = (index: number, key: keyof FilterCondition, value: string) => {
    setCurrentFilter(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [key]: value } : condition
      )
    }));
  };

  const removeFilterCondition = (index: number) => {
    setCurrentFilter(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  // Apply filter to clients
  const applyClientFilter = (clients: Client[], filter: ClientFilter): Client[] => {
    if (filter.conditions.length === 0) return clients;

    return clients.filter(client => {
      const results = filter.conditions.map(condition => {
        if (!condition.field || !condition.operator) return true;

        const getValue = (field: string): string => {
          switch (field) {
            case 'name': return getClientDisplayName(client);
            case 'company': return getBusinessDisplayName(client);
            case 'email': return client.email || '';
            case 'phone': return client.phone || '';
            case 'city': return client.city || '';
            case 'state': return client.state || '';
            case 'status': return client.status || '';
            case 'clientVertical': return client.clientVertical || '';
            case 'contactOwner': return getContactOwnerName(client.contactOwner) || '';
            case 'createdAt': return client.createdAt ? format(new Date(client.createdAt), 'yyyy-MM-dd') : '';
            default: return '';
          }
        };

        const fieldValue = getValue(condition.field).toLowerCase();
        const searchValue = condition.value.toLowerCase();

        switch (condition.operator) {
          case 'contains': return fieldValue.includes(searchValue);
          case 'equals': return fieldValue === searchValue;
          case 'starts_with': return fieldValue.startsWith(searchValue);
          case 'ends_with': return fieldValue.endsWith(searchValue);
          case 'not_equals': return fieldValue !== searchValue;
          case 'is_empty': return fieldValue === '';
          case 'is_not_empty': return fieldValue !== '';
          default: return true;
        }
      });

      return filter.logic === 'AND' 
        ? results.every(result => result)
        : results.some(result => result);
    });
  };

  // Save Smart List
  const handleSaveSmartList = async () => {
    try {
      // For now, we'll store in localStorage until backend is ready
      const smartList = {
        id: `smart-list-${Date.now()}`,
        name: smartListName,
        description: smartListDescription,
        filters: currentFilter,
        isDefault: false,
        createdAt: new Date()
      };

      const existingLists = JSON.parse(localStorage.getItem('smartLists') || '[]');
      existingLists.push(smartList);
      localStorage.setItem('smartLists', JSON.stringify(existingLists));

      toast({
        title: "Success",
        description: "Smart List saved successfully."
      });

      setSmartListName('');
      setSmartListDescription('');
      setIsSaveSmartListOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Smart List.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteClient = (id: string, clientName: string) => {
    if (confirm(`Are you sure you want to permanently delete "${clientName}"? This action cannot be undone and will remove all associated data including projects, campaigns, and invoices.`)) {
      deleteClientMutation.mutate(id);
    }
  };

  const renderCellContent = (client: Client, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <button
            onClick={() => setLocation(`/clients/${client.id}`)}
            className="text-blue-600 hover:text-blue-800 underline cursor-pointer text-left"
          >
            {getClientDisplayName(client)}
          </button>
        );
      case 'company':
        return getBusinessDisplayName(client) || '-';
      case 'phone':
        return client.phone ? formatPhoneNumber(client.phone) : '-';
      case 'email':
        return client.email;
      case 'contactOwner':
        return getContactOwnerName(client.contactOwner);
      case 'createdAt':
        return client.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy') : '-';
      case 'lastActivity':
        return client.lastActivity ? format(new Date(client.lastActivity), 'MMM dd, yyyy') : '-';
      case 'tags':
        return client.tags && client.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : '-';
      case 'city':
        return client.city || '-';
      case 'state':
        return client.state || '-';
      case 'clientVertical':
        return client.clientVertical || '-';
      case 'status':
        return (
          <Badge className={getStatusColor(client.status)}>
            {client.status}
          </Badge>
        );
      case 'website':
        return client.website ? (
          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
            {client.website}
          </a>
        ) : '-';
      case 'actions':
        return isAdmin ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleDeleteClient(client.id, getClientDisplayName(client))}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null;
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search, Import/Export, and Column Management */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
            id="csv-import"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('csv-import')?.click()}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setIsFilterOpen(true)}
            className={currentFilter.conditions.length > 0 ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {currentFilter.conditions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {currentFilter.conditions.length}
              </Badge>
            )}
          </Button>
          
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

      <Card>
        <CardContent className="p-0">
          <div className="w-full">
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
                  {filteredAndSortedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.size} className="text-center py-8 text-slate-500">
                        {searchTerm ? "No clients found matching your search." : "No clients yet. Add your first client to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-slate-50">
                        {AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key)).map((column) => (
                          <TableCell key={column.key} className="py-3">
                            {renderCellContent(client, column.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SimpleAddClientForm 
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Clients</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Smart Lists Section */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Smart Lists</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeSmartList === null ? "default" : "outline"}
                  onClick={() => {
                    setActiveSmartList(null);
                    setCurrentFilter({ conditions: [], logic: 'AND' });
                  }}
                  className="justify-start"
                >
                  All Clients
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSaveSmartListOpen(true)}
                  disabled={currentFilter.conditions.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Smart List
                </Button>
              </div>
            </div>

            {/* Filter Conditions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-slate-700">Filter Conditions</h3>
                <Select
                  value={currentFilter.logic}
                  onValueChange={(value) => setCurrentFilter(prev => ({ ...prev, logic: value as 'AND' | 'OR' }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {currentFilter.conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-slate-50">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateFilterCondition(index, 'field', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="company">Business</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="state">State</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="clientVertical">Client Vertical</SelectItem>
                        <SelectItem value="contactOwner">Contact Owner</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateFilterCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="starts_with">Starts with</SelectItem>
                        <SelectItem value="ends_with">Ends with</SelectItem>
                        <SelectItem value="not_equals">Not equals</SelectItem>
                        <SelectItem value="is_empty">Is empty</SelectItem>
                        <SelectItem value="is_not_empty">Is not empty</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateFilterCondition(index, 'value', e.target.value)}
                      className="flex-1"
                      disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilterCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addFilterCondition}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentFilter({ conditions: [], logic: 'AND' });
                  setActiveSmartList(null);
                }}
                disabled={currentFilter.conditions.length === 0}
              >
                Clear All
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Smart List Dialog */}
      <Dialog open={isSaveSmartListOpen} onOpenChange={setIsSaveSmartListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Smart List</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Enter smart list name"
                value={smartListName}
                onChange={(e) => setSmartListName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="Enter description"
                value={smartListDescription}
                onChange={(e) => setSmartListDescription(e.target.value)}
              />
            </div>

            <div className="text-sm text-slate-600">
              This will save your current filter conditions for easy reuse.
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsSaveSmartListOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSmartList}
                disabled={!smartListName.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Smart List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}