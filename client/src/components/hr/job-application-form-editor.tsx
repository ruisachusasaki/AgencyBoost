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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Type, 
  Mail, 
  Phone, 
  FileText, 
  Link as LinkIcon,
  DollarSign,
  User,
  Briefcase,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'url' | 'number' | 'select' | 'job_selection';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

const defaultFields: FormField[] = [
  {
    id: 'job_opening',
    label: 'Position Applied For',
    type: 'job_selection',
    required: true,
    order: 0
  },
  {
    id: 'full_name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
    order: 1
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your.email@example.com',
    required: true,
    order: 2
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: false,
    order: 3
  },
  {
    id: 'resume_url',
    label: 'Resume/CV URL',
    type: 'url',
    placeholder: 'https://drive.google.com/...',
    required: true,
    order: 4
  },
  {
    id: 'cover_letter_url',
    label: 'Cover Letter URL',
    type: 'url',
    placeholder: 'https://...',
    required: false,
    order: 5
  },
  {
    id: 'portfolio_url',
    label: 'Portfolio/Website URL',
    type: 'url',
    placeholder: 'https://...',
    required: false,
    order: 6
  },
  {
    id: 'experience_level',
    label: 'Experience Level',
    type: 'select',
    required: true,
    options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive Level'],
    order: 7
  },
  {
    id: 'salary_expectation',
    label: 'Salary Expectation (Annual USD)',
    type: 'number',
    placeholder: '75000',
    required: false,
    order: 8
  },
  {
    id: 'additional_info',
    label: 'Additional Information',
    type: 'textarea',
    placeholder: 'Tell us why you\'re interested in this position...',
    required: false,
    order: 9
  }
];

export default function JobApplicationFormEditor() {
  // Load form configuration from backend
  const { data: configData, isLoading } = useQuery<{ fields: FormField[] }>({
    queryKey: ['/api/job-application-form-config'],
    retry: false,
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize fields from backend data
  useEffect(() => {
    if (configData?.fields) {
      setFields(configData.fields);
    }
  }, [configData]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (fieldsData: FormField[]) => {
      return await apiRequest('PUT', '/api/job-application-form-config', { fields: fieldsData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-application-form-config'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Form configuration saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save form configuration",
        variant: "destructive",
      });
    },
  });

  // Auto-save fields when they change
  useEffect(() => {
    if (fields.length > 0 && configData?.fields) {
      // Only save if the fields have actually changed from what's loaded from the backend
      const hasChanges = JSON.stringify(fields) !== JSON.stringify(configData.fields);
      if (hasChanges) {
        const timeoutId = setTimeout(() => {
          saveConfigMutation.mutate(fields);
        }, 1000); // Debounce saves by 1 second

        return () => clearTimeout(timeoutId);
      }
    }
  }, [fields, configData?.fields, saveConfigMutation]);

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'url': return <LinkIcon className="h-4 w-4" />;
      case 'number': return <DollarSign className="h-4 w-4" />;
      case 'select': return <User className="h-4 w-4" />;
      case 'job_selection': return <Briefcase className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setIsDialogOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setIsDialogOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (fieldId === 'job_opening') {
      toast({
        title: "Cannot Delete",
        description: "The job position selection field is required and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this field?")) {
      setFields(prev => prev.filter(field => field.id !== fieldId));
      toast({
        title: "Success",
        variant: "default",
        description: "Field deleted successfully",
      });
    }
  };

  const handleSaveField = (fieldData: Partial<FormField>) => {
    const cleanedData = {
      ...fieldData,
      options: fieldData.options?.filter(opt => opt.trim())
    };
    if (editingField) {
      setFields(prev => prev.map(field => 
        field.id === editingField.id 
          ? { ...field, ...cleanedData }
          : field
      ));
    } else {
      const newField: FormField = {
        id: `field_${Date.now()}`,
        label: cleanedData.label || '',
        type: cleanedData.type || 'text',
        placeholder: cleanedData.placeholder || '',
        required: cleanedData.required || false,
        options: cleanedData.options || [],
        order: fields.length
      };
      setFields(prev => [...prev, newField]);
    }
    
    setIsDialogOpen(false);
    toast({
      title: "Success",
      variant: "default",
      description: `Field ${editingField ? 'updated' : 'added'} successfully`,
    });
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedFields = items.map((field, index) => ({
      ...field,
      order: index
    }));

    // Update all fields with new orders
    setFields(prev => {
      const fieldMap = new Map(updatedFields.map(field => [field.id, field]));
      return prev.map(field => fieldMap.get(field.id) || field);
    });

    // Note: Auto-save will handle persisting the reorder
    toast({
      title: "Success",
      variant: "default", 
      description: "Field order updated successfully",
    });
  };

  const handleCopyUrl = () => {
    const careersUrl = `${window.location.origin}/careers`;
    navigator.clipboard.writeText(careersUrl);
    toast({
      title: "Success",
      variant: "default",
      description: "Careers URL copied to clipboard",
    });
  };

  const careersUrl = `${window.location.origin}/careers`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Job Application Form Configuration</h3>
          <p className="text-muted-foreground">
            Customize the fields shown to job applicants on the careers page.
          </p>
        </div>
        <Button onClick={handleAddField} data-testid="button-add-field">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Careers URL Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Public Application Form URL
          </CardTitle>
          <CardDescription>
            Share this URL with potential applicants or post it on your website. This page displays all open positions and the application form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1 font-mono text-sm break-all">
              {careersUrl}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyUrl}
                data-testid="button-copy-url"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(careersUrl, '_blank')}
                data-testid="button-open-url"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Form Fields
          </CardTitle>
          <CardDescription>
            The first field (Position Applied For) is automatically populated with open job positions and cannot be removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="form-fields">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {sortedFields.map((field, index) => (
                    <Draggable 
                      key={field.id} 
                      draggableId={field.id} 
                      index={index}
                      isDragDisabled={field.id === 'job_opening'} // Disable dragging for system field
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            snapshot.isDragging 
                              ? 'bg-blue-50 border-blue-300 shadow-lg' 
                              : 'bg-gray-50/50 hover:bg-gray-100/50'
                          } ${field.id === 'job_opening' ? 'opacity-75' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              {...provided.dragHandleProps}
                              className={`${
                                field.id === 'job_opening' 
                                  ? 'cursor-not-allowed text-muted-foreground/50' 
                                  : 'cursor-move text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            {getFieldIcon(field.type)}
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {field.label}
                                {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                {field.id === 'job_opening' && <Badge variant="default" className="text-xs">System Field</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {field.type} • {field.placeholder || 'No placeholder'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField(field)}
                              data-testid={`button-edit-field-${field.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {field.id !== 'job_opening' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                                data-testid={`button-delete-field-${field.id}`}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
        </CardContent>
      </Card>

      {/* Field Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Field' : 'Add Field'}
            </DialogTitle>
            <DialogDescription>
              Configure the field properties for the job application form.
            </DialogDescription>
          </DialogHeader>
          <FieldEditor
            field={editingField}
            onSave={handleSaveField}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FieldEditorProps {
  field: FormField | null;
  onSave: (data: Partial<FormField>) => void;
  onCancel: () => void;
}

function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const [formData, setFormData] = useState<Partial<FormField>>({
    label: field?.label || '',
    type: field?.type || 'text',
    placeholder: field?.placeholder || '',
    required: field?.required || false,
    options: field?.options || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label?.trim()) {
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Field Label *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          placeholder="Enter field label"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Field Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as FormField['type'] }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Input</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="textarea">Textarea</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="select">Dropdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={formData.placeholder}
          onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
          placeholder="Enter placeholder text"
        />
      </div>

      {formData.type === 'select' && (
        <div className="space-y-2">
          <Label>Options (one per line)</Label>
          <Textarea
            value={formData.options?.join('\n') || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              options: e.target.value.split('\n')
            }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
              }
            }}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            rows={5}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="required"
          checked={formData.required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {field ? 'Update Field' : 'Add Field'}
        </Button>
      </div>
    </form>
  );
}
