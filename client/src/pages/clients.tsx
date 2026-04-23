import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Settings, ChevronUp, ChevronDown, Calendar, MoreHorizontal, ChevronLeft, ChevronRight, Users, User, Upload, Download, Filter, Save, X, Share2, Globe, Lock, Database, Eye, AlertTriangle, Tag, Workflow } from "lucide-react";
import { SimpleAddClientForm } from "@/components/forms/simple-add-client-form";
import { ClientDeletionModal } from "@/components/client-deletion-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useHasPermissions, useRolePermissions } from "@/hooks/use-has-permission";
import { PermissionGate } from "@/components/PermissionGate";
import { format } from "date-fns";
import { formatPhoneNumber } from "@/lib/utils";
import type { Client } from "@shared/schema";

type SortField = 'client' | 'name' | 'phone' | 'email' | 'contactOwner' | 'createdAt' | 'lastActivity';
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
  alwaysVisible?: boolean;
}

const AVAILABLE_COLUMNS: Column[] = [
  { key: 'client', label: 'Client', sortable: true, defaultVisible: true, alwaysVisible: true },
  { key: 'name', label: 'Name', sortable: true, defaultVisible: true },
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
  
  // Bulk selection state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  // Filtering state — persisted to localStorage so the user's active filter,
  // smart list, and tab survive navigating away and back to the Clients page.
  const FILTER_STORAGE_KEY = 'clients.filterState.v1';
  type PersistedFilterState = {
    currentFilter: ClientFilter;
    activeSmartList: string | null;
    activeTab: string;
    showFollowedOnly: boolean;
  };
  const loadPersistedFilterState = (): Partial<PersistedFilterState> => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Partial<PersistedFilterState>;
      return parsed ?? {};
    } catch {
      return {};
    }
  };
  const persistedFilterState = React.useMemo(loadPersistedFilterState, []);

  const [showFollowedOnly, setShowFollowedOnly] = useState<boolean>(
    persistedFilterState.showFollowedOnly ?? false
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<ClientFilter>(
    persistedFilterState.currentFilter ?? {
      conditions: [],
      logic: 'AND'
    }
  );
  const [activeSmartList, setActiveSmartList] = useState<string | null>(
    persistedFilterState.activeSmartList ?? null
  );
  const [smartListName, setSmartListName] = useState("");
  const [smartListDescription, setSmartListDescription] = useState("");
  const [isSaveSmartListOpen, setIsSaveSmartListOpen] = useState(false);
  const [savedSmartLists, setSavedSmartLists] = useState<SmartList[]>([]);
  const [activeTab, setActiveTab] = useState<string>(persistedFilterState.activeTab ?? "all-clients");

  // Persist filter state on every change so it survives navigating away and back.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const toStore: PersistedFilterState = {
        currentFilter,
        activeSmartList,
        activeTab,
        showFollowedOnly,
      };
      window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore quota / privacy mode errors.
    }
  }, [currentFilter, activeSmartList, activeTab, showFollowedOnly]);
  const [isShareSmartListOpen, setIsShareSmartListOpen] = useState(false);
  const [shareListId, setShareListId] = useState<string | null>(null);
  const [shareWithUsers, setShareWithUsers] = useState<string[]>([]);
  const [shareVisibility, setShareVisibility] = useState<'personal' | 'shared' | 'universal'>('personal');
  
  // Smart list overflow handling
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const maxVisibleTabs = 4; // Show "All Clients" + up to 3 smart lists, then "More"
  
  // Smart list delete confirmation
  const [smartListToDelete, setSmartListToDelete] = useState<SmartList | null>(null);

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
    const rawValues = clients
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
      .filter((value): value is string => Boolean(value) && value !== '-');

    // Dedupe case-insensitively — prefer the capitalized (initcap) variant
    // so "active" and "Active" always collapse to "Active".
    const seen = new Map<string, string>();
    const initcap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    for (const value of rawValues) {
      const key = value.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, initcap(value));
      }
    }

    return Array.from(seen.values()).sort();
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
  
  // Granular clients permissions
  const { permissions: clientPermissions } = useHasPermissions([
    'clients.list.delete',
    'clients.list.export',
    'clients.details.edit',
    'clients.list.import',
  ]);
  
  // Check if user can perform any bulk actions (determines checkbox visibility)
  const canPerformBulkActions = clientPermissions['clients.list.delete'] || 
                                 clientPermissions['clients.list.export'] || 
                                 clientPermissions['clients.details.edit'];

  const { data: clientsData, isLoading } = useQuery<PaginatedClientsResponse>({
    queryKey: [`/api/clients?page=${currentPage}&limit=${pageSize}`],
  });

  const clients = clientsData?.clients || [];
  const pagination = clientsData?.pagination;

  // Fetch custom fields data for dynamic name display
  const { data: customFieldsData } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
    queryKey: ['/api/custom-fields'],
  });

  // Use ref to track if we've loaded preferences to avoid infinite loops (must be declared early)
  const hasLoadedPreferencesRef = React.useRef(false);

  // Dynamically create columns including all custom fields
  const availableColumns = React.useMemo(() => {
    // Start with all columns except 'actions' (which should always be last)
    const baseColumns = AVAILABLE_COLUMNS.filter(col => col.key !== 'actions');
    const actionsColumn = AVAILABLE_COLUMNS.find(col => col.key === 'actions');
    
    // Add all custom fields as columns (before actions)
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
    
    // Always add actions column last
    if (actionsColumn) {
      baseColumns.push(actionsColumn);
    }
    
    return baseColumns;
  }, [customFieldsData]);

  // Update visible columns when custom fields are loaded (only once when customFieldsData changes)
  // BUT: Skip this if we've already loaded saved preferences to prevent conflicts
  React.useEffect(() => {
    if (customFieldsData && customFieldsData.length > 0 && !hasLoadedPreferencesRef.current) {
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

  // Save view preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: { visibleColumns: string[] }) => {
      return apiRequest('POST', '/api/user-view-preferences/clients-table', { preferences });
    },
  });

  // Load saved column preferences on mount (runs once)
  React.useEffect(() => {
    if (savedPreferences !== undefined && !hasLoadedPreferencesRef.current) {
      if (savedPreferences?.preferences?.visibleColumns) {
        // Always include columns marked as alwaysVisible
        const alwaysVisibleKeys = AVAILABLE_COLUMNS.filter(col => col.alwaysVisible).map(col => col.key);
        const savedColumns = new Set(savedPreferences.preferences.visibleColumns);
        alwaysVisibleKeys.forEach(key => savedColumns.add(key));
        setVisibleColumns(savedColumns);
      }
      // Mark as loaded even if there were no saved preferences, so saving can work
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

  // Fetch tags for bulk actions
  const { data: tags = [] } = useQuery<Array<{ id: string; name: string; color: string }>>({
    queryKey: ['/api/tags'],
  });

  // Fetch workflows for bulk actions
  const { data: workflows = [] } = useQuery<Array<{ id: string; name: string; description?: string }>>({
    queryKey: ['/api/team-workflows'],
  });

  // Use role-based permission hook instead of hardcoded role checks
  const { canManageUniversalSmartLists } = useRolePermissions();

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

  // Save Smart List mutation
  const saveSmartListMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; filters: ClientFilter; visibility: 'personal' | 'shared' | 'universal'; sharedWith?: string[] }) => {
      return await apiRequest("POST", "/api/smart-lists", {
        name: data.name,
        description: data.description,
        entityType: "clients",
        filters: data.filters,
        visibility: data.visibility,
        sharedWith: data.sharedWith,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Smart List saved successfully."
      });
      setSmartListName('');
      setSmartListDescription('');
      setShareVisibility('personal');
      setShareWithUsers([]);
      setIsSaveSmartListOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save Smart List.",
        variant: "destructive"
      });
    }
  });

  // Delete Smart List mutation
  const deleteSmartListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/smart-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists"] });
      toast({
        title: "Smart List Deleted",
        variant: "default",
        description: "Smart List removed successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete Smart List.",
        variant: "destructive"
      });
    }
  });

  // Update Smart List mutation
  const updateSmartListMutation = useMutation({
    mutationFn: async (data: { id: string; visibility: 'personal' | 'shared' | 'universal'; sharedWith?: string[] }) => {
      return await apiRequest("PUT", `/api/smart-lists/${data.id}`, {
        visibility: data.visibility,
        sharedWith: data.sharedWith
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists"] });
      toast({
        title: "Sharing Updated",
        variant: "default",
        description: "Smart List sharing settings updated successfully."
      });
      setIsShareSmartListOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sharing settings.",
        variant: "destructive"
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      const response = await apiRequest('POST', '/api/clients/bulk-delete', { clientIds });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      clearSelection();
      
      if (data.errorCount > 0) {
        toast({
          title: "Partially completed",          description: `${data.successCount} client(s) deleted successfully. ${data.errorCount} failed. ${data.errors?.slice(0, 2).join('. ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Clients deleted",
          variant: "default",
          description: `${data.successCount} client(s) have been successfully deleted.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete clients. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ clientIds, updates }: { clientIds: string[], updates: any }) => {
      const response = await apiRequest('POST', '/api/clients/bulk-update', { clientIds, updates });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      clearSelection();
      
      if (data.errorCount > 0) {
        toast({
          title: "Partially completed",          description: `${data.successCount} client(s) updated successfully. ${data.errorCount} failed. ${data.errors?.slice(0, 2).join('. ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Clients updated",
          variant: "default",
          description: `${data.successCount} client(s) have been successfully updated.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update clients. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk add tag mutation
  const bulkAddTagMutation = useMutation({
    mutationFn: async ({ clientIds, tag }: { clientIds: string[], tag: string }) => {
      const response = await apiRequest('POST', '/api/clients/bulk-add-tag', { clientIds, tag });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      clearSelection();
      
      if (data.errorCount > 0) {
        toast({
          title: "Partially completed",          description: `Tag added to ${data.successCount} client(s). ${data.errorCount} failed. ${data.errors?.slice(0, 2).join('. ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tag added",
          variant: "default",
          description: `Tag added to ${data.successCount} client(s).`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk remove tag mutation
  const bulkRemoveTagMutation = useMutation({
    mutationFn: async ({ clientIds, tag }: { clientIds: string[], tag: string }) => {
      const response = await apiRequest('POST', '/api/clients/bulk-remove-tag', { clientIds, tag });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      clearSelection();
      
      if (data.errorCount > 0) {
        toast({
          title: "Partially completed",          description: `Tag removed from ${data.successCount} client(s). ${data.errorCount} failed. ${data.errors?.slice(0, 2).join('. ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tag removed",
          variant: "default",
          description: `Tag removed from ${data.successCount} client(s).`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk add to workflow mutation
  const bulkAddToWorkflowMutation = useMutation({
    mutationFn: async ({ clientIds, workflowId }: { clientIds: string[], workflowId: string }) => {
      const response = await apiRequest('POST', '/api/clients/bulk-add-to-workflow', { clientIds, workflowId });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      clearSelection();
      
      if (data.errorCount > 0) {
        toast({
          title: "Partially completed",          description: `${data.successCount} client(s) added to workflow. ${data.errorCount} failed. ${data.errors?.slice(0, 2).join('. ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Added to workflow",
          variant: "default",
          description: `${data.successCount} client(s) added to workflow.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add to workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const getClientPhoneNumber = useCallback((client: Client) => {
    if (!client || !customFieldsData) return client?.phone || "";
    
    if (!client.customFieldValues) {
      return client.phone || "";
    }
    
    const phoneField = customFieldsData.find(field => 
      field.name === 'Phone' || field.name === 'phone' || field.name === 'Mobile' || field.name === 'mobile'
    );
    
    const customFieldValues = client.customFieldValues as Record<string, any> || {};
    const phoneFromCustomField = phoneField ? customFieldValues[phoneField.id] || "" : "";
    
    if (phoneFromCustomField) {
      return phoneFromCustomField;
    }
    return client.phone || "";
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
            case 'client': return getBusinessDisplayName(client);
            case 'name': return getClientDisplayName(client);
            case 'email': return client.email || '';
            case 'phone': return getClientPhoneNumber(client);
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
    
    // Apply 'My Followed Clients' filter
    if (showFollowedOnly && currentUser?.id) {
      filtered = filtered.filter(client => 
        client.followers && client.followers.includes(currentUser.id)
      );
    }
    
    // Then apply search term filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client => {
        const name = getClientDisplayName(client).toLowerCase();
        const company = getBusinessDisplayName(client).toLowerCase(); 
        const email = (client.email || '').toLowerCase();
        const phone = getClientPhoneNumber(client).toLowerCase();
        
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
        case 'client':
          aValue = getBusinessDisplayName(a).toLowerCase();
          bValue = getBusinessDisplayName(b).toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = getClientPhoneNumber(a);
          bValue = getClientPhoneNumber(b);
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
  }, [clients, sortField, sortDirection, staff, customFieldsData, currentFilter, searchTerm, showFollowedOnly, currentUser]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all clients on current page
      const allClientIds = new Set(clients.map(client => client.id));
      setSelectedClients(allClientIds);
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(clientId);
      } else {
        newSet.delete(clientId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedClients(new Set());
  };

  // Bulk Actions Toolbar Component
  const BulkActionsToolbar = () => {
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
    const [bulkAssigneeDialogOpen, setBulkAssigneeDialogOpen] = useState(false);
    const [bulkAddTagDialogOpen, setBulkAddTagDialogOpen] = useState(false);
    const [bulkRemoveTagDialogOpen, setBulkRemoveTagDialogOpen] = useState(false);
    const [bulkWorkflowDialogOpen, setBulkWorkflowDialogOpen] = useState(false);
    const [tempAssignee, setTempAssignee] = useState("");
    const [tempTagToAdd, setTempTagToAdd] = useState("");
    const [tempTagToRemove, setTempTagToRemove] = useState("");
    const [tempWorkflow, setTempWorkflow] = useState("");

    const handleBulkDelete = () => {
      bulkDeleteMutation.mutate(Array.from(selectedClients));
      setBulkDeleteConfirmOpen(false);
    };

    const handleBulkAssignee = () => {
      if (!tempAssignee) return;
      bulkUpdateMutation.mutate({
        clientIds: Array.from(selectedClients),
        updates: { contactOwner: tempAssignee }
      });
      setBulkAssigneeDialogOpen(false);
      setTempAssignee("");
    };

    const handleBulkExport = async () => {
      try {
        setIsExporting(true);
        const response = await fetch('/api/clients/export', {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

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
          variant: "default",
          description: "Clients have been exported to CSV"
        });
      } catch (error) {
        toast({
          title: "Export failed",          description: "Failed to export clients",
          variant: "destructive"
        });
      } finally {
        setIsExporting(false);
      }
    };

    const handleBulkAddTag = () => {
      if (!tempTagToAdd) return;
      bulkAddTagMutation.mutate({
        clientIds: Array.from(selectedClients),
        tag: tempTagToAdd
      });
      setBulkAddTagDialogOpen(false);
      setTempTagToAdd("");
    };

    const handleBulkRemoveTag = () => {
      if (!tempTagToRemove) return;
      bulkRemoveTagMutation.mutate({
        clientIds: Array.from(selectedClients),
        tag: tempTagToRemove
      });
      setBulkRemoveTagDialogOpen(false);
      setTempTagToRemove("");
    };

    const handleBulkAddToWorkflow = () => {
      if (!tempWorkflow) return;
      bulkAddToWorkflowMutation.mutate({
        clientIds: Array.from(selectedClients),
        workflowId: tempWorkflow
      });
      setBulkWorkflowDialogOpen(false);
      setTempWorkflow("");
    };

    if (selectedClients.size === 0) return null;

    return (
      <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-primary">
            {selectedClients.size} client{selectedClients.size > 1 ? 's' : ''} selected
          </span>
          <Button variant="outline" size="sm" onClick={clearSelection} data-testid="button-clear-selection">
            Clear Selection
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Delete Button - requires delete permission */}
          <PermissionGate permission="clients.list.delete">
            <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" data-testid="button-bulk-delete">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete {selectedClients.size} client(s)?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete {selectedClients.size} client(s)? This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)} data-testid="button-cancel-bulk-delete">
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} data-testid="button-confirm-bulk-delete">
                    {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedClients.size} Client(s)`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGate>

          {/* Assignee Button */}
          <Dialog open={bulkAssigneeDialogOpen} onOpenChange={setBulkAssigneeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-assignee">
                <User className="h-4 w-4 mr-1" />
                Assignee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Assignee for {selectedClients.size} client(s)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempAssignee} onValueChange={setTempAssignee}>
                  <SelectTrigger data-testid="select-bulk-assignee">
                    <SelectValue placeholder="Select contact owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id} data-testid={`option-assignee-${member.id}`}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkAssigneeDialogOpen(false)} data-testid="button-cancel-bulk-assignee">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAssignee} disabled={!tempAssignee} data-testid="button-update-bulk-assignee">
                    Update Assignee
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Button - requires export permission */}
          <PermissionGate permission="clients.list.export">
            <Button variant="outline" size="sm" onClick={handleBulkExport} disabled={isExporting} data-testid="button-bulk-export">
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </PermissionGate>

          {/* Add Tag Button */}
          <Dialog open={bulkAddTagDialogOpen} onOpenChange={setBulkAddTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-add-tag">
                <Plus className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tag to {selectedClients.size} client(s)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempTagToAdd} onValueChange={setTempTagToAdd}>
                  <SelectTrigger data-testid="select-bulk-add-tag">
                    <SelectValue placeholder="Select tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name} data-testid={`option-add-tag-${tag.id}`}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkAddTagDialogOpen(false)} data-testid="button-cancel-bulk-add-tag">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAddTag} disabled={!tempTagToAdd} data-testid="button-update-bulk-add-tag">
                    Add Tag
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Remove Tag Button */}
          <Dialog open={bulkRemoveTagDialogOpen} onOpenChange={setBulkRemoveTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-remove-tag">
                <X className="h-4 w-4 mr-1" />
                Remove Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Tag from {selectedClients.size} client(s)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempTagToRemove} onValueChange={setTempTagToRemove}>
                  <SelectTrigger data-testid="select-bulk-remove-tag">
                    <SelectValue placeholder="Select tag to remove" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name} data-testid={`option-remove-tag-${tag.id}`}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkRemoveTagDialogOpen(false)} data-testid="button-cancel-bulk-remove-tag">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkRemoveTag} disabled={!tempTagToRemove} data-testid="button-update-bulk-remove-tag">
                    Remove Tag
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add to Workflow Button */}
          <Dialog open={bulkWorkflowDialogOpen} onOpenChange={setBulkWorkflowDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-workflow">
                <Share2 className="h-4 w-4 mr-1" />
                Add to Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add {selectedClients.size} client(s) to Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempWorkflow} onValueChange={setTempWorkflow}>
                  <SelectTrigger data-testid="select-bulk-workflow">
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id} data-testid={`option-workflow-${workflow.id}`}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkWorkflowDialogOpen(false)} data-testid="button-cancel-bulk-workflow">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAddToWorkflow} disabled={!tempWorkflow} data-testid="button-update-bulk-workflow">
                    Add to Workflow
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  // Import CSV handler
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",        description: "Please select a CSV file",
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
          variant: "default",
          description: `${result.imported} clients imported successfully`,
        });
        // Refresh the clients data
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      } else {
        toast({
          title: "Import failed",          description: result.message || "Failed to import clients",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import error",        description: "An error occurred while importing clients",
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
          variant: "default",
          description: "Clients exported successfully",
        });
      } else {
        const result = await response.json();
        toast({
          title: "Export failed",          description: result.message || "Failed to export clients",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export error",        description: "An error occurred while exporting clients",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    // Don't allow toggling always-visible columns
    const column = availableColumns.find(col => col.key === columnKey);
    if (column?.alwaysVisible) return;
    
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
    setShowFollowedOnly(false);
    setActiveTab(smartList.id);
    toast({
      title: "Smart List Applied",
      variant: "default",
      description: `Applied "${smartList.name}" filter.`
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "all-clients") {
      setActiveSmartList(null);
      setCurrentFilter({ conditions: [], logic: 'AND' });
      setShowFollowedOnly(false);
    } else {
      const smartList = getVisibleSmartLists().find(list => list.id === tabId);
      if (smartList) {
        setCurrentFilter(smartList.filters);
    setActiveSmartList(smartList.id);
    setShowFollowedOnly(false);
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
    handleUpdateSmartList(shareListId);
    setShareListId(null);
  };

  // Delete a Smart List
  const handleDeleteSmartList = (smartListId: string) => {
    const listToDelete = savedSmartLists.find(list => list.id === smartListId);
    
    if (!listToDelete) {
      toast({
        title: "Error",
        description: "Smart List not found.",
        variant: "destructive"
      });
      return;
    }

    if (listToDelete.createdBy !== currentUser?.id && !canManageUniversalSmartLists) {
      toast({
        title: "Permission Denied",        description: "You can only delete Smart Lists you created.",
        variant: "destructive"
      });
      return;
    }

    // Clear active smart list if it's being deleted
    if (activeSmartList === smartListId) {
      setActiveSmartList(null);
      setActiveTab("all-clients");
      setCurrentFilter({ conditions: [], logic: 'AND' });
    }

    deleteSmartListMutation.mutate(smartListId);
  };

  const handleUpdateSmartList = (smartListId: string) => {
    if (!shareVisibility) return;

    updateSmartListMutation.mutate({
      id: smartListId,
      visibility: shareVisibility,
      sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined,
    });
  };

  // Save Smart List
  const handleSaveSmartList = async () => {
    if (!smartListName.trim()) {
      toast({
        title: "Validation Error",        description: "Smart List name is required.",
        variant: "destructive"
      });
      return;
    }

    if (shareVisibility === 'shared' && (!shareWithUsers || shareWithUsers.length === 0)) {
      toast({
        title: "Validation Error",        description: "Please select at least one user to share with.",
        variant: "destructive"
      });
      return;
    }

    saveSmartListMutation.mutate({
      name: smartListName,
      description: smartListDescription,
      filters: currentFilter,
      visibility: shareVisibility,
      sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined,
    });
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
      case 'client':
        return (
          <button
            onClick={() => setLocation(`/clients/${client.id}`)}
            className="text-blue-600 hover:text-blue-800 underline cursor-pointer text-left"
          >
            {getBusinessDisplayName(client) || getClientDisplayName(client)}
          </button>
        );
      case 'name':
        return getClientDisplayName(client) || '-';
      case 'phone':
        const phoneNum = getClientPhoneNumber(client);
        return phoneNum ? formatPhoneNumber(phoneNum) : '-';
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
        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <PermissionGate permission="clients.list.delete">
                  <DropdownMenuItem
                    onClick={() => handleDeleteClient(client.id, getClientDisplayName(client))}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Client
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
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
        <PermissionGate permission="clients.details.edit">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </PermissionGate>
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
                            if ('smartList' in tab) {
                              setSmartListToDelete(tab.smartList);
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
                                      if ('smartList' in tab) {
                                        setSmartListToDelete(tab.smartList);
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
          {clientPermissions['clients.list.import'] && (
            <>
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
            </>
          )}
          
          {clientPermissions['clients.list.export'] && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowFollowedOnly(!showFollowedOnly)}
            className={`${showFollowedOnly ? 'bg-primary/10 border-primary text-primary' : ''}`}
            data-testid="button-my-followed-clients"
          >
            <Users className="h-4 w-4 mr-2" />
            My Followed
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
              {availableColumns
                .filter((column) => !column.alwaysVisible)
                .map((column) => (
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
          {/* Bulk Actions Toolbar */}
          {filteredAndSortedClients.length > 0 && (
            <div className="p-4 pb-0">
              <BulkActionsToolbar />
            </div>
          )}
          
          <div className="w-full">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    {/* Checkbox column - only show if user can perform bulk actions */}
                    {canPerformBulkActions && (
                      <TableHead className="w-12">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedClients.size > 0 && selectedClients.size === filteredAndSortedClients.length}
                            onCheckedChange={handleSelectAll}
                            data-testid="select-all-clients"
                            className="bulk-select-checkbox"
                          />
                        </div>
                      </TableHead>
                    )}
                    
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
                      <TableCell colSpan={visibleColumns.size + 1} className="text-center py-8 text-slate-500">
                        {searchTerm ? "No clients found matching your search." : "No clients yet. Add your first client to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-slate-50">
                        {/* Checkbox cell - only show if user can perform bulk actions */}
                        {canPerformBulkActions && (
                          <TableCell className="py-3">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={selectedClients.has(client.id)}
                                onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                                data-testid={`select-client-${client.id}`}
                                className="bulk-select-checkbox"
                              />
                            </div>
                          </TableCell>
                        )}
                        
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
              {(() => {
                const isFiltered =
                  filteredAndSortedClients.length !== clients.length;
                if (isFiltered) {
                  const visible = filteredAndSortedClients.length;
                  return visible === 0
                    ? `Showing 0 of ${pagination.total} clients`
                    : `Showing 1 to ${visible} of ${visible} clients (filtered from ${pagination.total})`;
                }
                return `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} clients`;
              })()}
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
      setShowFollowedOnly(false);
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
                            onClick={() => setSmartListToDelete(smartList)}
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

      {/* Smart List Delete Confirmation Dialog */}
      <AlertDialog open={!!smartListToDelete} onOpenChange={(open) => !open && setSmartListToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Smart List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{smartListToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSmartListToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (smartListToDelete) {
                  handleDeleteSmartList(smartListToDelete.id);
                  setSmartListToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}