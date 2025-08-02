import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Settings, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import ClientForm from "@/components/forms/client-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
];

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.key))
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

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

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort clients
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'company':
          aValue = (a.company || '').toLowerCase();
          bValue = (b.company || '').toLowerCase();
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'contactOwner':
          aValue = (a.contactOwner || '').toLowerCase();
          bValue = (b.contactOwner || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity || 0).getTime();
          bValue = new Date(b.lastActivity || 0).getTime();
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, sortField, sortDirection]);

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

  const handleDeleteClient = (id: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClientMutation.mutate(id);
    }
  };

  const renderCellContent = (client: Client, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return client.name;
      case 'company':
        return client.company || '-';
      case 'phone':
        return client.phone || '-';
      case 'email':
        return client.email;
      case 'contactOwner':
        return client.contactOwner || '-';
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
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
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
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key)).map((column) => {
                    if (column.sortable) {
                      return (
                        <SortableHeader key={column.key} column={column.key as SortField}>
                          {column.label}
                        </SortableHeader>
                      );
                    } else {
                      return (
                        <TableHead key={column.key}>
                          {column.label}
                        </TableHead>
                      );
                    }
                  })}
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.size + 1} className="text-center py-8 text-slate-500">
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
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingClient(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm
              client={editingClient}
              onSuccess={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}