import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Database, Plus, Edit, Trash2, Folder, Type, Hash, Calendar, Link as LinkIcon, DollarSign, Mail, Phone, CheckSquare, Search, FolderOpen, Users, ChevronUp, ChevronDown, GripVertical, ArrowLeft, Radio, AlignLeft, List, X, Upload } from "lucide-react";
import { Link } from "wouter";
import type { CustomField, CustomFieldFolder } from "@shared/schema";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const fieldTypeIcons = {
  text: Type,
  email: Mail,
  phone: Phone,
  number: Hash,
  date: Calendar,
  url: LinkIcon,
  currency: DollarSign,
  dropdown: List,
  checkbox: CheckSquare,
  multiline: AlignLeft,
  dropdown_multiple: List,
  radio: Radio,
  file_upload: Upload,
  contact_card: Users
};

type SortField = 'name' | 'type' | 'folder' | 'required';
type SortOrder = 'asc' | 'desc';

export default function CustomFields() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all-fields");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    required: false,
    folderId: "",
    options: [] as string[],
    placeholderText: "",
    tooltipText: ""
  });

  const [newFolder, setNewFolder] = useState({
    name: "",
    description: ""
  });

  // Fetch custom fields with search
  const { data: customFields = [], isLoading } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields", searchTerm],
    queryFn: async () => {
      const url = `/api/custom-fields${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      return response.json();
    },
  });

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<CustomFieldFolder[]>({
    queryKey: ["/api/custom-field-folders"],
    queryFn: async () => {
      const response = await fetch("/api/custom-field-folders", { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Get fields for a specific folder, sorted by order
  const getFieldsForFolder = (folderId: string) => {
    return customFields
      .filter(field => field.folderId === folderId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Add field mutation
  const addFieldMutation = useMutation({
    mutationFn: async (data: typeof newField) => {
      const payload = { ...data, folderId: data.folderId || null };
      const response = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({ title: "Success", description: "Custom field created successfully." });
      setIsAddFieldDialogOpen(false);
      setNewField({ name: "", type: "text", required: false, folderId: "", options: [], placeholderText: "", tooltipText: "" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create field" });
    }
  });

  // Add folder mutation
  const addFolderMutation = useMutation({
    mutationFn: async (data: typeof newFolder) => {
      const response = await fetch("/api/custom-field-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-field-folders"] });
      toast({ title: "Success", description: "Folder created successfully." });
      setIsAddFolderDialogOpen(false);
      setNewFolder({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create folder" });
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (field: CustomField) => {
      const response = await fetch(`/api/custom-fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(field),
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to update field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({ title: "Success", description: "Custom field updated successfully." });
      setEditingField(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update field" });
    }
  });



  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch(`/api/custom-fields/${fieldId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to delete field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({ title: "Success", description: "Custom field deleted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete field" });
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await fetch(`/api/custom-field-folders/${folderId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-field-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({ title: "Success", description: "Folder deleted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete folder" });
    }
  });

  // Reorder folders mutation
  const reorderFoldersMutation = useMutation({
    mutationFn: async (folderIds: string[]) => {
      const response = await fetch('/api/custom-field-folders/reorder', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderIds }),
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to reorder folders');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-field-folders"] });
      toast({ title: "Success", description: "Folder order updated successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to reorder folders" });
    }
  });

  // Reorder fields mutation
  const reorderFieldsMutation = useMutation({
    mutationFn: async (fieldIds: string[]) => {
      const response = await fetch("/api/custom-fields/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldIds }),
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to reorder fields');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Field order updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder fields",
        variant: "destructive",
      });
    },
  });

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    addFieldMutation.mutate(newField);
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    addFolderMutation.mutate(newFolder);
  };

  const handleDeleteField = (fieldId: string) => {
    setDeleteFieldId(fieldId);
  };

  const confirmDeleteField = () => {
    if (deleteFieldId) {
      deleteFieldMutation.mutate(deleteFieldId);
      setDeleteFieldId(null);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    setDeleteFolderId(folderId);
  };

  const confirmDeleteFolder = () => {
    if (deleteFolderId) {
      deleteFolderMutation.mutate(deleteFolderId);
      setDeleteFolderId(null);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(folders || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const folderIds = items.map(folder => folder.id);
    reorderFoldersMutation.mutate(folderIds);
  };



  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortOrder === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortOrder === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  // Get folder name by ID - moved up before sorting logic
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "No Folder";
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || "Unknown Folder";
  };

  const sortedCustomFields = [...customFields].sort((a, b) => {
    let aValue = '';
    let bValue = '';

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'folder':
        aValue = getFolderName(a.folderId).toLowerCase();
        bValue = getFolderName(b.folderId).toLowerCase();
        break;
      case 'required':
        aValue = a.required ? '1' : '0';
        bValue = b.required ? '1' : '0';
        break;
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Calculate pagination
  const totalItems = sortedCustomFields.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomFields = sortedCustomFields.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes or items per page changes
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handleUpdateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingField) {
      updateFieldMutation.mutate(editingField);
    }
  };



  const getFieldTypeIcon = (type: string) => {
    const Icon = fieldTypeIcons[type as keyof typeof fieldTypeIcons] || Type;
    return <Icon className="h-4 w-4" />;
  };

  // Generate unique key (merge tag) for field
  const generateUniqueKey = (name: string) => {
    return `{{${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}}}`;
  };



  // Count fields in folders
  const getFolderFieldCount = (folderId: string) => {
    return customFields.filter(field => field.folderId === folderId).length;
  };

  // Helper functions for managing field options
  const addOption = (fieldState: typeof newField | CustomField, setFieldState: any) => {
    const updatedOptions = [...(fieldState.options || []), ""];
    setFieldState({ ...fieldState, options: updatedOptions });
  };

  const updateOption = (index: number, value: string, fieldState: typeof newField | CustomField, setFieldState: any) => {
    const updatedOptions = [...(fieldState.options || [])];
    updatedOptions[index] = value;
    setFieldState({ ...fieldState, options: updatedOptions });
  };

  const removeOption = (index: number, fieldState: typeof newField | CustomField, setFieldState: any) => {
    const updatedOptions = (fieldState.options || []).filter((_, i) => i !== index);
    setFieldState({ ...fieldState, options: updatedOptions });
  };

  // Check if field type requires options
  const fieldTypeRequiresOptions = (type: string) => {
    return ['dropdown', 'dropdown_multiple', 'checkbox', 'radio'].includes(type);
  };

  return (
    <div className="space-y-6">
      {/* Back to Settings Button */}
      <div className="flex items-center space-x-2">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Database className="h-8 w-8 text-primary" />
          <span>Custom Fields</span>
        </h1>
        <p className="text-muted-foreground">
          Create and manage custom fields for contacts and email templates
        </p>
      </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "all-fields", name: "All Fields", icon: Database, count: customFields.length },
              { id: "folders", name: "Folders", icon: Folder, count: folders.length }
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
                  {tab.name} ({tab.count})
                </button>
              );
            })}
          </nav>
        </div>

        {/* All Fields Tab */}
        {activeTab === "all-fields" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search custom fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <Dialog open={isAddFieldDialogOpen} onOpenChange={setIsAddFieldDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 h-10">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Field
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Custom Field</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddField} className="space-y-4">
                      <div>
                        <Label htmlFor="fieldName">Field Name *</Label>
                        <Input
                          id="fieldName"
                          value={newField.name}
                          onChange={(e) => setNewField({...newField, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="fieldType">Field Type</Label>
                        <Select value={newField.type} onValueChange={(value) => setNewField({...newField, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="multiline">Multiline Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="dropdown_multiple">Dropdown (Multiple)</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio Select</SelectItem>
                            <SelectItem value="file_upload">File Upload</SelectItem>
                            <SelectItem value="contact_card">Contact Card</SelectItem>
                          </SelectContent>
                        </Select>
                        {newField.type === 'contact_card' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Allows adding multiple contact entries (Name, Position, Email, Phone). Max 10 contacts per field.
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="fieldFolder">Folder (Optional)</Label>
                        <Select value={newField.folderId || "no-folder"} onValueChange={(value) => setNewField({...newField, folderId: value === "no-folder" ? "" : value})} key="add-folder-select">
                          <SelectTrigger>
                            <SelectValue placeholder="Select a folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-folder">No Folder</SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {['text', 'multiline', 'email', 'phone', 'number', 'url', 'currency', 'date', 'dropdown', 'dropdown_multiple'].includes(newField.type) && (
                        <div>
                          <Label htmlFor="placeholderText">Placeholder Text</Label>
                          <Input
                            id="placeholderText"
                            value={newField.placeholderText}
                            onChange={(e) => setNewField({...newField, placeholderText: e.target.value})}
                            placeholder="e.g., Enter value here..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Hint text shown inside the field when empty
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="tooltipText">Tooltip Text</Label>
                        <Input
                          id="tooltipText"
                          value={newField.tooltipText}
                          onChange={(e) => setNewField({...newField, tooltipText: e.target.value})}
                          placeholder="e.g., Additional info about this field"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Help text shown when hovering over the field label
                        </p>
                      </div>

                      {/* Options management for dropdown, checkbox, radio fields */}
                      {fieldTypeRequiresOptions(newField.type) && (
                        <div>
                          <Label htmlFor="fieldOptions">Options *</Label>
                          <div className="space-y-2">
                            {(newField.options || []).map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, e.target.value, newField, setNewField)}
                                  placeholder={`Option ${index + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index, newField, setNewField)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(newField, setNewField)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {newField.type === 'dropdown' && 'Users can select one option from this list'}
                            {newField.type === 'dropdown_multiple' && 'Users can select multiple options from this list'}
                            {newField.type === 'checkbox' && 'Users can select multiple options from this list'}
                            {newField.type === 'radio' && 'Users can select one option from this list'}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="required"
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField({...newField, required: checked})}
                        />
                        <Label htmlFor="required">Required Field</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddFieldDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addFieldMutation.isPending}>
                          {addFieldMutation.isPending ? "Creating..." : "Create Field"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Custom Fields Directory</CardTitle>
              </CardHeader>
              <CardContent>

                {isLoading ? (
                  <div className="text-center py-8">Loading custom fields...</div>
                ) : customFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No custom fields found</div>
                ) : (
                  <>
                    <div className="border rounded-md">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHeader field="name">Field Name</SortableHeader>
                          <SortableHeader field="folder">Folder Location</SortableHeader>
                          <TableHead>Unique Key (Merge Tag)</TableHead>
                          <SortableHeader field="type">Type</SortableHeader>
                          <SortableHeader field="required">Required</SortableHeader>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCustomFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getFieldTypeIcon(field.type)}
                                {field.name}
                                {field.required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                                {field.tooltipText && (
                                  <span title={`Tooltip: ${field.tooltipText}`} className="text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                                {field.placeholderText && (
                                  <span title={`Placeholder: ${field.placeholderText}`} className="text-gray-400 text-xs italic">
                                    [{field.placeholderText}]
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Folder className="h-3 w-3 text-gray-400" />
                                {getFolderName(field.folderId)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {generateUniqueKey(field.name)}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {field.required ? (
                                <Badge variant="default" className="text-xs">Yes</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingField(field)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteField(field.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Items per page:</span>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                              setItemsPerPage(parseInt(value));
                              setCurrentPage(1);
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} fields
                          </span>
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => {
                                return page === 1 || 
                                       page === totalPages || 
                                       (page >= currentPage - 1 && page <= currentPage + 1);
                              })
                              .map((page, index, array) => (
                                <div key={page} className="flex items-center">
                                  {index > 0 && array[index - 1] !== page - 1 && (
                                    <span className="px-2 text-gray-500">...</span>
                                  )}
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={currentPage === page ? "bg-primary hover:bg-primary/90" : ""}
                                  >
                                    {page}
                                  </Button>
                                </div>
                              ))}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Folders Tab */}
        {activeTab === "folders" && (
          <div className="space-y-6">
            {/* Search and Add Folder Controls */}
            <div className="flex justify-between items-center">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Folder className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddFolder} className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Folder Name *</Label>
                      <Input
                        id="folderName"
                        value={newFolder.name}
                        onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="folderDescription">Description</Label>
                      <Textarea
                        id="folderDescription"
                        value={newFolder.description}
                        onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addFolderMutation.isPending}>
                        {addFolderMutation.isPending ? "Creating..." : "Create Folder"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Folders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Folder Directory</CardTitle>
                <CardDescription>
                  Search and manage custom field folders
                </CardDescription>
              </CardHeader>
              <CardContent>

                {foldersLoading ? (
                  <div className="text-center py-8">Loading folders...</div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No folders created yet</div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Folder Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Fields Count</TableHead>
                            <TableHead>Created On</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <Droppable droppableId="folders">
                          {(provided) => (
                            <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                              {folders.map((folder, index) => (
                                <Draggable key={folder.id} draggableId={folder.id} index={index}>
                                  {(provided, snapshot) => (
                                    <TableRow 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={snapshot.isDragging ? "bg-gray-50" : ""}
                                    >
                                      <TableCell {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        <div
                                          className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                          onClick={() => setLocation(`/settings/custom-fields/${folder.id}/edit`)}
                                        >
                                          <FolderOpen className="h-4 w-4 text-primary" />
                                          {folder.name}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-gray-600">{folder.name === "Billing" || folder.name === "Important Links" ? "System folder" : "No description"}</span>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{getFolderFieldCount(folder.id)} fields</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-gray-500 text-sm">--</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLocation(`/settings/custom-fields/${folder.id}/edit`)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteFolder(folder.id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </TableBody>
                          )}
                        </Droppable>
                      </Table>
                    </div>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Field Dialog */}
        {editingField && (
          <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Custom Field</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateField} className="space-y-4">
                <div>
                  <Label htmlFor="editFieldName">Field Name *</Label>
                  <Input
                    id="editFieldName"
                    value={editingField.name}
                    onChange={(e) => setEditingField({...editingField, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editFieldType">Field Type</Label>
                  <Select value={editingField.type} onValueChange={(value) => setEditingField({...editingField, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="multiline">Multiline Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="dropdown_multiple">Dropdown (Multiple)</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="radio">Radio Select</SelectItem>
                      <SelectItem value="file_upload">File Upload</SelectItem>
                      <SelectItem value="contact_card">Contact Card</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingField.type === 'contact_card' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Allows adding multiple contact entries (Name, Position, Email, Phone). Max 10 contacts per field.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="editFieldFolder">Folder (Optional)</Label>
                  <Select value={editingField.folderId || "no-folder"} onValueChange={(value) => setEditingField({...editingField, folderId: value === "no-folder" ? null : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-folder">No Folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {['text', 'multiline', 'email', 'phone', 'number', 'url', 'currency', 'date', 'dropdown', 'dropdown_multiple'].includes(editingField.type) && (
                  <div>
                    <Label htmlFor="editPlaceholderText">Placeholder Text</Label>
                    <Input
                      id="editPlaceholderText"
                      value={editingField.placeholderText || ""}
                      onChange={(e) => setEditingField({...editingField, placeholderText: e.target.value})}
                      placeholder="e.g., Enter value here..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hint text shown inside the field when empty
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="editTooltipText">Tooltip Text</Label>
                  <Input
                    id="editTooltipText"
                    value={editingField.tooltipText || ""}
                    onChange={(e) => setEditingField({...editingField, tooltipText: e.target.value})}
                    placeholder="e.g., Additional info about this field"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Help text shown when hovering over the field label
                  </p>
                </div>

                {/* Options management for dropdown, checkbox, radio fields in edit dialog */}
                {fieldTypeRequiresOptions(editingField.type) && (
                  <div>
                    <Label htmlFor="editFieldOptions">Options *</Label>
                    <div className="space-y-2">
                      {(editingField.options || []).map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value, editingField, setEditingField)}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index, editingField, setEditingField)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(editingField, setEditingField)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {editingField.type === 'dropdown' && 'Users can select one option from this list'}
                      {editingField.type === 'dropdown_multiple' && 'Users can select multiple options from this list'}
                      {editingField.type === 'checkbox' && 'Users can select multiple options from this list'}
                      {editingField.type === 'radio' && 'Users can select one option from this list'}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editRequired"
                    checked={editingField.required ?? false}
                    onCheckedChange={(checked) => setEditingField({...editingField, required: checked})}
                  />
                  <Label htmlFor="editRequired">Required Field</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateFieldMutation.isPending}>
                    {updateFieldMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

      {/* Delete Field Confirmation Dialog */}
      <AlertDialog open={deleteFieldId !== null} onOpenChange={(open) => !open && setDeleteFieldId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this field? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteField} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog open={deleteFolderId !== null} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? Fields in this folder will be moved to 'No Folder'. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}