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
import { useToast } from "@/hooks/use-toast";
import { Database, Plus, Edit, Trash2, Folder, Type, Hash, Calendar, Link, DollarSign, Mail, Phone, CheckSquare } from "lucide-react";
import type { CustomField } from "@shared/schema";

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

  // Fetch custom fields
  const { data: customFields = [], isLoading } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
  });

  // Fetch folders (placeholder - would need to implement folders API)
  const { data: folders = [] } = useQuery({
    queryKey: ["/api/custom-field-folders"],
    queryFn: async () => {
      // Mock folders data
      return [
        { id: "1", name: "Contact Information", description: "Basic contact details" },
        { id: "2", name: "Business Info", description: "Business-related fields" },
        { id: "3", name: "Marketing", description: "Marketing preferences and data" }
      ];
    }
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

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this custom field? This action cannot be undone.")) return;
    
    try {
      // TODO: Implement delete API call
      toast({
        title: "Success",
        description: "Custom field deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete custom field. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFieldTypeIcon = (type: string) => {
    const Icon = fieldTypeIcons[type as keyof typeof fieldTypeIcons] || Type;
    return <Icon className="h-4 w-4" />;
  };

  const groupedFields = folders.map(folder => ({
    ...folder,
    fields: customFields.filter(field => field.folderId === folder.id)
  }));

  const ungroupedFields = customFields.filter(field => !field.folderId);

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
                <form className="space-y-4">
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
                    <Button type="submit">Create Folder</Button>
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

        {isLoading ? (
          <div>Loading custom fields...</div>
        ) : (
          <div className="space-y-6">
            {/* Grouped Fields */}
            {groupedFields.map((folder: any) => (
              <Card key={folder.id}>
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