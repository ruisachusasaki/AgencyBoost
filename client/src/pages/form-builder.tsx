import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings, Folder } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { Form, FormField, CustomField } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FormBuilderProps {
  formId?: string;
}

export default function FormBuilder({ formId }: FormBuilderProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFields, setFormFields] = useState<Partial<FormField>[]>([]);
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  // Get current user for createdBy field
  const { data: currentUser } = useQuery<{ id: string; role: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  // Fetch form data if editing
  const { data: formData, isLoading: isLoadingForm } = useQuery<{
    id: string;
    name: string;
    description?: string;
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
    }
  }, [formData]);

  // Create or update form mutation
  const saveFormMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; fields: Partial<FormField>[]; status: string }) => {
      const payload = {
        ...data,
        createdBy: currentUser?.id || "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        status: data.status || "draft"
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-2">
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
              <CardTitle>Add Fields</CardTitle>
            </CardHeader>
            <CardContent>
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

              {/* Custom Fields - Grouped by Folder */}
              {customFields.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">Custom Fields</Label>
                  <CustomFieldsAccordion 
                    customFields={customFields} 
                    customFieldFolders={customFieldFolders}
                    onAddField={handleAddField}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
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
                ) : (
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