import React, { useState, useMemo, useCallback } from "react";
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
import { Plus, Search, Trash2, Settings, ChevronUp, ChevronDown, Calendar, MoreHorizontal, ChevronLeft, ChevronRight, Users, Upload, Download, Filter, Save, X, Share2, Globe, Lock, Database, Eye, AlertTriangle } from "lucide-react";
import { SimpleAddClientForm } from "@/components/forms/simple-add-client-form";
import { ClientDeletionModal } from "@/components/client-deletion-modal";
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
  createdBy: string;
  visibility: 'personal' | 'shared' | 'universal';
  sharedWith?: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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
  const [savedSmartLists, setSavedSmartLists] = useState<SmartList[]>([]);
  const [activeTab, setActiveTab] = useState("all-clients");
  const [isShareSmartListOpen, setIsShareSmartListOpen] = useState(false);
  const [shareListId, setShareListId] = useState<string | null>(null);
  const [shareWithUsers, setShareWithUsers] = useState<string[]>([]);
  const [shareVisibility, setShareVisibility] = useState<'personal' | 'shared' | 'universal'>('personal');
  
  // Smart list overflow handling
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const maxVisibleTabs = 4; // Show "All Clients" + up to 3 smart lists, then "More"

  // Get unique values for dropdown fields from actual client data or custom field options
  const getFieldOptions = (fieldName: string): string[] => {
    if (!clients || clients.length === 0) return [];
    
    // Check if this is a custom field name
    const customField = customFieldsData?.find(cf => cf.name === fieldName);
    if (customField && customField.options && customField.options.length > 0) {
      // Return the predefined options from the custom field
      return customField.options.sort();
    }
    
    // For non-custom fields or custom fields without predefined options, get values from client data
    const values = clients
      .map(client => {
        switch (fieldName) {
          case 'status': return client.status;
          case 'state': return client.state;
          case 'city': return client.city;
          case 'contactOwner': return getContactOwnerName(client.contactOwner);
          default: {
            // Handle custom fields - look in customFieldValues
            if (customField && client.customFieldValues) {
              const customFieldValues = client.customFieldValues as Record<string, any>;
              return customFieldValues[customField.id] || null;
            }
            return null;
          }
        }
      })
      .filter((value): value is string => Boolean(value) && value !== '-')
      .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
      .sort();
    
    return values;
  };

  // Check if a field should use dropdown for value selection
  const isDropdownField = (fieldName: string): boolean => {
    // Check if it's a custom field with options
    const customField = customFieldsData?.find(cf => cf.name === fieldName);
    if (customField && (customField.type === 'dropdown' || customField.type === 'dropdown_multiple')) {
      return true;
    }
    
    // Standard fields that should have dropdowns
    return ['status', 'state', 'city', 'contactOwner'].includes(fieldName);
  };

  // Get count for a specific smart list (independent of current active filter)
  const getSmartListCount = (smartList: SmartList): number => {
    if (!clients || clients.length === 0) return 0;
    return applyClientFilter(clients, smartList.filters).length;
  };


  
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

  // Dynamically create columns including all custom fields
  const availableColumns = React.useMemo(() => {
    const baseColumns = [...AVAILABLE_COLUMNS];
    
    // Add all custom fields as columns
    if (customFieldsData && customFieldsData.length > 0) {
      customFieldsData.forEach(field => {
        // Check if a column with this name already exists (like 'Client Vertical')
        const existingColumn = baseColumns.find(col => 
          col.label.toLowerCase() === field.name.toLowerCase()
        );
        
        if (!existingColumn) {
          // Add new custom field as column
          baseColumns.push({
            key: `customField_${field.id}`,
            label: field.name,
            sortable: true,
            defaultVisible: false
          });
        }
      });
    }
    
    return baseColumns;
  }, [customFieldsData]);

  // Update visible columns when custom fields are loaded (only once when customFieldsData changes)
  React.useEffect(() => {
    if (customFieldsData && customFieldsData.length > 0) {
      // Keep existing visible columns, just ensure they're valid
      setVisibleColumns(prev => {
        const validKeys = new Set(availableColumns.map(col => col.key));
        const filtered = new Set([...prev].filter(key => validKeys.has(key)));
        // Only update if there's actually a change to prevent infinite loops
        if (filtered.size !== prev.size || ![...filtered].every(key => prev.has(key))) {
          return filtered;
        }
        return prev;
      });
    }
  }, [customFieldsData]); // Only depend on customFieldsData, not availableColumns

  // Fetch current user role to check admin permissions
  const { data: currentUser } = useQuery<{ id: string; role: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  // Load saved view preferences for this user
  const { data: savedPreferences } = useQuery({
    queryKey: ['/api/user-view-preferences/clients-table'],
    enabled: !!currentUser?.id,
  });

  // Use ref to track if we've loaded preferences to avoid infinite loops
  const hasLoadedPreferencesRef = React.useRef(false);

  // Save view preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: { visibleColumns: string[] }) => {
      return apiRequest('/api/user-view-preferences/clients-table', {
        method: 'POST',
        body: JSON.stringify({ preferences }),
      });
    },
  });

  // Load saved column preferences on mount (runs once)
  React.useEffect(() => {
    if (savedPreferences && !hasLoadedPreferencesRef.current) {
      if (savedPreferences.preferences?.visibleColumns) {
        setVisibleColumns(new Set(savedPreferences.preferences.visibleColumns));
      }
      hasLoadedPreferencesRef.current = true;
    }
  }, [savedPreferences]);

  // Save column preferences when they change (with debounce)
  React.useEffect(() => {
    // Only save after initial load is complete
    if (!hasLoadedPreferencesRef.current || !currentUser?.id) return;
    
    const timeoutId = setTimeout(() => {
      const visibleColumnsArray = Array.from(visibleColumns);
      savePreferencesMutation.mutate({ visibleColumns: visibleColumnsArray });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, currentUser?.id]);

  // Fetch staff data to display contact owner names
  const { data: staff = [] } = useQuery<Array<{ id: string; firstName: string; lastName: string }>>({
    queryKey: ['/api/staff'],
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'Admin';

  // Load Smart Lists from database
  const { data: smartListsData = [] } = useQuery<SmartList[]>({
    queryKey: ['/api/smart-lists', { entityType: 'clients' }],
    enabled: !!currentUser, // Only run query when currentUser is available
  });

  // Update savedSmartLists when data is fetched from database
  React.useEffect(() => {
    if (smartListsData) {
      setSavedSmartLists(smartListsData);
    }
  }, [smartListsData]);

  // Helper function to get contact owner display name
  const getContactOwnerName = (contactOwnerId: string | null) => {
    if (!contactOwnerId || !staff) return '-';
    const staffMember = staff.find(s => s.id === contactOwnerId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : '-';
  };

  // Helper functions to get dynamic names from custom fields - memoized to prevent infinite re-renders
  const getClientDisplayName = useCallback((client: Client) => {
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
  }, [customFieldsData]);

  const getBusinessDisplayName = useCallback((client: Client) => {
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
  }, [customFieldsData]);


  // Apply filter to clients - memoized to prevent infinite re-renders
  const applyClientFilter = useCallback((clients: Client[], filter: ClientFilter): Client[] => {
    console.log('Applying filter with conditions:', filter.conditions);
    console.log('Filter logic:', filter.logic);
    
    if (filter.conditions.length === 0) {
      console.log('No filter conditions, returning all clients');
      return clients;
    }

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
            case 'contactOwner': return getContactOwnerName(client.contactOwner) || '';
            case 'createdAt': return client.createdAt ? format(new Date(client.createdAt), 'yyyy-MM-dd') : '';
            default: {
              // Check if this is a custom field by name
              if (!customFieldsData || !client.customFieldValues) return '';
              
              const customField = customFieldsData.find(cf => cf.name === field);
              if (customField && client.customFieldValues) {
                const customFieldValues = client.customFieldValues as Record<string, any>;
                const value = customFieldValues[customField.id] || '';
                console.log(`Custom field lookup for '${field}' (${customField.id}): '${value}' in client:`, client.name);
                return value;
              }
              
              console.log(`Custom field '${field}' not found in`, customFieldsData?.map(cf => cf.name));
              return '';
            }
          }
        };

        const fieldValue = getValue(condition.field).toLowerCase();
        const searchValue = condition.value.toLowerCase();
        
        console.log(`Filter condition: ${condition.field} ${condition.operator} ${condition.value}`);
        console.log(`Field value: "${fieldValue}", Search value: "${searchValue}"`);

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
  }, [customFieldsData, getClientDisplayName, getBusinessDisplayName]);

  // Apply filtering and sorting to clients
  const filteredAndSortedClients = useMemo(() => {
    if (!clients || clients.length === 0) return clients;

    console.log('Current filter state:', currentFilter);
    console.log('Active Smart List:', activeSmartList);
    console.log('Search term:', searchTerm);

    // First apply filters
    let filtered = applyClientFilter(clients, currentFilter);
    
    // Then apply search term filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client => {
        const name = getClientDisplayName(client).toLowerCase();
        const company = getBusinessDisplayName(client).toLowerCase(); 
        const email = (client.email || '').toLowerCase();
        const phone = (client.phone || '').toLowerCase();
        
        return name.includes(searchLower) || 
               company.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower);
      });
    }

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
  }, [clients, sortField, sortDirection, staff, customFieldsData, currentFilter, searchTerm]);

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

  // Load a Smart List
  const handleLoadSmartList = (smartList: SmartList) => {
    setCurrentFilter(smartList.filters);
    setActiveSmartList(smartList.id);
    setActiveTab(smartList.id);
    toast({
      title: "Smart List Applied",
      description: `Applied "${smartList.name}" filter.`
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "all-clients") {
      setActiveSmartList(null);
      setCurrentFilter({ conditions: [], logic: 'AND' });
    } else {
      const smartList = getVisibleSmartLists().find(list => list.id === tabId);
      if (smartList) {
        setCurrentFilter(smartList.filters);
        setActiveSmartList(smartList.id);
      }
    }
  };

  // Filter Smart Lists based on user permissions
  const getVisibleSmartLists = () => {
    const currentUserId = currentUser?.id || 'current-user';
    return savedSmartLists.filter(list => {
      // Personal lists - only visible to creator
      if (list.visibility === 'personal') {
        return list.createdBy === currentUserId;
      }
      // Shared lists - visible to creator and shared users
      if (list.visibility === 'shared') {
        return list.createdBy === currentUserId || 
               (list.sharedWith && list.sharedWith.includes(currentUserId));
      }
      // Universal lists - visible to everyone
      if (list.visibility === 'universal') {
        return true;
      }
      return false;
    });
  };

  // Share a Smart List
  const handleShareSmartList = (smartListId: string) => {
    const smartList = savedSmartLists.find(list => list.id === smartListId);
    if (smartList && smartList.createdBy === (currentUser?.id || 'current-user')) {
      setShareListId(smartListId);
      setShareVisibility(smartList.visibility);
      setShareWithUsers(smartList.sharedWith || []);
      setIsShareSmartListOpen(true);
    }
  };

  // Update Smart List sharing
  const handleUpdateSharing = () => {
    if (!shareListId) return;
    try {
      const updatedLists = savedSmartLists.map(list => {
        if (list.id === shareListId) {
          return {
            ...list,
            visibility: shareVisibility,
            sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined,
            updatedAt: new Date()
          };
        }
        return list;
      });
      
      setSavedSmartLists(updatedLists);
      localStorage.setItem('smartLists', JSON.stringify(updatedLists));
      
      toast({
        title: "Sharing Updated",
        description: "Smart List sharing settings updated successfully."
      });
      
      setIsShareSmartListOpen(false);
      setShareListId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sharing settings.",
        variant: "destructive"
      });
    }
  };

  // Delete a Smart List
  const handleDeleteSmartList = (smartListId: string) => {
    try {
      const smartList = savedSmartLists.find(list => list.id === smartListId);
      const currentUserId = currentUser?.id || 'current-user';
      
      // Only allow deletion if user is the creator
      // Handle legacy Smart Lists that might not have proper user IDs
      const canDelete = !smartList?.createdBy || 
                       smartList.createdBy === currentUserId || 
                       smartList.createdBy === 'current-user';
      
      if (!canDelete) {
        toast({
          title: "Permission Denied",
          description: "You can only delete Smart Lists you created.",
          variant: "destructive"
        });
        return;
      }

      const updatedLists = savedSmartLists.filter(list => list.id !== smartListId);
      setSavedSmartLists(updatedLists);
      localStorage.setItem('smartLists', JSON.stringify(updatedLists));
      
      if (activeSmartList === smartListId) {
        setActiveSmartList(null);
        setActiveTab("all-clients");
        setCurrentFilter({ conditions: [], logic: 'AND' });
      }

      toast({
        title: "Smart List Deleted",
        description: "Smart List removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Smart List.",
        variant: "destructive"
      });
    }
  };

  // Save Smart List
  const handleSaveSmartList = async () => {
    try {
      console.log('Saving Smart List with currentFilter:', currentFilter);
      console.log('Current filter conditions:', currentFilter.conditions);
      
      const smartList: SmartList = {
        id: `smart-list-${Date.now()}`,
        name: smartListName,
        description: smartListDescription,
        filters: currentFilter,
        createdBy: currentUser?.id || 'current-user',
        visibility: shareVisibility,
        sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedLists = [...savedSmartLists, smartList];
      setSavedSmartLists(updatedLists);
      localStorage.setItem('smartLists', JSON.stringify(updatedLists));

      toast({
        title: "Success",
        description: "Smart List saved successfully."
      });

      setSmartListName('');
      setSmartListDescription('');
      setShareVisibility('personal');
      setShareWithUsers([]);
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

  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDeleteClient = (id: string, clientName: string) => {
    setClientToDelete({id, name: clientName});
    setShowDeletionModal(true);
  };

  const handleDeletionSuccess = () => {
    // Refresh the client list after successful deletion/archiving/reassignment
    queryClient.invalidateQueries({ queryKey: [`/api/clients?page=${currentPage}&limit=${pageSize}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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
        // Check standard field first, then custom field
        if (client.city) return client.city;
        // Check if there's a custom field named "City"
        const cityCustomField = customFieldsData?.find(cf => cf.name.toLowerCase() === 'city');
        if (cityCustomField && client.customFieldValues) {
          const customFieldValues = client.customFieldValues as Record<string, any>;
          return customFieldValues[cityCustomField.id] || '-';
        }
        return '-';
      case 'state':
        // Check standard field first, then custom field
        if (client.state) return client.state;
        // Check if there's a custom field named "State"
        const stateCustomField = customFieldsData?.find(cf => cf.name.toLowerCase() === 'state');
        if (stateCustomField && client.customFieldValues) {
          const customFieldValues = client.customFieldValues as Record<string, any>;
          return customFieldValues[stateCustomField.id] || '-';
        }
        return '-';
      case 'clientVertical':
        // Handle Client Vertical as a custom field
        if (!customFieldsData || !client.customFieldValues) return '-';
        const clientVerticalField = customFieldsData.find(cf => cf.name === 'Client Vertical');
        if (clientVerticalField && client.customFieldValues) {
          const customFieldValues = client.customFieldValues as Record<string, any>;
          return customFieldValues[clientVerticalField.id] || '-';
        }
        return '-';
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
        // Handle custom field columns (key format: customField_{fieldId})
        if (columnKey.startsWith('customField_')) {
          const fieldId = columnKey.replace('customField_', '');
          if (!client.customFieldValues) return '-';
          const customFieldValues = client.customFieldValues as Record<string, any>;
          return customFieldValues[fieldId] || '-';
        }
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {(() => {
            const allTabs = [
              { id: "all-clients", name: "All Clients", icon: Database, count: clients.length },
              ...getVisibleSmartLists().map(smartList => ({
                id: smartList.id,
                name: smartList.name,
                icon: smartList.visibility === 'personal' ? Lock : 
                      smartList.visibility === 'shared' ? Share2 : Globe,
                count: getSmartListCount(smartList),
                smartList: smartList
              }))
            ];

            const needsMoreDropdown = allTabs.length > maxVisibleTabs;
            const visibleTabs = needsMoreDropdown ? allTabs.slice(0, maxVisibleTabs - 1) : allTabs;
            const hiddenTabs = needsMoreDropdown ? allTabs.slice(maxVisibleTabs - 1) : [];

            const renderTab = (tab: any) => {
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name} ({tab.count})
                  </button>
                  {'smartList' in tab && (
                    !tab.smartList.createdBy || 
                    tab.smartList.createdBy === (currentUser?.id || 'current-user') || 
                    tab.smartList.createdBy === 'current-user'
                  ) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => 'smartList' in tab && handleShareSmartList(tab.smartList.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if ('smartList' in tab && confirm(`Delete "${tab.smartList.name}"?`)) {
                              handleDeleteSmartList(tab.smartList.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            };

            return (
              <>
                {visibleTabs.map(renderTab)}
                {needsMoreDropdown && (
                  <DropdownMenu open={isMoreDropdownOpen} onOpenChange={setIsMoreDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                          hiddenTabs.some(tab => activeTab === tab.id)
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        More ({hiddenTabs.length})
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      {hiddenTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <div key={tab.id} className="flex items-center justify-between">
                            <DropdownMenuItem
                              onClick={() => handleTabChange(tab.id)}
                              className={`flex-1 ${
                                activeTab === tab.id ? "bg-primary/10 text-primary" : ""
                              }`}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {tab.name} ({tab.count})
                            </DropdownMenuItem>
                            {'smartList' in tab && (
                              !tab.smartList.createdBy || 
                              tab.smartList.createdBy === (currentUser?.id || 'current-user') || 
                              tab.smartList.createdBy === 'current-user'
                            ) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => 'smartList' in tab && handleShareSmartList(tab.smartList.id)}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share Settings
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      if ('smartList' in tab && confirm(`Delete "${tab.smartList.name}"?`)) {
                                        handleDeleteSmartList(tab.smartList.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            );
          })()}
        </nav>
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
            <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
              {availableColumns.map((column) => (
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
                    {availableColumns.filter(col => visibleColumns.has(col.key)).map((column) => {
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
                        {availableColumns.filter(col => visibleColumns.has(col.key)).map((column) => (
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
              <div className="space-y-2">
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
                
                {savedSmartLists.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-2 mt-4">Saved Smart Lists</h4>
                    <div className="space-y-1">
                      {savedSmartLists.map((smartList) => (
                        <div key={smartList.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border">
                          <div className="flex-1 min-w-0">
                            <Button
                              variant="ghost"
                              onClick={() => handleLoadSmartList(smartList)}
                              className={`justify-start p-0 h-auto font-normal text-left truncate ${
                                activeSmartList === smartList.id ? 'text-blue-600 font-medium' : 'text-slate-700'
                              }`}
                            >
                              {smartList.name}
                              {smartList.description && (
                                <span className="block text-xs text-slate-500 truncate">
                                  {smartList.description}
                                </span>
                              )}
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete "${smartList.name}"?`)) {
                                handleDeleteSmartList(smartList.id);
                              }
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                        <SelectItem value="contactOwner">Contact Owner</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        {/* Add custom fields */}
                        {customFieldsData?.map((field) => (
                          <SelectItem key={field.id} value={field.name}>
                            {field.name}
                          </SelectItem>
                        ))}
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

                    {isDropdownField(condition.field) ? (
                      <Select
                        value={condition.value}
                        onValueChange={(value) => updateFilterCondition(index, 'value', value)}
                        disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFieldOptions(condition.field).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => updateFilterCondition(index, 'value', e.target.value)}
                        className="flex-1"
                        disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                      />
                    )}

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Smart List</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
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

            {/* Visibility Settings */}
            <div>
              <label className="text-sm font-medium mb-3 block">Visibility</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="personal"
                    name="visibility"
                    value="personal"
                    checked={shareVisibility === 'personal'}
                    onChange={(e) => setShareVisibility(e.target.value as 'personal' | 'shared' | 'universal')}
                    className="text-blue-600"
                  />
                  <label htmlFor="personal" className="flex items-center text-sm">
                    <Lock className="h-4 w-4 mr-2 text-gray-500" />
                    Personal - Only visible to you
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="shared"
                    name="visibility"
                    value="shared"
                    checked={shareVisibility === 'shared'}
                    onChange={(e) => setShareVisibility(e.target.value as 'personal' | 'shared' | 'universal')}
                    className="text-blue-600"
                  />
                  <label htmlFor="shared" className="flex items-center text-sm">
                    <Share2 className="h-4 w-4 mr-2 text-gray-500" />
                    Shared - Visible to specific users
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="universal"
                    name="visibility"
                    value="universal"
                    checked={shareVisibility === 'universal'}
                    onChange={(e) => setShareVisibility(e.target.value as 'personal' | 'shared' | 'universal')}
                    className="text-blue-600"
                  />
                  <label htmlFor="universal" className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                    Universal - Visible to all users
                  </label>
                </div>
              </div>
            </div>

            {shareVisibility === 'shared' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Share with specific users
                </label>
                <div className="text-xs text-gray-600 mb-2">
                  Select staff members who can access this Smart List
                </div>
                <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                  {staff.map((staffMember) => (
                    <div key={staffMember.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`staff-${staffMember.id}`}
                        checked={shareWithUsers.includes(staffMember.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setShareWithUsers([...shareWithUsers, staffMember.id]);
                          } else {
                            setShareWithUsers(shareWithUsers.filter(id => id !== staffMember.id));
                          }
                        }}
                      />
                      <label htmlFor={`staff-${staffMember.id}`} className="text-sm">
                        {staffMember.firstName} {staffMember.lastName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSaveSmartListOpen(false);
                  setSmartListName('');
                  setSmartListDescription('');
                  setShareVisibility('personal');
                  setShareWithUsers([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSmartList}
                disabled={!smartListName.trim() || (shareVisibility === 'shared' && shareWithUsers.length === 0)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Smart List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Smart List Dialog */}
      <Dialog open={isShareSmartListOpen} onOpenChange={setIsShareSmartListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Smart List</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {shareListId && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">
                  {savedSmartLists.find(list => list.id === shareListId)?.name}
                </div>
                <div className="text-xs text-blue-600">
                  {savedSmartLists.find(list => list.id === shareListId)?.description}
                </div>
              </div>
            )}

            {/* Visibility Settings */}
            <div>
              <label className="text-sm font-medium mb-3 block">Visibility Settings</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="share-personal"
                    name="share-visibility"
                    value="personal"
                    checked={shareVisibility === 'personal'}
                    onChange={(e) => setShareVisibility(e.target.value as 'personal' | 'shared' | 'universal')}
                    className="text-blue-600"
                  />
                  <label htmlFor="share-personal" className="flex items-center text-sm">
                    <Lock className="h-4 w-4 mr-2 text-gray-500" />
                    Personal - Only visible to you
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="share-shared"
                    name="share-visibility"
                    value="shared"
                    checked={shareVisibility === 'shared'}
                    onChange={(e) => setShareVisibility(e.target.value as 'personal' | 'shared' | 'universal')}
                    className="text-blue-600"
                  />
                  <label htmlFor="share-shared" className="flex items-center text-sm">
                    <Share2 className="h-4 w-4 mr-2 text-gray-500" />
                    Shared - Visible to specific users
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="share-universal"
                    name="share-visibility"
                    value="universal"
                    checked={shareVisibility === 'universal'}
                    onChange={(e) => setShareVisibility(e.target.value as 'personal' | 'shared' | 'universal')}
                    className="text-blue-600"
                  />
                  <label htmlFor="share-universal" className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                    Universal - Visible to all users
                  </label>
                </div>
              </div>
            </div>

            {shareVisibility === 'shared' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Share with specific users
                </label>
                <div className="text-xs text-gray-600 mb-2">
                  Select staff members who can access this Smart List
                </div>
                <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                  {staff.map((staffMember) => (
                    <div key={staffMember.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`share-staff-${staffMember.id}`}
                        checked={shareWithUsers.includes(staffMember.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setShareWithUsers([...shareWithUsers, staffMember.id]);
                          } else {
                            setShareWithUsers(shareWithUsers.filter(id => id !== staffMember.id));
                          }
                        }}
                      />
                      <label htmlFor={`share-staff-${staffMember.id}`} className="text-sm">
                        {staffMember.firstName} {staffMember.lastName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsShareSmartListOpen(false);
                  setShareListId(null);
                  setShareWithUsers([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSharing}
                disabled={shareVisibility === 'shared' && shareWithUsers.length === 0}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Update Sharing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guided Client Deletion Modal */}
      <ClientDeletionModal
        isOpen={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
        client={clientToDelete}
        onSuccess={handleDeletionSuccess}
      />
    </div>
  );
}