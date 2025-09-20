import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  Contact, ArrowLeft, Settings, FileText, Plus, Edit2, Trash2, GripVertical, 
  Eye, EyeOff, Users, Target, Briefcase, Building, ShoppingBag, TrendingUp,
  Monitor, FileX, User, Clock, Mail, Phone, Globe, MapPin, Calendar,
  PenTool, Palette, Hash, Heart, Star, Zap, Coffee, Lightbulb, Rocket
} from "lucide-react";
import { Link } from "wouter";

// Icon mapping for client brief sections
const iconMap = {
  Users, Target, Briefcase, Building, ShoppingBag, TrendingUp, Monitor, FileX,
  User, Clock, Mail, Phone, Globe, MapPin, Calendar, PenTool, Palette, Hash,
  Heart, Star, Zap, Coffee, Lightbulb, Rocket, FileText, Contact, Settings
};

const iconOptions = Object.keys(iconMap);

// Client Brief Section Schema
const clientBriefSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  key: z.string().min(1, "Key is required").max(50, "Key must be under 50 characters").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must start with letter and contain only letters, numbers, underscore"),
  placeholder: z.string().max(200, "Placeholder must be under 200 characters").optional(),
  icon: z.string().min(1, "Icon is required"),
  type: z.enum(["text", "rich_text"]),
  isEnabled: z.boolean()
});

type ClientBriefSectionForm = z.infer<typeof clientBriefSectionSchema>;

interface ClientBriefSection {
  id: string;
  key: string;
  title: string;
  placeholder?: string;
  icon: string;
  displayOrder: number;
  isEnabled: boolean;
  scope: 'core' | 'custom';
  type: 'text' | 'rich_text';
  createdAt: string;
  updatedAt: string;
}

export default function ClientsSettings() {
  const [activeTab, setActiveTab] = useState<"overview" | "clientBrief">("overview");
  const [editingSection, setEditingSection] = useState<ClientBriefSection | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<ClientBriefSection | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching brief sections
  const { data: briefSections = [], isLoading: isLoadingSections } = useQuery<ClientBriefSection[]>({
    queryKey: ['/api/client-brief-sections'],
    enabled: activeTab === 'clientBrief'
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: (data: ClientBriefSectionForm) => 
      apiRequest('POST', '/api/client-brief-sections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate client brief data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      setIsCreateDialogOpen(false);
      toast({ title: "Section created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create section", description: error.message, variant: "destructive" });
    }
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientBriefSectionForm> }) => 
      apiRequest('PUT', `/api/client-brief-sections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate all client brief data to update icons on client detail pages  
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      setIsEditDialogOpen(false);
      setEditingSection(null);
      toast({ title: "Section updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update section", description: error.message, variant: "destructive" });
    }
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/client-brief-sections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate client brief data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      setIsDeleteDialogOpen(false);
      setSectionToDelete(null);
      toast({ title: "Section deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete section", description: error.message, variant: "destructive" });
    }
  });

  // Reorder sections mutation
  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionIds: string[]) => 
      apiRequest('PUT', '/api/client-brief-sections/reorder', { sectionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate client brief data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      toast({ title: "Sections reordered successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reorder sections", description: error.message, variant: "destructive" });
    }
  });

  // Form for creating/editing sections
  const form = useForm<ClientBriefSectionForm>({
    resolver: zodResolver(clientBriefSectionSchema),
    defaultValues: {
      title: "",
      key: "",
      placeholder: "",
      icon: "FileText",
      type: "text",
      isEnabled: true
    }
  });

  // Handle form submission
  const onSubmit = (data: ClientBriefSectionForm) => {
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data });
    } else {
      createSectionMutation.mutate(data);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedSections = Array.from(briefSections);
    const [reorderedItem] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, reorderedItem);

    const sectionIds = reorderedSections.map(section => section.id);
    reorderSectionsMutation.mutate(sectionIds);
  };

  // Handle edit section
  const handleEditSection = (section: ClientBriefSection) => {
    setEditingSection(section);
    form.reset({
      title: section.title,
      key: section.key,
      placeholder: section.placeholder || "",
      icon: section.icon,
      type: section.type,
      isEnabled: section.isEnabled
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete section
  const handleDeleteSection = (section: ClientBriefSection) => {
    setSectionToDelete(section);
    setIsDeleteDialogOpen(true);
  };

  // Handle new section
  const handleNewSection = () => {
    setEditingSection(null);
    form.reset({
      title: "",
      key: "",
      placeholder: "",
      icon: "FileText",
      type: "text",
      isEnabled: true
    });
    setIsCreateDialogOpen(true);
  };

  // Icon picker component
  const IconPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const IconComponent = iconMap[value as keyof typeof iconMap] || FileText;

    return (
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="h-10 w-16 p-0"
            data-testid="button-icon-picker"
          >
            <IconComponent className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">{value}</span>
        </div>
        {isOpen && (
          <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg bg-white max-h-48 overflow-y-auto">
            {iconOptions.map((iconName) => {
              const Icon = iconMap[iconName as keyof typeof iconMap];
              return (
                <Button
                  key={iconName}
                  type="button"
                  variant={value === iconName ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  data-testid={`icon-option-${iconName}`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back to Settings */}
        <div className="mb-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Contact className="h-8 w-8 text-primary" />
            Client Settings
          </h1>
          <p className="text-gray-600 mt-2">Configure client management settings and options</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-overview"
            >
              <Settings className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("clientBrief")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "clientBrief"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-client-brief"
            >
              <FileText className="h-4 w-4" />
              Client Brief
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Settings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium mb-2">Coming Soon</h3>
                      <p className="text-sm text-gray-600">
                        Additional client management settings and configuration options will be added here.
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        In Development
                      </Badge>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium mb-2">Sub-tabs Ready</h3>
                      <p className="text-sm text-gray-600">
                        This section is prepared for additional sub-tabs and functionality as requested.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Ready for Configuration
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Brief Tab */}
        {activeTab === "clientBrief" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Brief Sections</CardTitle>
                  <Button onClick={handleNewSection} data-testid="button-create-section">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSections ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading sections...</div>
                  </div>
                ) : briefSections.length === 0 ? (
                  <div className="text-center py-8">
                    <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first client brief section.</p>
                    <Button onClick={handleNewSection} data-testid="button-create-first-section">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Section
                    </Button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="brief-sections">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {briefSections.map((section, index) => {
                            const IconComponent = iconMap[section.icon as keyof typeof iconMap] || FileText;
                            return (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center justify-between p-4 border rounded-lg bg-white ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    }`}
                                    data-testid={`section-item-${section.id}`}
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing"
                                        data-testid="drag-handle"
                                      >
                                        <GripVertical className="h-5 w-5 text-gray-400" />
                                      </div>
                                      <IconComponent className="h-5 w-5 text-gray-600" />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-medium" data-testid={`text-title-${section.id}`}>
                                            {section.title}
                                          </h3>
                                          {!section.isEnabled && (
                                            <Badge variant="outline">Disabled</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500" data-testid={`text-key-${section.id}`}>
                                          Key: {section.key} • Type: {section.type}
                                        </p>
                                        {section.placeholder && (
                                          <p className="text-sm text-gray-400" data-testid={`text-placeholder-${section.id}`}>
                                            Placeholder: {section.placeholder}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={section.isEnabled}
                                        onCheckedChange={(checked) => {
                                          updateSectionMutation.mutate({
                                            id: section.id,
                                            data: { isEnabled: checked }
                                          });
                                        }}
                                        data-testid={`switch-enabled-${section.id}`}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditSection(section)}
                                        data-testid={`button-edit-${section.id}`}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      {section.scope === 'custom' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteSection(section)}
                                          data-testid={`button-delete-${section.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Section Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-create-section">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>
                Add a new client brief section that will appear in all client profiles.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Section title" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="section_key" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                            field.onChange(value);
                          }}
                          data-testid="input-key"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter placeholder text..." {...field} data-testid="input-placeholder" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconPicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="rich_text">Rich Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <div className="text-sm text-gray-500">
                          Show this section in client profiles
                        </div>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSectionMutation.isPending}
                    data-testid="button-create"
                  >
                    {createSectionMutation.isPending ? "Creating..." : "Create Section"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Section Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-edit-section">
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update the section details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Section title" {...field} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editingSection?.scope === 'custom' && (
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="section_key" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                              field.onChange(value);
                            }}
                            data-testid="input-edit-key"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter placeholder text..." {...field} data-testid="input-edit-placeholder" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconPicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="rich_text">Rich Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <div className="text-sm text-gray-500">
                          Show this section in client profiles
                        </div>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-edit-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateSectionMutation.isPending}
                    data-testid="button-update"
                  >
                    {updateSectionMutation.isPending ? "Updating..." : "Update Section"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Section Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent data-testid="dialog-delete-section">
            <DialogHeader>
              <DialogTitle>Delete Section</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this section? This action cannot be undone and will remove all client data for this section.
              </DialogDescription>
            </DialogHeader>
            {sectionToDelete && (
              <div className="py-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const IconComponent = iconMap[sectionToDelete.icon as keyof typeof iconMap] || FileText;
                    return <IconComponent className="h-5 w-5 text-gray-600" />;
                  })()}
                  <div>
                    <p className="font-medium" data-testid="text-delete-title">{sectionToDelete.title}</p>
                    <p className="text-sm text-gray-500" data-testid="text-delete-key">Key: {sectionToDelete.key}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                data-testid="button-delete-cancel"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => sectionToDelete && deleteSectionMutation.mutate(sectionToDelete.id)}
                disabled={deleteSectionMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteSectionMutation.isPending ? "Deleting..." : "Delete Section"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}