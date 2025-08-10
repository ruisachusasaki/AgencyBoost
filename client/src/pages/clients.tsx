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
import { Plus, Search, Trash2, Settings, ChevronUp, ChevronDown, Calendar, MoreHorizontal, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { SimpleAddClientForm } from "@/components/forms/simple-add-client-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatPhoneNumber } from "@/lib/utils";
import type { Client } from "@shared/schema";

type SortField = 'name' | 'company' | 'phone' | 'email' | 'contactOwner' | 'createdAt' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

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

  // For now, display all clients from current page as we handle filtering/sorting server-side later
  const filteredAndSortedClients = clients;

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
        <div className="flex items-center gap-2">
          {children}
          {isActive && (
            sortDirection === 'asc' ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
          )}
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

      {/* Search and Column Management */}
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
    </div>
  );
}