import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Trash2, GripVertical, FileText, Copy, ExternalLink, 
  Loader2, Paintbrush, Image as ImageIcon, X, Save, ChevronRight, Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  welcomeHeading: string;
  welcomeDescription: string;
  successHeading: string;
  successDescription: string;
}

const defaultBranding: OnboardingBranding = {
  companyName: '',
  logoUrl: '',
  primaryColor: '#00C9C6',
  welcomeHeading: 'Welcome! Let\'s Get You Started',
  welcomeDescription: 'Please complete this onboarding form so we can hit the ground running on your project.',
  successHeading: 'Onboarding Complete!',
  successDescription: 'Thank you for completing your onboarding form. Our team will review your information and reach out with next steps.',
};

const colorPresets = [
  { name: 'Teal', value: '#00C9C6' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Slate', value: '#475569' },
];

interface StepConfig {
  id: string;
  title: string;
  description: string;
  fields: StepFieldConfig[];
}

interface StepFieldConfig {
  customFieldId: string;
  required: boolean;
  type?: "field" | "text_block";
  textContent?: string;
}

const fieldTypeIcons: Record<string, string> = {
  text: 'T',
  multiline: '¶',
  email: '@',
  phone: '☎',
  number: '#',
  date: '📅',
  url: '🔗',
  currency: '$',
  dropdown: '▼',
  dropdown_multiple: '☰',
  checkbox: '☑',
  radio: '◉',
  file_upload: '📎',
  contact_card: '📇',
};

export function ClientOnboardingFormEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeEditorTab, setActiveEditorTab] = useState<"fields" | "branding">("fields");
  const [steps, setSteps] = useState<StepConfig[]>([
    { id: 'step-1', title: 'Company Information', description: '', fields: [] }
  ]);
  const [branding, setBranding] = useState<OnboardingBranding>(defaultBranding);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['/api/client-onboarding-form-config'],
  });

  const { data: customFieldsData, isLoading: customFieldsLoading } = useQuery({
    queryKey: ['/api/custom-fields'],
  });

  const { data: foldersData } = useQuery({
    queryKey: ['/api/custom-field-folders'],
  });

  useEffect(() => {
    if (config && config.steps && Array.isArray(config.steps) && config.steps.length > 0) {
      setSteps(config.steps as StepConfig[]);
    }
    if (config && config.branding) {
      setBranding({ ...defaultBranding, ...(config.branding as OnboardingBranding) });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: { steps: StepConfig[]; branding: OnboardingBranding }) => {
      const res = await apiRequest("POST", "/api/client-onboarding-form-config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-onboarding-form-config'] });
      setHasChanges(false);
      toast({ title: "Configuration saved", description: "Client onboarding form has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ steps, branding });
  };

  const customFields: any[] = customFieldsData || [];
  const folders: any[] = foldersData || [];

  const allAssignedFieldIds = steps.flatMap(s => s.fields.filter(f => f.type !== 'text_block').map(f => f.customFieldId));
  const availableFields = customFields.filter((cf: any) => !allAssignedFieldIds.includes(cf.id));

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Ungrouped';
    const folder = folders.find((f: any) => f.id === folderId);
    return folder?.name || 'Unknown';
  };

  const getFieldById = (id: string) => customFields.find((f: any) => f.id === id);

  const handleAddStep = () => {
    const newStep: StepConfig = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: '',
      fields: [],
    };
    setSteps([...steps, newStep]);
    setHasChanges(true);
  };

  const handleRemoveStep = (stepId: string) => {
    if (steps.length <= 1) {
      toast({ title: "Cannot remove", description: "You need at least one step.", variant: "destructive" });
      return;
    }
    setSteps(steps.filter(s => s.id !== stepId));
    setHasChanges(true);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<StepConfig>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
    setHasChanges(true);
  };

  const handleAddFieldToStep = (stepId: string, customFieldId: string) => {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, fields: [...s.fields, { customFieldId, required: false }] };
    }));
    setHasChanges(true);
  };

  const handleRemoveFieldFromStep = (stepId: string, customFieldId: string) => {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, fields: s.fields.filter(f => f.customFieldId !== customFieldId) };
    }));
    setHasChanges(true);
  };

  const handleToggleFieldRequired = (stepId: string, customFieldId: string) => {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return {
        ...s,
        fields: s.fields.map(f =>
          f.customFieldId === customFieldId ? { ...f, required: !f.required } : f
        )
      };
    }));
    setHasChanges(true);
  };

  const handleAddTextBlock = (stepId: string) => {
    const blockId = `text-block-${Date.now()}`;
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, fields: [...s.fields, { customFieldId: blockId, required: false, type: 'text_block' as const, textContent: '' }] };
    }));
    setHasChanges(true);
  };

  const handleUpdateTextBlock = (stepId: string, blockId: string, textContent: string) => {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return {
        ...s,
        fields: s.fields.map(f =>
          f.customFieldId === blockId ? { ...f, textContent } : f
        )
      };
    }));
    setHasChanges(true);
  };

  const handleFieldDragEnd = (stepId: string, result: DropResult) => {
    if (!result.destination) return;
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      const reordered = [...s.fields];
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination!.index, 0, moved);
      return { ...s, fields: reordered };
    }));
    setHasChanges(true);
  };

  const handleStepDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSteps(reordered);
    setHasChanges(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/client-onboarding-logo-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setBranding(prev => ({ ...prev, logoUrl: data.fileUrl }));
      setHasChanges(true);
      toast({ title: "Logo uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/client-onboarding/PREVIEW`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied", description: "The onboarding form URL has been copied. Note: Each client receives a unique URL with their token." });
  };

  const groupedAvailableFields = availableFields.reduce((acc: Record<string, any[]>, field: any) => {
    const folderName = getFolderName(field.folderId);
    if (!acc[folderName]) acc[folderName] = [];
    acc[folderName].push(field);
    return acc;
  }, {});

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Client Onboarding Form URL</CardTitle>
          </div>
          <CardDescription>
            Each client receives a unique onboarding URL after signing a proposal. The URL is generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1 font-mono text-sm break-all text-muted-foreground">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/client-onboarding/`}<span className="text-primary">[client-token]</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveEditorTab("fields")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeEditorTab === "fields"
                ? "text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            style={activeEditorTab === "fields" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
          >
            <FileText className="h-3.5 w-3.5" />
            Form Fields
          </button>
          <button
            onClick={() => setActiveEditorTab("branding")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeEditorTab === "branding"
                ? "text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            style={activeEditorTab === "branding" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            Branding & Style
          </button>
        </div>

        <Button onClick={handleSave} disabled={saveMutation.isPending || customFieldsLoading} className="bg-primary hover:bg-primary/90">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {customFieldsLoading ? 'Loading fields...' : 'Save Configuration'}
        </Button>
      </div>

      {activeEditorTab === "fields" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Form Steps</h3>
              <p className="text-sm text-muted-foreground">
                Organize your onboarding form into multiple steps. Add fields from your Custom Fields to each step.
              </p>
            </div>
            <Button onClick={handleAddStep} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          <DragDropContext onDragEnd={handleStepDragEnd}>
            <Droppable droppableId="steps-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {steps.map((step, stepIndex) => (
                    <Draggable key={step.id} draggableId={step.id} index={stepIndex}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <Card className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="cursor-grab flex-shrink-0">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  Step {stepIndex + 1}
                                </Badge>
                                <Input
                                  value={step.title}
                                  onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                                  className="flex-1 min-w-0 font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base"
                                  placeholder="Step Title"
                                />
                                {steps.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveStep(step.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={step.description}
                                onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                                className="text-sm text-muted-foreground border-none shadow-none focus-visible:ring-0 p-0 h-auto pl-12"
                                placeholder="Optional step description..."
                              />
                            </CardHeader>
                            <CardContent>
                              <DragDropContext onDragEnd={(result) => handleFieldDragEnd(step.id, result)}>
                                <Droppable droppableId={`step-fields-${step.id}`}>
                                  {(fieldProvided) => (
                                    <div ref={fieldProvided.innerRef} {...fieldProvided.droppableProps} className="space-y-2 min-h-[40px]">
                                      {step.fields.length === 0 && (
                                        <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                          No fields added yet. Select fields from the dropdown below.
                                        </div>
                                      )}
                                      {step.fields.map((fieldConfig, fieldIndex) => {
                                        if (fieldConfig.type === 'text_block') {
                                          return (
                                            <Draggable key={fieldConfig.customFieldId} draggableId={fieldConfig.customFieldId} index={fieldIndex}>
                                              {(fieldDragProvided) => (
                                                <div
                                                  ref={fieldDragProvided.innerRef}
                                                  {...fieldDragProvided.draggableProps}
                                                  className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                                                >
                                                  <div className="flex items-center gap-3 mb-2">
                                                    <div {...fieldDragProvided.dragHandleProps} className="cursor-grab">
                                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-lg w-6 text-center">📝</span>
                                                    <div className="flex-1">
                                                      <div className="font-medium text-sm">Text Block</div>
                                                      <div className="text-xs text-muted-foreground">Rich text content displayed on the form</div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Text Block</Badge>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleRemoveFieldFromStep(step.id, fieldConfig.customFieldId)}
                                                      className="text-destructive hover:text-destructive"
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                  <Textarea
                                                    value={fieldConfig.textContent || ''}
                                                    onChange={(e) => handleUpdateTextBlock(step.id, fieldConfig.customFieldId, e.target.value)}
                                                    placeholder="Enter text content... Use **bold**, *italic*, ## Heading, or - bullet points (Markdown supported)"
                                                    rows={3}
                                                    className="text-sm"
                                                  />
                                                </div>
                                              )}
                                            </Draggable>
                                          );
                                        }
                                        const field = getFieldById(fieldConfig.customFieldId);
                                        return (
                                          <Draggable key={fieldConfig.customFieldId} draggableId={fieldConfig.customFieldId} index={fieldIndex}>
                                            {(fieldDragProvided) => (
                                              <div
                                                ref={fieldDragProvided.innerRef}
                                                {...fieldDragProvided.draggableProps}
                                                className={`flex items-center gap-3 p-3 rounded-lg border ${field ? 'bg-muted/50' : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'}`}
                                              >
                                                <div {...fieldDragProvided.dragHandleProps} className="cursor-grab">
                                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <span className="text-lg w-6 text-center">{field ? (fieldTypeIcons[field.type] || '?') : '⏳'}</span>
                                                <div className="flex-1">
                                                  <div className="font-medium text-sm">{field ? field.name : (customFieldsLoading ? 'Loading field...' : `Field (${fieldConfig.customFieldId.substring(0, 8)}...)`)}</div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {field ? `${getFolderName(field.folderId)} · ${field.type}` : (customFieldsLoading ? 'Loading...' : 'Custom field not found')}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  {fieldConfig.required && (
                                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                                  )}
                                                  {field && <Badge variant="secondary" className="text-xs">{field.type}</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-xs text-muted-foreground">Required</Label>
                                                  <Switch
                                                    checked={fieldConfig.required}
                                                    onCheckedChange={() => handleToggleFieldRequired(step.id, fieldConfig.customFieldId)}
                                                  />
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleRemoveFieldFromStep(step.id, fieldConfig.customFieldId)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </Draggable>
                                        );
                                      })}
                                      {fieldProvided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>

                              <div className="mt-4 flex gap-2">
                                {availableFields.length > 0 && (
                                  <div className="flex-1">
                                    <Select onValueChange={(val) => handleAddFieldToStep(step.id, val)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="+ Add a custom field to this step..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(groupedAvailableFields).map(([folderName, fields]) => (
                                          <div key={folderName}>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                              {folderName}
                                            </div>
                                            {(fields as any[]).map((field: any) => (
                                              <SelectItem key={field.id} value={field.id}>
                                                <div className="flex items-center gap-2">
                                                  <span>{fieldTypeIcons[field.type] || '?'}</span>
                                                  <span>{field.name}</span>
                                                  <span className="text-xs text-muted-foreground">({field.type})</span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </div>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="default"
                                  onClick={() => handleAddTextBlock(step.id)}
                                  className="whitespace-nowrap border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Text Block
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {customFields.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No Custom Fields Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Go to Settings → Custom Fields to create fields first. Those fields will appear here for you to add to the onboarding form.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeEditorTab === "branding" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Branding & Style
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the client onboarding form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Company Logo</Label>
                <p className="text-sm text-muted-foreground">Upload your company logo to display at the top of the onboarding form.</p>
                <div className="flex items-start gap-4">
                  {branding.logoUrl ? (
                    <div className="relative group">
                      <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                        <img src={branding.logoUrl} alt="Company logo" className="max-w-full max-h-full object-contain p-2" />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setBranding(prev => ({ ...prev, logoUrl: '' })); setHasChanges(true); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-colors">
                        {uploadingLogo ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-xs">Upload Logo</span>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Company Name</Label>
                <Input
                  value={branding.companyName}
                  onChange={(e) => { setBranding(prev => ({ ...prev, companyName: e.target.value })); setHasChanges(true); }}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Primary Color</Label>
                <p className="text-sm text-muted-foreground">This color will be used for buttons, accents, and the progress bar.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => { setBranding(prev => ({ ...prev, primaryColor: preset.value })); setHasChanges(true); }}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${branding.primaryColor === preset.value ? 'border-gray-900 scale-110 ring-2 ring-offset-2' : 'border-gray-200 hover:scale-105'}`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => { setBranding(prev => ({ ...prev, primaryColor: e.target.value })); setHasChanges(true); }}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => { setBranding(prev => ({ ...prev, primaryColor: e.target.value })); setHasChanges(true); }}
                      className="w-28 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Welcome Heading</Label>
                <Input
                  value={branding.welcomeHeading}
                  onChange={(e) => { setBranding(prev => ({ ...prev, welcomeHeading: e.target.value })); setHasChanges(true); }}
                  placeholder="Welcome heading text"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Welcome Description</Label>
                <Textarea
                  value={branding.welcomeDescription}
                  onChange={(e) => { setBranding(prev => ({ ...prev, welcomeDescription: e.target.value })); setHasChanges(true); }}
                  placeholder="Welcome description text"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Success Heading</Label>
                <Input
                  value={branding.successHeading}
                  onChange={(e) => { setBranding(prev => ({ ...prev, successHeading: e.target.value })); setHasChanges(true); }}
                  placeholder="Success page heading"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Success Description</Label>
                <Textarea
                  value={branding.successDescription}
                  onChange={(e) => { setBranding(prev => ({ ...prev, successDescription: e.target.value })); setHasChanges(true); }}
                  placeholder="Success page description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
