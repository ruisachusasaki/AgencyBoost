import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Database, Plus, Edit, Trash2, Folder, Type, Hash, Calendar, Link, DollarSign, Mail, Phone, CheckSquare, Search, FolderOpen, Users } from "lucide-react";
import type { CustomField, CustomFieldFolder } from "@shared/schema";

const fieldTypeIcons = {
  text: Type,
  email: Mail,
  phone: Phone,
  number: Hash,
  currency: DollarSign,
  date: Calendar,
  url: Link,
  dropdown: CheckSquare,
  checkbox: CheckSquare
};

export default function CustomFields() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all-fields");
  
  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    options: [] as string[],
    required: false,
    folderId: "",
    order: 0
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
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      return response.json();
    },
  });

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<CustomFieldFolder[]>({
    queryKey: ["/api/custom-field-folders"],
    queryFn: async () => {
      const response = await fetch("/api/custom-field-folders");
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Add field mutation
  const addFieldMutation = useMutation({
    mutationFn: async (fieldData: any) => {
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({
        title: "Success",
        description: "Custom field created successfully.",
      });
      setIsAddFieldDialogOpen(false);
      resetNewField();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create custom field. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetNewField = () => {
    setNewField({
      name: "",
      type: "text",
      options: [],
      required: false,
      folderId: "",
      order: 0
    });
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    addFieldMutation.mutate(newField);
  };

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch(`/api/custom-fields/${fieldId}`, { method: "DELETE" });
      if (!response.ok) throw new Error('Failed to delete field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({ title: "Success", description: "Custom field deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to delete custom field" 
      });
    }
  });

  // Add folder mutation
  const addFolderMutation = useMutation({
    mutationFn: async (folderData: any) => {
      const response = await fetch('/api/custom-field-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-field-folders"] });
      toast({ title: "Success", description: "Folder created successfully" });
      setIsAddFolderDialogOpen(false);
      setNewFolder({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to create folder" 
      });
    }
  });

  const handleDeleteField = (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this custom field? This action cannot be undone.")) return;
    deleteFieldMutation.mutate(fieldId);
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    addFolderMutation.mutate(newFolder);
  };

  const getFieldTypeIcon = (type: string) => {
    const Icon = fieldTypeIcons[type as keyof typeof fieldTypeIcons] || Type;
    return <Icon className="h-4 w-4" />;
  };

  // Generate unique key (merge tag) for field
  const generateUniqueKey = (name: string) => {
    return `{{${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}}}`;
  };

  // Get folder name by ID
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "No Folder";
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || "Unknown Folder";
  };

  // Count fields in folders
  const getFolderFieldCount = (folderId: string) => {
    return customFields.filter(field => field.folderId === folderId).length;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              Custom Fields
            </h1>
            <p className="text-gray-600 mt-2">Create and manage custom contact fields and folders</p>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Folder className="h-4 w-4 mr-2" />
                  Add Folder
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
            
            <Dialog open={isAddFieldDialogOpen} onOpenChange={setIsAddFieldDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Custom Field</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddField} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fieldName">Field Name *</Label>
                      <Input
                        id="fieldName"
                        value={newField.name}
                        onChange={(e) => setNewField({...newField, name: e.target.value})}
                        placeholder="e.g., Lead Score"
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
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {newField.type === 'dropdown' && (
                    <div>
                      <Label htmlFor="options">Dropdown Options</Label>
                      <Textarea
                        id="options"
                        placeholder="Enter each option on a new line"
                        onChange={(e) => setNewField({
                          ...newField, 
                          options: e.target.value.split('\n').filter(option => option.trim())
                        })}
                        rows={4}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="folder">Folder</Label>
                    <Select value={newField.folderId} onValueChange={(value) => setNewField({...newField, folderId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Folder</SelectItem>
                        {folders.map((folder: any) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search custom fields and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-fields" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              All Fields ({customFields.length})
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Folders ({folders.length})
            </TabsTrigger>
          </TabsList>

          {/* All Fields Tab */}
          <TabsContent value="all-fields" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields Overview</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage all custom fields with their merge tags for email templates
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading custom fields...</div>
                ) : customFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No custom fields found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Folder Location</TableHead>
                        <TableHead>Unique Key (Merge Tag)</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getFieldTypeIcon(field.type)}
                              {field.name}
                              {field.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
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
                          <TableCell className="text-sm text-gray-500">
                            {field.createdAt ? new Date(field.createdAt).toLocaleDateString() : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Folders Tab */}
          <TabsContent value="folders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Folder Management</CardTitle>
                <p className="text-sm text-gray-600">
                  Organize your custom fields into folders for better management
                </p>
              </CardHeader>
              <CardContent>
                {foldersLoading ? (
                  <div className="text-center py-8">Loading folders...</div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No folders created yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Folder Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Fields Count</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {folders.map((folder) => (
                        <TableRow key={folder.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-primary" />
                              {folder.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {folder.description || "No description"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              {getFolderFieldCount(folder.id)} fields
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  toast({ title: "Info", description: "Folder editing coming soon" });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Delete folder "${folder.name}"? Fields will be moved to "No Folder".`)) {
                                    toast({ title: "Info", description: "Folder deletion coming soon" });
                                  }
                                }}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin Note */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                <strong>Admin Only:</strong> Custom fields appear in contact records and can be used in email/SMS templates as merge tags.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    {folder.name}
                  </CardTitle>
                  {folder.description && (
                    <p className="text-sm text-gray-600">{folder.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {folder.fields.length === 0 ? (
                    <p className="text-gray-500 italic">No fields in this folder yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {folder.fields.map((field: CustomField) => (
                        <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded">
                              {getFieldTypeIcon(field.type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{field.name}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Badge variant="outline">{field.type}</Badge>
                                {field.required && <Badge variant="secondary">Required</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Ungrouped Fields */}
            {ungroupedFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ungrouped Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {ungroupedFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded">
                            {getFieldTypeIcon(field.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{field.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Badge variant="outline">{field.type}</Badge>
                              {field.required && <Badge variant="secondary">Required</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Note */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-amber-600 mr-2" />
                  <p className="text-sm text-amber-800">
                    <strong>Admin Only:</strong> Custom fields appear in contact records and can be used in email/SMS templates as merge tags.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}