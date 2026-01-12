import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, Settings, Eye, Globe, Copy,
  AlignLeft, Mail, Phone, Hash, Calendar, ChevronDown, CheckSquare, CircleDot,
  Star, Image, FileText, ListOrdered, LayoutGrid, Type, Layers, ChevronRight, ChevronLeft,
  Zap, BarChart3, MoreHorizontal, Check, X, Folder
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import type { CustomField } from "@shared/schema";

interface SurveyBuilderProps {
  surveyId?: string;
}

interface SurveySlide {
  id: string;
  surveyId: string;
  title: string;
  description?: string;
  order: number;
  buttonText: string;
}

interface SurveyField {
  id: string;
  surveyId: string;
  slideId: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: string[];
  settings?: any;
}

interface SurveyLogicRule {
  id: string;
  surveyId: string;
  fieldId: string;
  operator: string;
  value: string;
  actionType: string;
  targetFieldId?: string;
  targetSlideId?: string;
}

const fieldTypes = [
  { id: "short_text", label: "Short Text", icon: Type, category: "text" },
  { id: "long_text", label: "Long Text", icon: AlignLeft, category: "text" },
  { id: "email", label: "Email", icon: Mail, category: "contact" },
  { id: "phone", label: "Phone", icon: Phone, category: "contact" },
  { id: "number", label: "Number", icon: Hash, category: "text" },
  { id: "date", label: "Date", icon: Calendar, category: "date" },
  { id: "dropdown", label: "Dropdown", icon: ChevronDown, category: "choice" },
  { id: "multiple_choice", label: "Multiple Choice", icon: CircleDot, category: "choice" },
  { id: "checkboxes", label: "Checkboxes", icon: CheckSquare, category: "choice" },
  { id: "rating", label: "Rating", icon: Star, category: "rating" },
  { id: "file_upload", label: "File Upload", icon: FileText, category: "media" },
  { id: "image", label: "Image", icon: Image, category: "media" },
];

const operatorLabels: Record<string, string> = {
  equals: "equals",
  not_equals: "does not equal",
  contains: "contains",
  not_contains: "does not contain",
  greater_than: "is greater than",
  less_than: "is less than",
  is_empty: "is empty",
  is_not_empty: "is not empty",
};

const actionLabels: Record<string, string> = {
  show_field: "Show field",
  hide_field: "Hide field",
  jump_to_slide: "Jump to slide",
  submit_form: "Submit form",
};

export default function SurveyBuilder({ surveyId }: SurveyBuilderProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"build" | "logic" | "settings" | "submissions">("build");
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [surveyName, setSurveyName] = useState("Untitled Survey");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const [isAddSlideDialogOpen, setIsAddSlideDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<SurveyField | null>(null);
  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [isAddLogicDialogOpen, setIsAddLogicDialogOpen] = useState(false);
  const [localSlides, setLocalSlides] = useState<SurveySlide[]>([]);
  
  // Track the active survey ID - updates when a new survey is created or when navigating
  const [activeSurveyId, setActiveSurveyId] = useState<string | undefined>(
    surveyId === "new" ? undefined : surveyId
  );
  
  // Update activeSurveyId when surveyId prop changes (e.g., navigating to an existing survey)
  useEffect(() => {
    if (surveyId && surveyId !== "new") {
      setActiveSurveyId(surveyId);
    }
  }, [surveyId]);
  
  const isNew = !activeSurveyId;

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ["/api/surveys", activeSurveyId],
    enabled: !isNew && !!activeSurveyId,
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${activeSurveyId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch survey");
      return response.json();
    },
  });

  const { data: slides = [], isLoading: slidesLoading } = useQuery<SurveySlide[]>({
    queryKey: ["/api/surveys", activeSurveyId, "slides"],
    enabled: !isNew && !!activeSurveyId,
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${activeSurveyId}/slides`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch slides");
      return response.json();
    },
  });

  const { data: fields = [], isLoading: fieldsLoading } = useQuery<SurveyField[]>({
    queryKey: ["/api/surveys", activeSurveyId, "fields"],
    enabled: !isNew && !!activeSurveyId,
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${activeSurveyId}/fields`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch fields");
      return response.json();
    },
  });

  const { data: logicRules = [] } = useQuery<SurveyLogicRule[]>({
    queryKey: ["/api/surveys", activeSurveyId, "logic"],
    enabled: !isNew && !!activeSurveyId,
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${activeSurveyId}/logic`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logic rules");
      return response.json();
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["/api/surveys", activeSurveyId, "submissions"],
    enabled: !isNew && !!activeSurveyId && activeTab === "submissions",
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${activeSurveyId}/submissions`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
  });

  // Custom fields for adding to surveys
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields'],
  });

  const { data: customFieldFolders = [] } = useQuery<Array<{id: string; name: string}>>({
    queryKey: ['/api/custom-field-folders'],
  });

  useEffect(() => {
    if (survey) {
      setSurveyName(survey.name || "Untitled Survey");
      setSurveyDescription(survey.description || "");
    }
  }, [survey]);

  useEffect(() => {
    if (slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(slides[0].id);
    }
  }, [slides, selectedSlideId]);

  // Sync localSlides with query data for optimistic drag-and-drop
  useEffect(() => {
    setLocalSlides(slides);
  }, [slides]);

  const createSurveyMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/surveys", data);
    },
    onSuccess: (newSurvey: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      // Update the active survey ID before navigating
      setActiveSurveyId(newSurvey.id);
      setLocation(`/survey-builder/${newSurvey.id}`);
      toast({ title: "Survey created", description: "Your survey has been created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create survey", variant: "destructive" });
    },
  });

  const updateSurveyMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; status?: string }) => {
      return await apiRequest("PUT", `/api/surveys/${activeSurveyId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId] });
      toast({ title: "Survey saved", description: "Your changes have been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save survey", variant: "destructive" });
    },
  });

  const addSlideMutation = useMutation({
    mutationFn: async (data: { title: string; buttonText: string }) => {
      return await apiRequest("POST", `/api/surveys/${activeSurveyId}/slides`, {
        ...data,
        order: slides.length,
      });
    },
    onSuccess: (newSlide: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "slides"] });
      setSelectedSlideId(newSlide.id);
      setIsAddSlideDialogOpen(false);
      toast({ title: "Slide added", description: "New slide has been added" });
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async (data: { type: string; label: string; slideId: string }) => {
      const slideFields = fields.filter(f => f.slideId === data.slideId);
      return await apiRequest("POST", `/api/surveys/${activeSurveyId}/fields`, {
        ...data,
        surveyId: activeSurveyId,
        required: false,
        order: slideFields.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "fields"] });
      setIsAddFieldDialogOpen(false);
      toast({ title: "Field added", description: "New field has been added" });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: string; data: Partial<SurveyField> }) => {
      return await apiRequest("PUT", `/api/surveys/${activeSurveyId}/fields/${fieldId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "fields"] });
      setIsEditFieldDialogOpen(false);
      setEditingField(null);
      toast({ title: "Field updated", description: "Field has been updated" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      return await apiRequest("DELETE", `/api/surveys/${activeSurveyId}/fields/${fieldId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "fields"] });
      toast({ title: "Field deleted", description: "Field has been removed" });
    },
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId: string) => {
      return await apiRequest("DELETE", `/api/surveys/${activeSurveyId}/slides/${slideId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "fields"] });
      if (slides.length > 1) {
        setSelectedSlideId(slides[0].id);
      }
      toast({ title: "Slide deleted", description: "Slide and its fields have been removed" });
    },
  });

  const reorderSlidesMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      return await apiRequest("PUT", `/api/surveys/${activeSurveyId}/slides/reorder`, { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "slides"] });
    },
  });

  const handleSlideDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const reorderedSlides = Array.from(localSlides);
    const [removed] = reorderedSlides.splice(result.source.index, 1);
    reorderedSlides.splice(result.destination.index, 0, removed);

    // Update local state immediately for smooth UI
    setLocalSlides(reorderedSlides);

    const updates = reorderedSlides.map((slide, index) => ({
      id: slide.id,
      order: index,
    }));

    reorderSlidesMutation.mutate(updates);
  };

  const reorderFieldsMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number; slideId: string }[]) => {
      return await apiRequest("PUT", `/api/surveys/${activeSurveyId}/fields/reorder`, { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "fields"] });
    },
  });

  const addLogicRuleMutation = useMutation({
    mutationFn: async (data: Omit<SurveyLogicRule, "id" | "surveyId">) => {
      return await apiRequest("POST", `/api/surveys/${activeSurveyId}/logic`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "logic"] });
      setIsAddLogicDialogOpen(false);
      toast({ title: "Logic rule added", description: "Conditional logic has been added" });
    },
  });

  const deleteLogicRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiRequest("DELETE", `/api/surveys/${activeSurveyId}/logic/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", activeSurveyId, "logic"] });
      toast({ title: "Logic rule deleted", description: "Rule has been removed" });
    },
  });

  const handleSave = () => {
    if (isNew) {
      createSurveyMutation.mutate({ name: surveyName, description: surveyDescription });
    } else {
      updateSurveyMutation.mutate({ name: surveyName, description: surveyDescription });
    }
  };

  const handlePublish = () => {
    updateSurveyMutation.mutate({ 
      name: surveyName, 
      description: surveyDescription,
      status: "published" 
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const slideFields = fields.filter(f => f.slideId === selectedSlideId);
    const reordered = Array.from(slideFields);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    const updates = reordered.map((field, index) => ({
      id: field.id,
      order: index,
      slideId: selectedSlideId!,
    }));

    reorderFieldsMutation.mutate(updates);
  };

  const currentSlide = slides.find(s => s.id === selectedSlideId);
  const currentSlideFields = fields.filter(f => f.slideId === selectedSlideId).sort((a, b) => a.order - b.order);

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(f => f.id === type);
    return fieldType ? fieldType.icon : Type;
  };

  if (surveyLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading survey...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center gap-4">
          <Link href="/campaigns?tab=surveys">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-lg font-semibold hover:text-primary cursor-pointer text-left">
                {surveyName || "Untitled Survey"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div>
                  <Label>Survey Name</Label>
                  <Input
                    value={surveyName}
                    onChange={(e) => setSurveyName(e.target.value)}
                    placeholder="Enter survey name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={surveyDescription}
                    onChange={(e) => setSurveyDescription(e.target.value)}
                    placeholder="Survey description"
                    rows={2}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && survey?.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/s/${survey.shortCode}`;
                navigator.clipboard.writeText(url);
                toast({ title: "URL copied", description: "Survey URL copied to clipboard" });
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          )}
          {!isNew && survey?.status !== "published" && (
            <Button variant="outline" size="sm" onClick={handlePublish} disabled={updateSurveyMutation.isPending}>
              <Globe className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          <Button onClick={handleSave} disabled={createSurveyMutation.isPending || updateSurveyMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </header>

      {isNew ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Survey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Survey Name</Label>
                <Input
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  placeholder="Enter survey name"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  placeholder="Describe your survey"
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createSurveyMutation.isPending}>
                {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex">
          <div className="flex flex-col border-r bg-white dark:bg-gray-800 w-64">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full form-elements-tabs">
              <TabsList className="grid grid-cols-4 m-2 form-elements-tabslist">
                <TabsTrigger value="build" className="text-xs form-elements-tab">Build</TabsTrigger>
                <TabsTrigger value="logic" className="text-xs form-elements-tab">Logic</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs form-elements-tab">Settings</TabsTrigger>
                <TabsTrigger value="submissions" className="text-xs form-elements-tab">Data</TabsTrigger>
              </TabsList>

              <TabsContent value="build" className="flex-1 p-0 m-0">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Slides</span>
                    <Button size="icon" variant="ghost" onClick={() => setIsAddSlideDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-32">
                    <DragDropContext onDragEnd={handleSlideDragEnd}>
                      <Droppable droppableId="slides-list">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-1"
                          >
                            {localSlides.map((slide, index) => (
                              <Draggable key={slide.id} draggableId={slide.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-1 p-2 rounded cursor-pointer text-sm ${
                                      selectedSlideId === slide.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                    } ${snapshot.isDragging ? "shadow-md bg-white dark:bg-gray-800" : ""}`}
                                    onClick={() => setSelectedSlideId(slide.id)}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab text-gray-400 hover:text-gray-600"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <GripVertical className="h-3 w-3" />
                                    </div>
                                    <Layers className="h-4 w-4" />
                                    <span className="flex-1 truncate">{slide.title || `Slide ${index + 1}`}</span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSlideMutation.mutate(slide.id);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </ScrollArea>
                </div>

                {/* Form Elements - Add Fields and Custom Fields tabs */}
                <div className="p-3">
                  <Tabs defaultValue="add-fields" className="w-full form-elements-tabs">
                    <TabsList className="grid w-full grid-cols-2 form-elements-tabslist">
                      <TabsTrigger value="add-fields" className="form-elements-tab text-xs">Add Fields</TabsTrigger>
                      <TabsTrigger value="custom-fields" className="form-elements-tab text-xs">Custom Fields</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="add-fields" className="mt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {fieldTypes.map((field) => {
                          const Icon = field.icon;
                          return (
                            <Button
                              key={field.id}
                              variant="outline"
                              size="sm"
                              className="justify-start text-xs"
                              onClick={() => {
                                if (selectedSlideId) {
                                  addFieldMutation.mutate({
                                    type: field.id,
                                    label: field.label,
                                    slideId: selectedSlideId,
                                  });
                                }
                              }}
                              disabled={!selectedSlideId}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {field.label}
                            </Button>
                          );
                        })}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="custom-fields" className="mt-3">
                      {customFields.length > 0 ? (
                        <SurveyCustomFieldsAccordion 
                          customFields={customFields} 
                          customFieldFolders={customFieldFolders}
                          onAddField={(customFieldId) => {
                            if (selectedSlideId) {
                              const customField = customFields.find(f => f.id === customFieldId);
                              addFieldMutation.mutate({
                                type: 'custom_field',
                                label: customField?.name || 'Custom Field',
                                slideId: selectedSlideId,
                              });
                            }
                          }}
                          disabled={!selectedSlideId}
                        />
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-xs">
                          <p>No custom fields available</p>
                          <p className="text-xs mt-1">Create custom fields in Settings to use them here</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="logic" className="flex-1 p-3 m-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Conditional Logic</span>
                  <Button size="icon" variant="ghost" onClick={() => setIsAddLogicDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {logicRules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No logic rules yet. Add rules to show/hide fields or jump between slides based on answers.
                      </p>
                    ) : (
                      logicRules.map((rule) => {
                        const sourceField = fields.find(f => f.id === rule.fieldId);
                        return (
                          <Card key={rule.id} className="p-2">
                            <div className="flex items-start justify-between">
                              <div className="text-xs">
                                <p className="font-medium">If "{sourceField?.label || "Unknown field"}"</p>
                                <p className="text-muted-foreground">
                                  {operatorLabels[rule.operator]} "{rule.value}"
                                </p>
                                <p className="text-primary mt-1">
                                  {actionLabels[rule.actionType]}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteLogicRuleMutation.mutate(rule.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 p-3 m-0">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Survey Name</Label>
                    <Input
                      value={surveyName}
                      onChange={(e) => setSurveyName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm">Status</Label>
                    <div className="mt-2">
                      <Badge variant={survey?.status === "published" ? "default" : "secondary"}>
                        {survey?.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  {survey?.shortCode && (
                    <div>
                      <Label className="text-sm">Public URL</Label>
                      <div className="mt-1 flex gap-2">
                        <Input
                          value={`${window.location.origin}/s/${survey.shortCode}`}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/s/${survey.shortCode}`);
                            toast({ title: "Copied!", description: "URL copied to clipboard" });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="submissions" className="flex-1 p-3 m-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Submissions</span>
                  <Badge variant="secondary">{submissions.length}</Badge>
                </div>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {submissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No submissions yet. Share your survey to start collecting responses.
                      </p>
                    ) : (
                      submissions.map((sub: any) => (
                        <Card key={sub.id} className="p-2">
                          <div className="text-xs">
                            <p className="font-medium">{sub.submitterEmail || "Anonymous"}</p>
                            <p className="text-muted-foreground">
                              {new Date(sub.completedAt).toLocaleString()}
                            </p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {currentSlide ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Input
                        value={currentSlide.title}
                        className="text-xl font-semibold border-0 focus-visible:ring-0 px-0"
                        placeholder="Slide Title"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentSlide.description || "Add a description..."}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Slide {slides.findIndex(s => s.id === selectedSlideId) + 1} of {slides.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {currentSlideFields.map((field, index) => {
                            const FieldIcon = getFieldIcon(field.type);
                            return (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`group border rounded-lg p-4 bg-white dark:bg-gray-800 ${
                                      snapshot.isDragging ? "shadow-lg" : ""
                                    } ${selectedFieldId === field.id ? "ring-2 ring-primary" : ""}`}
                                    onClick={() => setSelectedFieldId(field.id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FieldIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                          </span>
                                        </div>
                                        {field.type === "short_text" && (
                                          <Input placeholder={field.placeholder || "Short answer"} disabled />
                                        )}
                                        {field.type === "long_text" && (
                                          <Textarea placeholder={field.placeholder || "Long answer"} disabled rows={2} />
                                        )}
                                        {field.type === "email" && (
                                          <Input type="email" placeholder={field.placeholder || "email@example.com"} disabled />
                                        )}
                                        {field.type === "phone" && (
                                          <Input type="tel" placeholder={field.placeholder || "(555) 555-5555"} disabled />
                                        )}
                                        {field.type === "number" && (
                                          <Input type="number" placeholder={field.placeholder || "0"} disabled />
                                        )}
                                        {field.type === "date" && (
                                          <Input type="date" disabled />
                                        )}
                                        {field.type === "dropdown" && (
                                          <Select disabled>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                          </Select>
                                        )}
                                        {field.type === "multiple_choice" && (
                                          <div className="space-y-2">
                                            {(field.options || ["Option 1", "Option 2"]).slice(0, 3).map((opt, i) => (
                                              <div key={i} className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full border" />
                                                <span className="text-sm">{opt}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {field.type === "checkboxes" && (
                                          <div className="space-y-2">
                                            {(field.options || ["Option 1", "Option 2"]).slice(0, 3).map((opt, i) => (
                                              <div key={i} className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded border" />
                                                <span className="text-sm">{opt}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {field.type === "rating" && (
                                          <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                              <Star key={n} className="h-6 w-6 text-muted-foreground" />
                                            ))}
                                          </div>
                                        )}
                                        {field.helpText && (
                                          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingField(field);
                                            setIsEditFieldDialogOpen(true);
                                          }}
                                        >
                                          <Settings className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-red-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteFieldMutation.mutate(field.id);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
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

                  {currentSlideFields.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No fields yet</p>
                      <p className="text-xs mt-1">Add fields from the left panel</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-8 pt-4 border-t">
                    <Button variant="outline" disabled={slides.findIndex(s => s.id === selectedSlideId) === 0}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button className="bg-primary">
                      {currentSlide.buttonText || "Next"}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No slides yet</p>
                  <Button className="mt-4" onClick={() => setIsAddSlideDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slide
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={isAddSlideDialogOpen} onOpenChange={setIsAddSlideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Slide</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const titleValue = (formData.get("title") as string)?.trim();
              addSlideMutation.mutate({
                title: titleValue || null,
                buttonText: formData.get("buttonText") as string || "Next",
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label>Slide Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input name="title" placeholder="Leave blank for auto-numbering (Slide 1, 2, 3...)" />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input name="buttonText" placeholder="Next" defaultValue="Next" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddSlideDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSlideMutation.isPending}>
                Add Slide
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditFieldDialogOpen} onOpenChange={setIsEditFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          {editingField && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateFieldMutation.mutate({
                  fieldId: editingField.id,
                  data: {
                    label: formData.get("label") as string,
                    placeholder: formData.get("placeholder") as string,
                    helpText: formData.get("helpText") as string,
                    required: formData.get("required") === "on",
                    options: (formData.get("options") as string)?.split("\n").filter(Boolean),
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label>Field Label</Label>
                <Input name="label" defaultValue={editingField.label} required />
              </div>
              <div>
                <Label>Placeholder</Label>
                <Input name="placeholder" defaultValue={editingField.placeholder || ""} />
              </div>
              <div>
                <Label>Help Text</Label>
                <Input name="helpText" defaultValue={editingField.helpText || ""} />
              </div>
              {["dropdown", "multiple_choice", "checkboxes"].includes(editingField.type) && (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    name="options"
                    defaultValue={(editingField.options || []).join("\n")}
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch name="required" id="required" defaultChecked={editingField.required} />
                <Label htmlFor="required">Required field</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditFieldDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFieldMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddLogicDialogOpen} onOpenChange={setIsAddLogicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Conditional Logic</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addLogicRuleMutation.mutate({
                fieldId: formData.get("fieldId") as string,
                operator: formData.get("operator") as string,
                value: formData.get("value") as string,
                actionType: formData.get("actionType") as string,
                targetFieldId: formData.get("targetFieldId") as string || undefined,
                targetSlideId: formData.get("targetSlideId") as string || undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label>If this field</Label>
              <Select name="fieldId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select name="operator" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(operatorLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input name="value" placeholder="Enter value to match" />
            </div>
            <div>
              <Label>Then</Label>
              <Select name="actionType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Slide (for jump action)</Label>
              <Select name="targetSlideId">
                <SelectTrigger>
                  <SelectValue placeholder="Select slide" />
                </SelectTrigger>
                <SelectContent>
                  {slides.map((slide) => (
                    <SelectItem key={slide.id} value={slide.id}>
                      {slide.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddLogicDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addLogicRuleMutation.isPending}>
                Add Rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Custom Fields Accordion Component for Surveys
interface SurveyCustomFieldsAccordionProps {
  customFields: CustomField[];
  customFieldFolders: Array<{id: string; name: string}>;
  onAddField: (customFieldId: string) => void;
  disabled?: boolean;
}

function SurveyCustomFieldsAccordion({ customFields, customFieldFolders, onAddField, disabled }: SurveyCustomFieldsAccordionProps) {
  
  // Helper function to get folder name by ID
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "No Folder";
    const folder = customFieldFolders.find(f => f.id === folderId);
    return folder?.name || "Unknown Folder";
  };
  
  // Group custom fields by folder name
  const groupedFields = customFields.reduce((groups, field) => {
    const folderName = getFolderName(field.folderId);
    if (!groups[folderName]) {
      groups[folderName] = [];
    }
    groups[folderName].push(field);
    return groups;
  }, {} as Record<string, CustomField[]>);

  // Sort folder names, with "No Folder" last
  const sortedFolders = Object.keys(groupedFields).sort((a, b) => {
    if (a === "No Folder") return 1;
    if (b === "No Folder") return -1;
    return a.localeCompare(b);
  });

  return (
    <Accordion type="multiple" className="w-full custom-fields-accordion">
      {sortedFolders.map((folderName) => (
        <AccordionItem key={folderName} value={folderName} className="border-none">
          <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Folder className="w-3 h-3 text-gray-500" />
              <span>{folderName}</span>
              <Badge variant="secondary" className="text-xs h-4 px-1">
                {groupedFields[folderName].length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-2">
            <div className="grid grid-cols-1 gap-1">
              {groupedFields[folderName].map((field) => (
                <Button
                  key={field.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddField(field.id)}
                  className="justify-start text-xs h-7 px-2"
                  disabled={disabled}
                >
                  {field.name}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
