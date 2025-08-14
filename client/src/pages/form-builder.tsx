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
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings, Folder, Eye, Edit3, Palette, Type, Layout } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { Form, FormField, CustomField } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FormBuilderProps {
  formId?: string;
}

// Default form styling configuration
const defaultFormStyling = {
  layout: {
    type: 'single-column' as const, // 'single-column', 'two-column', 'single-line'
    formWidth: 600,
    fieldSpacing: 16,
    labelWidth: 120,
    showLabels: true,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    padding: { top: 24, right: 24, bottom: 24, left: 24 }
  },
  form: {
    backgroundColor: '#ffffff',
    inputBackgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    cornerRadius: 6
  },
  inputFields: {
    style: 'box' as const, // 'box' or 'line'
    fontColor: '#000000',
    activeTagColor: '#0066cc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    cornerRadius: 6,
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    margins: { top: 0, right: 0, bottom: 0, left: 0 }
  },
  labels: {
    color: '#374151',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500
  },
  placeholders: {
    color: '#9ca3af',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14
  },
  customCSS: ''
};

// Form styling configuration interface
interface FormStyling {
  layout: {
    type: 'single-column' | 'two-column' | 'single-line';
    formWidth: number;
    fieldSpacing: number;
    labelWidth: number;
    showLabels: boolean;
    margins: { top: number; right: number; bottom: number; left: number };
    padding: { top: number; right: number; bottom: number; left: number };
  };
  form: {
    backgroundColor: string;
    inputBackgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderStyle: string;
    cornerRadius: number;
  };
  inputFields: {
    style: 'box' | 'line';
    fontColor: string;
    activeTagColor: string;
    borderWidth: number;
    borderColor: string;
    cornerRadius: number;
    padding: { top: number; right: number; bottom: number; left: number };
    margins: { top: number; right: number; bottom: number; left: number };
  };
  labels: {
    color: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
  };
  placeholders: {
    color: string;
    fontFamily: string;
    fontSize: number;
  };
  customCSS: string;
}

// Sample data generator for different field types
const generateSampleData = (field: Partial<FormField>): any => {
  const fieldId = field.id || `field-${Math.random()}`;
  
  switch (field.type) {
    case 'text':
      return field.label?.toLowerCase().includes('name') ? 'John Smith' : 
             field.label?.toLowerCase().includes('company') ? 'Acme Corporation' :
             field.label?.toLowerCase().includes('title') ? 'Marketing Manager' : 'Sample text';
    case 'email':
      return 'john.smith@example.com';
    case 'phone':
      return '(555) 123-4567';
    case 'number':
      return Math.floor(Math.random() * 100) + 1;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'dropdown':
      const options = (field.settings as any)?.options || ['Option 1', 'Option 2', 'Option 3'];
      return options[0];
    case 'checkbox':
      const checkboxOptions = (field.settings as any)?.options || ['Option 1', 'Option 2'];
      return [checkboxOptions[0]];
    case 'radio':
      const radioOptions = (field.settings as any)?.options || ['Option 1', 'Option 2', 'Option 3'];
      return radioOptions[0];
    case 'rating':
      const maxRating = Number((field.settings as any)?.max) || 5;
      return Math.floor(Math.random() * maxRating) + 1;
    case 'terms_conditions':
      return true;
    default:
      return 'Sample data';
  }
};

export default function FormBuilder({ formId }: FormBuilderProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFields, setFormFields] = useState<Partial<FormField>[]>([]);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [formStyling, setFormStyling] = useState<FormStyling>(defaultFormStyling);
  const [activeStyleTab, setActiveStyleTab] = useState("layout");

  // Generate preview data for all fields
  const generatePreviewData = () => {
    const newPreviewData: Record<string, any> = {};
    formFields.forEach((field) => {
      if (field.id) {
        newPreviewData[field.id] = generateSampleData(field);
      }
    });
    setPreviewData(newPreviewData);
  };

  // Toggle preview mode and generate sample data
  const togglePreviewMode = () => {
    if (!isPreviewMode) {
      generatePreviewData();
    }
    setIsPreviewMode(!isPreviewMode);
  };

  // Get current user for createdBy field
  const { data: currentUser } = useQuery<{ id: string; role: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  // Fetch form data if editing
  const { data: formData, isLoading: isLoadingForm } = useQuery<{
    id: string;
    name: string;
    description?: string;
    status?: string;
    settings?: { styling?: FormStyling; [key: string]: any };
    fields: FormField[];
  }>({
    queryKey: ['/api/forms', formId],
    enabled: !!formId,
  });

  // Fetch custom fields for field selector
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields'],
  });

  // Fetch custom field folders to get folder names
  const { data: customFieldFolders = [] } = useQuery<Array<{id: string; name: string}>>({
    queryKey: ['/api/custom-field-folders'],
  });

  // Load form data when it's available
  useEffect(() => {
    if (formData) {
      setFormName(formData.name || "");
      setFormDescription(formData.description || "");
      setFormFields(formData.fields || []);
      
      // Load form styling from settings if available
      if (formData.settings?.styling) {
        const loadedStyling = {
          ...defaultFormStyling,
          ...formData.settings.styling
        };
        console.log('Loading form styling from data:', formData.settings.styling, 'Final styling:', loadedStyling);
        setFormStyling(loadedStyling);
      } else {
        console.log('No styling in form data, using defaults:', defaultFormStyling);
        setFormStyling(defaultFormStyling);
      }
    }
  }, [formData]);

  // Create or update form mutation
  const saveFormMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; fields: Partial<FormField>[]; status: string }) => {
      const payload = {
        ...data,
        createdBy: currentUser?.id || "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        status: data.status || "draft",
        settings: {
          styling: formStyling,
          ...(formData?.settings || {})
        }
      };
      
      if (formId) {
        return apiRequest('PUT', `/api/forms/${formId}`, payload);
      } else {
        return apiRequest('POST', '/api/forms', payload);
      }
    },
    onSuccess: (savedForm: any) => {
      const isPublishing = savedForm?.status === "published";
      toast({
        title: "Success",
        description: isPublishing 
          ? "Form published successfully! It's now live and ready to accept submissions." 
          : formId ? "Form updated successfully" : "Form created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      if (!formId && savedForm?.id) {
        navigate(`/form-builder/${savedForm.id}`);
      }
    },
    onError: (error: any) => {
      console.error("Form save error:", error);
      toast({
        title: "Error", 
        description: `Failed to save form: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveForm = () => {
    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required",
        variant: "destructive",
      });
      return;
    }

    console.log("Saving form with data:", {
      name: formName,
      description: formDescription,
      fields: formFields,
    });

    saveFormMutation.mutate({
      name: formName,
      description: formDescription,
      fields: formFields,
      status: "draft",
    });
  };

  const handlePublishForm = () => {
    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required",
        variant: "destructive",
      });
      return;
    }

    saveFormMutation.mutate({
      name: formName,
      description: formDescription,
      fields: formFields,
      status: "published",
    });
  };

  const handleAddField = (fieldType: string, customFieldId?: string) => {
    const newField: Partial<FormField> = {
      id: `temp-${Date.now()}`,
      formId: formId || "",
      type: fieldType,
      label: fieldType === 'custom_field' ? 
        customFields.find(f => f.id === customFieldId)?.name || "Custom Field" :
        getFieldTypeLabel(fieldType),
      placeholder: "",
      required: false,
      options: null,
      validation: {},
      settings: {},
      customFieldId: customFieldId || null,
      order: formFields.length,
      // createdAt will be auto-generated by the server
    };

    setFormFields([...formFields, newField as FormField]);
    setShowFieldSelector(false);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(fields =>
      fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const handleDeleteField = (fieldId: string) => {
    setFormFields(fields => fields.filter(field => field.id !== fieldId));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(formFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setFormFields(updatedItems);
  };

  if (isLoadingForm) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/marketing?tab=forms">
            <Button variant="outline" size="sm" data-testid="button-back-to-forms">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forms
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-form-builder-title">
              {formId ? "Edit Form" : "Create New Form"}
            </h1>
            <p className="text-gray-600">
              Build custom forms with drag-and-drop functionality
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSaveForm} 
            disabled={saveFormMutation.isPending}
            data-testid="button-save-form"
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveFormMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button 
            onClick={handlePublishForm} 
            disabled={saveFormMutation.isPending}
            data-testid="button-publish-form"
          >
            {formData?.status === "published" ? "Republish" : "Publish Form"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-none">
        {/* Form Settings */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-name">Form Name</Label>
                <Input
                  id="form-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter form name"
                  data-testid="input-form-name"
                />
              </div>
              <div>
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe your form's purpose"
                  rows={3}
                  data-testid="textarea-form-description"
                />
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    formData?.status === "published" 
                      ? "bg-green-100 text-green-800" 
                      : formData?.status === "archived"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`} data-testid="badge-form-status">
                    {formData?.status === "published" ? "Published" 
                     : formData?.status === "archived" ? "Archived" 
                     : "Draft"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Selector */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="add-fields" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="add-fields">Add Fields</TabsTrigger>
                  <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
                  <TabsTrigger value="styling">
                    <Palette className="w-4 h-4 mr-1" />
                    Style
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="add-fields" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Basic Fields */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('text')}
                      className="justify-start"
                      data-testid="button-add-text-field"
                    >
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('email')}
                      className="justify-start"
                      data-testid="button-add-email-field"
                    >
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('phone')}
                      className="justify-start"
                      data-testid="button-add-phone-field"
                    >
                      Phone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('number')}
                      className="justify-start"
                      data-testid="button-add-number-field"
                    >
                      Number
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('date')}
                      className="justify-start"
                      data-testid="button-add-date-field"
                    >
                      Date
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('dropdown')}
                      className="justify-start"
                      data-testid="button-add-dropdown-field"
                    >
                      Dropdown
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('checkbox')}
                      className="justify-start"
                      data-testid="button-add-checkbox-field"
                    >
                      Checkbox
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('radio')}
                      className="justify-start"
                      data-testid="button-add-radio-field"
                    >
                      Radio
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('rating')}
                      className="justify-start"
                      data-testid="button-add-rating-field"
                    >
                      Rating
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('image')}
                      className="justify-start"
                      data-testid="button-add-image-field"
                    >
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('html')}
                      className="justify-start"
                      data-testid="button-add-html-field"
                    >
                      HTML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('terms_conditions')}
                      className="justify-start text-xs"
                      data-testid="button-add-terms-field"
                    >
                      Terms
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField('button')}
                      className="justify-start"
                      data-testid="button-add-button-field"
                    >
                      Button
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom-fields" className="mt-4">
                  {customFields.length > 0 ? (
                    <CustomFieldsAccordion 
                      customFields={customFields} 
                      customFieldFolders={customFieldFolders}
                      onAddField={handleAddField}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No custom fields available</p>
                      <p className="text-sm">Create custom fields in Settings to use them here</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="styling" className="mt-4">
                  <FormStylingPanel 
                    styling={formStyling} 
                    onUpdateStyling={setFormStyling}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-2 w-full">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Form Preview</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    <Label htmlFor="preview-toggle" className="text-sm">Edit</Label>
                    <Switch
                      id="preview-toggle"
                      checked={isPreviewMode}
                      onCheckedChange={togglePreviewMode}
                      data-testid="switch-preview-mode"
                    />
                    <Label htmlFor="preview-toggle" className="text-sm">Preview</Label>
                    <Eye className="w-4 h-4" />
                  </div>
                  {isPreviewMode && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={generatePreviewData}
                      data-testid="button-refresh-preview"
                    >
                      Refresh Data
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-96">
                {formFields.length === 0 ? (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500" data-testid="text-no-fields">
                        No fields added yet
                      </p>
                      <p className="text-sm text-gray-400">
                        Use the field selector on the left to add fields
                      </p>
                    </div>
                  </div>
                ) : isPreviewMode ? (
                  // Preview Mode - Show form as end user would see it
                  <div className="max-w-none mx-auto overflow-x-auto">
                    {/* Inject Custom CSS */}
                    {formStyling.customCSS && (
                      <style dangerouslySetInnerHTML={{ __html: formStyling.customCSS }} />
                    )}
                    
                    <div 
                      className="p-6 rounded-lg border shadow-sm mx-auto"
                      style={{
                        backgroundColor: formStyling.form.backgroundColor,
                        color: formStyling.labels.color,
                        borderWidth: `${formStyling.form.borderWidth}px`,
                        borderColor: formStyling.form.borderColor,
                        borderStyle: formStyling.form.borderStyle,
                        borderRadius: `${formStyling.form.cornerRadius}px`,
                        width: `${formStyling.layout.formWidth}px`,
                        margin: `${formStyling.layout.margins.top}px ${formStyling.layout.margins.right}px ${formStyling.layout.margins.bottom}px ${formStyling.layout.margins.left}px`,
                        padding: `${formStyling.layout.padding.top}px ${formStyling.layout.padding.right}px ${formStyling.layout.padding.bottom}px ${formStyling.layout.padding.left}px`,
                      }}
                    >
                      <div 
                        className={
                          formStyling.layout.type === 'two-column' ? 'grid grid-cols-2 gap-4' :
                          formStyling.layout.type === 'single-line' ? 'flex flex-wrap gap-4' :
                          'space-y-6'
                        }
                        style={{ gap: `${formStyling.layout.fieldSpacing}px` }}
                      >
                        {formFields.map((field, index) => (
                          <FormFieldPreview
                            key={field.id || `field-${index}`}
                            field={field as FormField}
                            value={previewData[field.id || `field-${index}`]}
                            styling={formStyling}
                            onChange={(value) => {
                              setPreviewData(prev => ({
                                ...prev,
                                [field.id || `field-${index}`]: value
                              }));
                            }}
                          />
                        ))}
                        <div className="flex gap-3 pt-4">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Submit Form
                          </Button>
                          <Button variant="outline">
                            Clear Form
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode - Show editable fields
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {formFields.map((field, index) => (
                            <Draggable key={field.id || `field-${index}`} draggableId={field.id || `field-${index}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-lg p-4 bg-white ${
                                    snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                  }`}
                                  data-testid={`form-field-${field.id}`}
                                >
                                  <FormFieldEditor
                                    field={field as FormField}
                                    onUpdate={(updates) => handleUpdateField(field.id || `field-${index}`, updates)}
                                    onDelete={() => handleDeleteField(field.id || `field-${index}`)}
                                    dragProps={provided.dragHandleProps}
                                  />
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Form Field Preview Component - Renders fields as end users would see them
interface FormFieldPreviewProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  styling?: FormStyling;
}

function FormFieldPreview({ field, value, onChange, styling }: FormFieldPreviewProps) {
  // Generate dynamic styles based on form styling configuration
  const getFieldStyles = () => {
    if (!styling) return {};
    
    const inputStyle: React.CSSProperties = {
      backgroundColor: styling.form.inputBackgroundColor,
      color: styling.inputFields.fontColor || '#000000',
      borderWidth: `${styling.inputFields.borderWidth}px`,
      borderColor: styling.inputFields.borderColor,
      borderStyle: 'solid',
      borderRadius: `${styling.inputFields.cornerRadius}px`,
      padding: `${styling.inputFields.padding?.top || 8}px ${styling.inputFields.padding?.right || 12}px ${styling.inputFields.padding?.bottom || 8}px ${styling.inputFields.padding?.left || 12}px`,
      margin: `${styling.inputFields.margins?.top || 0}px ${styling.inputFields.margins?.right || 0}px ${styling.inputFields.margins?.bottom || 0}px ${styling.inputFields.margins?.left || 0}px`,
      fontFamily: styling.placeholders.fontFamily,
      fontSize: `${styling.placeholders.fontSize}px`,
    };

    // Apply line style for inputs - only bottom border
    if (styling.inputFields.style === 'line') {
      inputStyle.borderTop = 'none';
      inputStyle.borderLeft = 'none';
      inputStyle.borderRight = 'none';
      inputStyle.borderRadius = '0';
      inputStyle.backgroundColor = 'transparent';
      inputStyle.borderBottomWidth = `${styling.inputFields.borderWidth}px`;
      inputStyle.borderBottomColor = styling.inputFields.borderColor;
      inputStyle.borderBottomStyle = 'solid';
    }

    return inputStyle;
  };

  const getLabelStyles = () => {
    if (!styling) return {};
    
    return {
      color: styling.labels.color,
      fontFamily: styling.labels.fontFamily,
      fontSize: `${styling.labels.fontSize}px`,
      fontWeight: styling.labels.fontWeight,
      display: styling.layout.showLabels ? 'block' : 'none'
    };
  };

  // Create a style element for placeholders since they need CSS variables
  const getPlaceholderCSS = () => {
    if (!styling) return '';
    
    return `
      .form-field-input::placeholder {
        color: ${styling.placeholders.color} !important;
        font-family: ${styling.placeholders.fontFamily} !important;
        font-size: ${styling.placeholders.fontSize}px !important;
      }
    `;
  };

  const fieldStyles = getFieldStyles();
  const labelStyles = getLabelStyles();
  const placeholderCSS = getPlaceholderCSS();
  
  // Debug logging
  console.log('Field styling applied:', fieldStyles, 'Label styling:', labelStyles, 'Placeholder CSS:', placeholderCSS);
  
  const renderPreviewField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <>
            {styling && <style dangerouslySetInnerHTML={{ __html: placeholderCSS }} />}
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || 'value'}`}
              required={field.required || false}
              style={fieldStyles}
              className="form-field-input"
              data-testid={`preview-input-${field.id}`}
            />
          </>
        );
      
      case 'date':
        return (
          <>
            {styling && <style dangerouslySetInnerHTML={{ __html: placeholderCSS }} />}
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              required={field.required || false}
              style={fieldStyles}
              className="form-field-input"
              data-testid={`preview-date-${field.id}`}
            />
          </>
        );
      
      case 'dropdown':
        const options = (field.settings as any)?.options || ['Option 1', 'Option 2', 'Option 3'];
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger style={fieldStyles} className="form-field-input" data-testid={`preview-select-${field.id}`}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        const checkboxOptions = (field.settings as any)?.options || ['Option 1', 'Option 2'];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, index: number) => {
              const isChecked = Array.isArray(value) ? value.includes(option) : false;
              return (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${field.id}-${index}`}
                    checked={isChecked}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        onChange([...currentValues, option]);
                      } else {
                        onChange(currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    className="rounded border-gray-300"
                    data-testid={`preview-checkbox-${field.id}-${index}`}
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );
      
      case 'radio':
        const radioOptions = (field.settings as any)?.options || ['Option 1', 'Option 2', 'Option 3'];
        return (
          <div className="space-y-2">
            {radioOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}-${index}`}
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="border-gray-300"
                  data-testid={`preview-radio-${field.id}-${index}`}
                />
                <Label htmlFor={`${field.id}-${index}`} className="text-sm font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      
      case 'rating':
        const maxRating = Number((field.settings as any)?.max) || 5;
        return (
          <div className="flex gap-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className={`text-2xl ${i < (value || 0) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                data-testid={`preview-rating-${field.id}-${i + 1}`}
              >
                ★
              </button>
            ))}
          </div>
        );
      
      case 'html':
        return (
          <div 
            className="p-3 bg-gray-50 rounded border"
            dangerouslySetInnerHTML={{ 
              __html: (field.settings as any)?.content || '<p>HTML content will appear here</p>' 
            }}
            data-testid={`preview-html-${field.id}`}
          />
        );
      
      case 'terms_conditions':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              required={field.required || false}
              className="rounded border-gray-300"
              data-testid={`preview-terms-${field.id}`}
            />
            <Label htmlFor={field.id} className="text-sm">
              {(field.settings as any)?.text || 'I agree to the terms and conditions'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );
      
      case 'button':
        return (
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700"
            data-testid={`preview-button-${field.id}`}
          >
            {(field.settings as any)?.text || 'Button Text'}
          </Button>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Enter value'}
            data-testid={`preview-default-${field.id}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2" style={{ marginBottom: `${styling?.layout.fieldSpacing || 16}px` }}>
      <Label className="text-sm font-medium" style={labelStyles}>
        {field.label || 'Untitled Field'}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.placeholder && (
        <p className="text-xs text-gray-600">{field.placeholder}</p>
      )}
      {renderPreviewField()}
    </div>
  );
}

// Form Styling Panel Component
interface FormStylingPanelProps {
  styling: FormStyling;
  onUpdateStyling: (styling: FormStyling) => void;
}

const FormStylingPanel = ({ styling, onUpdateStyling }: FormStylingPanelProps) => {
  const updateStyling = (section: keyof FormStyling, updates: any) => {
    const newStyling = {
      ...styling,
      [section]: {
        ...(styling[section] as object),
        ...updates
      }
    };
    console.log('Updating styling:', section, updates, 'New styling:', newStyling);
    onUpdateStyling(newStyling);
  };

  const googleFonts = [
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Source Sans Pro, sans-serif',
    'Raleway, sans-serif',
    'Nunito, sans-serif',
    'Poppins, sans-serif',
    'Merriweather, serif'
  ];

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <Accordion type="single" collapsible className="w-full">
        {/* Layout Settings */}
        <AccordionItem value="layout">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Layout & Spacing
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Layout Type</Label>
                <Select value={styling.layout.type} onValueChange={(value) => updateStyling('layout', { type: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-column">Single Column</SelectItem>
                    <SelectItem value="two-column">Two Column</SelectItem>
                    <SelectItem value="single-line">Single Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Form Width (px)</Label>
                  <Input
                    type="number"
                    value={styling.layout.formWidth}
                    onChange={(e) => updateStyling('layout', { formWidth: parseInt(e.target.value) || 600 })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Field Spacing (px)</Label>
                  <Input
                    type="number"
                    value={styling.layout.fieldSpacing}
                    onChange={(e) => updateStyling('layout', { fieldSpacing: parseInt(e.target.value) || 16 })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Margins (px)</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Input
                    type="number"
                    placeholder="Top"
                    value={styling.layout.margins.top}
                    onChange={(e) => updateStyling('layout', { 
                      margins: { ...styling.layout.margins, top: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Right"
                    value={styling.layout.margins.right}
                    onChange={(e) => updateStyling('layout', { 
                      margins: { ...styling.layout.margins, right: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Bottom"
                    value={styling.layout.margins.bottom}
                    onChange={(e) => updateStyling('layout', { 
                      margins: { ...styling.layout.margins, bottom: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Left"
                    value={styling.layout.margins.left}
                    onChange={(e) => updateStyling('layout', { 
                      margins: { ...styling.layout.margins, left: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Padding (px)</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Input
                    type="number"
                    placeholder="Top"
                    value={styling.layout.padding.top}
                    onChange={(e) => updateStyling('layout', { 
                      padding: { ...styling.layout.padding, top: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Right"
                    value={styling.layout.padding.right}
                    onChange={(e) => updateStyling('layout', { 
                      padding: { ...styling.layout.padding, right: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Bottom"
                    value={styling.layout.padding.bottom}
                    onChange={(e) => updateStyling('layout', { 
                      padding: { ...styling.layout.padding, bottom: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Left"
                    value={styling.layout.padding.left}
                    onChange={(e) => updateStyling('layout', { 
                      padding: { ...styling.layout.padding, left: parseInt(e.target.value) || 0 }
                    })}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Form Appearance */}
        <AccordionItem value="form">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Form Appearance
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Background Color</Label>
                  <Input
                    type="color"
                    value={styling.form.backgroundColor}
                    onChange={(e) => updateStyling('form', { backgroundColor: e.target.value })}
                    className="h-8 p-1"
                  />
                </div>

              </div>

              <div>
                <Label className="text-xs">Input Background</Label>
                <Input
                  type="color"
                  value={styling.form.inputBackgroundColor}
                  onChange={(e) => updateStyling('form', { inputBackgroundColor: e.target.value })}
                  className="h-8 p-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Border Width (px)</Label>
                  <Input
                    type="number"
                    value={styling.form.borderWidth}
                    onChange={(e) => updateStyling('form', { borderWidth: parseInt(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Corner Radius (px)</Label>
                  <Input
                    type="number"
                    value={styling.form.cornerRadius}
                    onChange={(e) => updateStyling('form', { cornerRadius: parseInt(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Border Color</Label>
                <Input
                  type="color"
                  value={styling.form.borderColor}
                  onChange={(e) => updateStyling('form', { borderColor: e.target.value })}
                  className="h-8 p-1"
                />
              </div>

              <div>
                <Label className="text-xs">Border Style</Label>
                <Select value={styling.form.borderStyle} onValueChange={(value) => updateStyling('form', { borderStyle: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Input Fields */}
        <AccordionItem value="inputs">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Input Fields
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Input Style</Label>
                <Select value={styling.inputFields.style} onValueChange={(value) => updateStyling('inputFields', { style: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font Color</Label>
                  <Input
                    type="color"
                    value={styling.inputFields.fontColor || '#000000'}
                    onChange={(e) => updateStyling('inputFields', { fontColor: e.target.value })}
                    className="h-8 p-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Active Color</Label>
                  <Input
                    type="color"
                    value={styling.inputFields.activeTagColor || '#0066cc'}
                    onChange={(e) => updateStyling('inputFields', { activeTagColor: e.target.value })}
                    className="h-8 p-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Border Width (px)</Label>
                  <Input
                    type="number"
                    value={styling.inputFields.borderWidth}
                    onChange={(e) => updateStyling('inputFields', { borderWidth: parseInt(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Corner Radius (px)</Label>
                  <Input
                    type="number"
                    value={styling.inputFields.cornerRadius}
                    onChange={(e) => updateStyling('inputFields', { cornerRadius: parseInt(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Border Color</Label>
                <Input
                  type="color"
                  value={styling.inputFields.borderColor}
                  onChange={(e) => updateStyling('inputFields', { borderColor: e.target.value })}
                  className="h-8 p-1"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Labels */}
        <AccordionItem value="labels">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Labels
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Labels</Label>
                <Switch
                  checked={styling.layout.showLabels}
                  onCheckedChange={(checked) => updateStyling('layout', { showLabels: checked })}
                />
              </div>

              <div>
                <Label className="text-xs">Label Color</Label>
                <Input
                  type="color"
                  value={styling.labels.color}
                  onChange={(e) => updateStyling('labels', { color: e.target.value })}
                  className="h-8 p-1"
                />
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <Select value={styling.labels.fontFamily} onValueChange={(value) => updateStyling('labels', { fontFamily: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map(font => (
                      <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font Size (px)</Label>
                  <Input
                    type="number"
                    value={styling.labels.fontSize}
                    onChange={(e) => updateStyling('labels', { fontSize: parseInt(e.target.value) || 14 })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Font Weight</Label>
                  <Select 
                    value={styling.labels.fontWeight.toString()} 
                    onValueChange={(value) => updateStyling('labels', { fontWeight: parseInt(value) })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light (300)</SelectItem>
                      <SelectItem value="400">Normal (400)</SelectItem>
                      <SelectItem value="500">Medium (500)</SelectItem>
                      <SelectItem value="600">SemiBold (600)</SelectItem>
                      <SelectItem value="700">Bold (700)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Placeholders */}
        <AccordionItem value="placeholders">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Placeholders
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Placeholder Color</Label>
                <Input
                  type="color"
                  value={styling.placeholders.color}
                  onChange={(e) => updateStyling('placeholders', { color: e.target.value })}
                  className="h-8 p-1"
                />
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <Select value={styling.placeholders.fontFamily} onValueChange={(value) => updateStyling('placeholders', { fontFamily: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map(font => (
                      <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Font Size (px)</Label>
                <Input
                  type="number"
                  value={styling.placeholders.fontSize}
                  onChange={(e) => updateStyling('placeholders', { fontSize: parseInt(e.target.value) || 14 })}
                  className="h-8"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Custom CSS */}
        <AccordionItem value="custom-css">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Custom CSS
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              <Label className="text-xs">Custom CSS</Label>
              <Textarea
                value={styling.customCSS}
                onChange={(e) => onUpdateStyling({ ...styling, customCSS: e.target.value })}
                placeholder="Add custom CSS here..."
                className="h-24 text-xs font-mono"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Custom Fields Accordion Component
interface CustomFieldsAccordionProps {
  customFields: CustomField[];
  customFieldFolders: Array<{id: string; name: string}>;
  onAddField: (fieldType: string, customFieldId?: string) => void;
}

function CustomFieldsAccordion({ customFields, customFieldFolders, onAddField }: CustomFieldsAccordionProps) {
  
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
    <Accordion type="multiple" className="w-full">
      {sortedFolders.map((folderName) => (
        <AccordionItem key={folderName} value={folderName} className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-gray-500" />
              <span>{folderName}</span>
              <Badge variant="secondary" className="text-xs">
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
                  onClick={() => onAddField('custom_field', field.id)}
                  className="justify-start text-xs h-8 px-2"
                  data-testid={`button-add-custom-field-${field.id}`}
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

// Field type labels
function getFieldTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "Text Field",
    email: "Email Field",
    phone: "Phone Field",
    number: "Number Field",
    date: "Date Field",
    dropdown: "Dropdown",
    checkbox: "Checkbox",
    radio: "Radio Buttons",
    rating: "Rating Field",
    html: "HTML Content",
    terms_conditions: "Terms & Conditions",
    button: "Button",
    custom_field: "Custom Field",
  };
  return labels[type] || type;
}

// Form Field Editor Component
interface FormFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  dragProps: any;
}

function FormFieldEditor({ field, onUpdate, onDelete, dragProps }: FormFieldEditorProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="space-y-3">
      {/* Field Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div {...dragProps} className="cursor-move">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <Badge variant="secondary">{getFieldTypeLabel(field.type)}</Badge>
          {field.required && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            data-testid={`button-field-settings-${field.id}`}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
            data-testid={`button-delete-field-${field.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Field Preview */}
      <div className="space-y-2">
        <Label className="text-sm">
          {field.label || getFieldTypeLabel(field.type)}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {field.type === 'html' && (
          <div 
            className="border rounded-md p-3 bg-gray-50"
            dangerouslySetInnerHTML={{ 
              __html: (field.settings as any)?.content || '<p>HTML content will appear here</p>' 
            }}
          />
        )}
        {field.type === 'terms_conditions' && (
          <div className="flex items-center gap-2">
            <input type="checkbox" disabled />
            <span className="text-sm">
              {(field.settings as any)?.text || 'I agree to the terms and conditions'}
            </span>
          </div>
        )}
        {field.type === 'button' && (
          <Button variant="outline" disabled>
            {(field.settings as any)?.text || 'Button Text'}
          </Button>
        )}
        {field.type === 'rating' && (
          <div className="flex gap-1">
            {Array.from({ length: Number((field.settings as any)?.max) || 5 }, (_, i) => (
              <span key={i} className="text-yellow-400">★</span>
            ))}
          </div>
        )}
        {!['html', 'terms_conditions', 'button', 'rating'].includes(field.type) && (
          <Input
            placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || 'value'}`}
            disabled
            className="bg-gray-50"
          />
        )}
      </div>

      {/* Field Settings */}
      {showSettings && (
        <div className="border-t pt-3 space-y-3 bg-gray-50 p-3 rounded">
          <div>
            <Label htmlFor={`label-${field.id}`}>Field Label</Label>
            <Input
              id={`label-${field.id}`}
              value={field.label || ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Enter field label"
              data-testid={`input-field-label-${field.id}`}
            />
          </div>
          
          {!['html', 'terms_conditions', 'button', 'rating'].includes(field.type) && (
            <div>
              <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Enter placeholder text"
                data-testid={`input-field-placeholder-${field.id}`}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              data-testid={`checkbox-field-required-${field.id}`}
            />
            <Label htmlFor={`required-${field.id}`}>Required field</Label>
          </div>

          {field.type === 'dropdown' && (
            <div>
              <Label>Options (one per line)</Label>
              <Textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) => onUpdate({ 
                  options: e.target.value.split('\n').filter(opt => opt.trim()) 
                })}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
                data-testid={`textarea-field-options-${field.id}`}
              />
            </div>
          )}

          {field.type === 'html' && (
            <div>
              <Label>HTML Content</Label>
              <Textarea
                value={(field.settings as any)?.content || ''}
                onChange={(e) => onUpdate({ 
                  settings: { ...(field.settings as any || {}), content: e.target.value } 
                })}
                placeholder="<p>Your HTML content here</p>"
                rows={4}
                data-testid={`textarea-field-html-${field.id}`}
              />
            </div>
          )}

          {field.type === 'rating' && (
            <div>
              <Label>Maximum Rating</Label>
              <Select
                value={String((field.settings as any)?.max || 5)}
                onValueChange={(value) => onUpdate({ 
                  settings: { ...(field.settings as any || {}), max: parseInt(value) } 
                })}
              >
                <SelectTrigger data-testid={`select-field-rating-max-${field.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="10">10 Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {field.type === 'terms_conditions' && (
            <div>
              <Label>Terms Text</Label>
              <Input
                value={(field.settings as any)?.text || ''}
                onChange={(e) => onUpdate({ 
                  settings: { ...(field.settings as any || {}), text: e.target.value } 
                })}
                placeholder="I agree to the terms and conditions"
                data-testid={`input-field-terms-text-${field.id}`}
              />
            </div>
          )}

          {field.type === 'button' && (
            <div>
              <Label>Button Text</Label>
              <Input
                value={(field.settings as any)?.text || ''}
                onChange={(e) => onUpdate({ 
                  settings: { ...(field.settings as any || {}), text: e.target.value } 
                })}
                placeholder="Submit"
                data-testid={`input-field-button-text-${field.id}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}