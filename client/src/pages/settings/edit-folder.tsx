import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Database, GripVertical, Save, Type, Hash, Calendar, Link, DollarSign, Mail, Phone, CheckSquare } from "lucide-react";
import type { CustomField, CustomFieldFolder } from "@shared/schema";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const fieldTypeIcons = {
  text: Type,
  email: Mail,
  phone: Phone,
  number: Hash,
  date: Calendar,
  url: Link,
  currency: DollarSign,
  dropdown: CheckSquare,
  checkbox: CheckSquare
};

export default function EditFolder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [folderName, setFolderName] = useState("");

  // Fetch folder details
  const { data: folder, isLoading: folderLoading } = useQuery<CustomFieldFolder>({
    queryKey: ["/api/custom-field-folders", id],
    queryFn: async () => {
      const response = await fetch(`/api/custom-field-folders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch folder');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch custom fields
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
    queryFn: async () => {
      const response = await fetch("/api/custom-fields");
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      return response.json();
    },
  });

  // Get fields for this folder, sorted by order
  const getFieldsForFolder = (folderId: string) => {
    return customFields
      .filter(field => field.folderId === folderId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Update folder name when folder data loads
  useEffect(() => {
    if (folder) {
      setFolderName(folder.name);
    }
  }, [folder]);

  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch(`/api/custom-field-folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-field-folders"] });
      toast({ title: "Success", description: "Folder updated successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update folder" });
    }
  });

  // Reorder fields mutation
  const reorderFieldsMutation = useMutation({
    mutationFn: async (fieldIds: string[]) => {
      const response = await fetch("/api/custom-fields/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldIds }),
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

  const handleFieldDragEnd = (result: any) => {
    if (!result.destination || !id) {
      return;
    }

    const fields = getFieldsForFolder(id);
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const fieldIds = items.map(field => field.id);
    reorderFieldsMutation.mutate(fieldIds);
  };

  const handleUpdateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }
    updateFolderMutation.mutate({ name: folderName.trim() });
  };

  const getFieldTypeIcon = (type: string) => {
    const Icon = fieldTypeIcons[type as keyof typeof fieldTypeIcons] || Type;
    return <Icon className="h-4 w-4" />;
  };

  if (folderLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading folder...</div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Folder not found</h2>
          <Button onClick={() => setLocation("/settings/custom-fields")}>
            Back to Custom Fields
          </Button>
        </div>
      </div>
    );
  }

  const folderFields = getFieldsForFolder(folder.id);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/settings/custom-fields")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Custom Fields
          </Button>
        </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Edit Folder: {folder.name}
          </h1>
          <p className="text-gray-600 mt-2">Update folder settings and reorder fields</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Folder settings */}
          <Card>
            <CardHeader>
              <CardTitle>Folder Settings</CardTitle>
              <CardDescription>Update the folder name and properties</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateFolder} className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name *</Label>
                  <Input
                    id="folderName"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateFolderMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateFolderMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right side - Fields in folder */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Fields in this folder ({folderFields.length})</CardTitle>
              <CardDescription>Drag to reorder how fields appear in client profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {folderFields.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No fields in this folder</h3>
                  <p className="text-sm">Add fields to this folder from the main Custom Fields page</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleFieldDragEnd}>
                  <Droppable droppableId="folder-fields">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                        {folderFields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 border rounded-lg bg-white transition-shadow ${
                                  snapshot.isDragging ? "shadow-lg ring-2 ring-[#46a1a0] ring-opacity-50" : "shadow-sm hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-shrink-0">
                                      {getFieldTypeIcon(field.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">{field.name}</div>
                                      <div className="text-sm text-gray-500 capitalize">{field.type} field</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {field.required && (
                                      <Badge variant="secondary" className="text-xs">Required</Badge>
                                    )}
                                    <div className="text-xs text-gray-400 font-mono">#{index + 1}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}