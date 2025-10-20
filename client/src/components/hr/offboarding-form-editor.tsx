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
  Calendar,
  User,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'department-dropdown' | 'position-dropdown';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

const defaultFields: FormField[] = [
  {
    id: 'full_name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter employee full name',
    required: true,
    order: 0
  },
  {
    id: 'department_team',
    label: 'Department/Team',
    type: 'department-dropdown',
    required: true,
    order: 1
  },
  {
    id: 'position',
    label: 'Position',
    type: 'position-dropdown',
    required: true,
    order: 2
  },
  {
    id: 'employment_end_date',
    label: 'Employment END Date',
    type: 'date',
    required: true,
    order: 3
  },
  {
    id: 'account_suspension_date',
    label: 'When should their accounts be suspended?',
    type: 'date',
    required: true,
    order: 4
  },
  {
    id: 'pay_off_ramp',
    label: 'What is their pay Off-Ramp?',
    type: 'text',
    placeholder: 'Describe the pay off-ramp plan',
    required: false,
    order: 5
  }
];

export default function OffboardingFormEditor() {
  // Load form configuration from backend
  const { data: configData, isLoading } = useQuery({
    queryKey: ['/api/offboarding-form-config'],
    enabled: true,
  });

  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldForm, setFieldForm] = useState<Partial<FormField>>({
    label: '',
    type: 'text',
    placeholder: '',
    required: false,
    options: []
  });
  const [optionsText, setOptionsText] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved configuration or use defaults
  useEffect(() => {
    if (configData?.fields && configData.fields.length > 0) {
      setFields(configData.fields);
    }
  }, [configData]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (fields: FormField[]) => {
      return apiRequest('POST', '/api/offboarding-form-config', { fields });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offboarding form configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/offboarding-form-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    }
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const reorderedFields = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFields(reorderedFields);
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldForm({
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      options: []
    });
    setOptionsText('');
    setIsFieldModalOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFieldForm(field);
    setOptionsText(field.options?.join('\n') || '');
    setIsFieldModalOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleSaveField = () => {
    if (!fieldForm.label || !fieldForm.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newField: FormField = {
      id: editingField?.id || `custom_${Date.now()}`,
      label: fieldForm.label,
      type: fieldForm.type as FormField['type'],
      placeholder: fieldForm.placeholder,
      required: fieldForm.required || false,
      options: fieldForm.type === 'select' ? optionsText.split('\n').filter(o => o.trim()) : undefined,
      order: editingField?.order ?? fields.length
    };

    if (editingField) {
      setFields(prev => prev.map(f => f.id === editingField.id ? newField : f));
    } else {
      setFields(prev => [...prev, newField]);
    }

    setIsFieldModalOpen(false);
    setFieldForm({});
    setOptionsText('');
  };

  const handleSaveConfiguration = () => {
    saveConfigMutation.mutate(fields);
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'select': return <User className="h-4 w-4" />;
      case 'department-dropdown': return <User className="h-4 w-4" />;
      case 'position-dropdown': return <User className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text Input';
      case 'textarea': return 'Text Area';
      case 'date': return 'Date Picker';
      case 'select': return 'Dropdown';
      case 'department-dropdown': return 'Department Dropdown';
      case 'position-dropdown': return 'Position Dropdown';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-600">Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Offboarding Form Fields</CardTitle>
              <CardDescription>
                Configure the fields that appear on the offboarding form. Drag and drop to reorder.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddField}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-add-field"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
              <Button 
                onClick={handleSaveConfiguration}
                disabled={saveConfigMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-save-config"
              >
                {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-4 bg-white border rounded-lg ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                          data-testid={`field-item-${field.id}`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="h-5 w-5 text-slate-400" />
                          </div>

                          <div className="flex items-center gap-2">
                            {getFieldIcon(field.type)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{field.label}</p>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{getFieldTypeLabel(field.type)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditField(field)}
                              data-testid={`button-edit-${field.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteField(field.id)}
                              data-testid={`button-delete-${field.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
      <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
            <DialogDescription>
              Configure the field properties below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Field Label*</Label>
              <Input
                value={fieldForm.label || ''}
                onChange={(e) => setFieldForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Employee Name"
                data-testid="input-field-label"
              />
            </div>

            <div>
              <Label>Field Type*</Label>
              <Select
                value={fieldForm.type}
                onValueChange={(value) => setFieldForm(prev => ({ ...prev, type: value as FormField['type'] }))}
              >
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="department-dropdown">Department Dropdown</SelectItem>
                  <SelectItem value="position-dropdown">Position Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(fieldForm.type === 'text' || fieldForm.type === 'textarea') && (
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={fieldForm.placeholder || ''}
                  onChange={(e) => setFieldForm(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Placeholder text"
                  data-testid="input-field-placeholder"
                />
              </div>
            )}

            {fieldForm.type === 'select' && (
              <div>
                <Label>Options (one per line)</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={5}
                  data-testid="textarea-field-options"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={fieldForm.required || false}
                onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, required: checked }))}
                data-testid="switch-field-required"
              />
              <Label>Required Field</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsFieldModalOpen(false)}
                data-testid="button-cancel-field"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveField}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-save-field"
              >
                {editingField ? 'Update Field' : 'Add Field'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
