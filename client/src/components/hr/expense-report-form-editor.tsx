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
  DollarSign,
  Calendar,
  User,
  FileText,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'currency' | 'file' | 'user-dropdown';
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
    placeholder: 'Enter your full name',
    required: true,
    order: 0
  },
  {
    id: 'supervisor',
    label: 'Your Supervisor',
    type: 'user-dropdown',
    required: true,
    order: 1
  },
  {
    id: 'purpose',
    label: 'Purpose of the Expense',
    type: 'text',
    placeholder: 'Enter the purpose of this expense',
    required: true,
    order: 2
  },
  {
    id: 'expense_type',
    label: 'Expense Type',
    type: 'select',
    required: true,
    options: ['Hotel', 'Fuel', 'Travel', 'Meals', 'Education/Training', 'Other'],
    order: 3
  },
  {
    id: 'expense_date',
    label: 'Expense Date',
    type: 'date',
    required: true,
    order: 4
  },
  {
    id: 'expense_total',
    label: 'Expense(s) Total',
    type: 'currency',
    placeholder: '0.00',
    required: true,
    order: 5
  },
  {
    id: 'department_team',
    label: 'Department/Team',
    type: 'select',
    required: true,
    order: 6
  },
  {
    id: 'client',
    label: 'Client',
    type: 'select',
    required: false,
    order: 7
  },
  {
    id: 'reimbursement',
    label: 'Reimbursement',
    type: 'select',
    required: true,
    options: ['Yes', 'No', 'Not Sure'],
    order: 8
  },
  {
    id: 'payment_method',
    label: 'Payment Method',
    type: 'select',
    required: true,
    options: ["Joe's Card", "Che's Card", "Personal Card"],
    order: 9
  },
  {
    id: 'notes',
    label: 'Notes',
    type: 'textarea',
    placeholder: 'Add any additional notes or details',
    required: false,
    order: 10
  },
  {
    id: 'receipts',
    label: 'Receipt(s)',
    type: 'file',
    required: false,
    order: 11
  }
];

export default function ExpenseReportFormEditor() {
  // Load form configuration from backend
  const { data: configData, isLoading } = useQuery({
    queryKey: ['/api/expense-report-form-config'],
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
      return apiRequest('POST', '/api/expense-report-form-config', { fields });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense report form configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expense-report-form-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    }
  });

  const handleSaveConfiguration = () => {
    saveConfigMutation.mutate(fields);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFields(updatedItems);
  };

  const handleAddField = () => {
    if (!fieldForm.label) return;

    const newField: FormField = {
      id: `custom_${Date.now()}`,
      label: fieldForm.label!,
      type: fieldForm.type!,
      placeholder: fieldForm.placeholder,
      required: fieldForm.required!,
      options: fieldForm.options,
      order: fields.length
    };

    setFields([...fields, newField]);
    setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [] });
    setIsFieldModalOpen(false);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFieldForm({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options || []
    });
    setIsFieldModalOpen(true);
  };

  const handleUpdateField = () => {
    if (!editingField || !fieldForm.label) return;

    setFields(fields.map(f => 
      f.id === editingField.id 
        ? { ...editingField, ...fieldForm }
        : f
    ));
    setEditingField(null);
    setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [] });
    setIsFieldModalOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Are you sure you want to delete this field?")) {
      setFields(fields.filter(f => f.id !== fieldId));
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'select': return <Type className="h-4 w-4" />;
      case 'currency': return <DollarSign className="h-4 w-4" />;
      case 'file': return <Upload className="h-4 w-4" />;
      case 'user-dropdown': return <User className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Expense Report Form Configuration</h3>
          <p className="text-muted-foreground">
            Customize the fields that appear in the expense report submission form
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveConfiguration} disabled={saveConfigMutation.isPending} data-testid="button-save-config">
            {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
          </Button>
          <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingField(null); setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [] }); }} data-testid="button-add-field">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
                <DialogDescription>
                  {editingField ? 'Update the field configuration' : 'Create a custom field for the expense report form'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Field Label</Label>
                  <Input 
                    value={fieldForm.label} 
                    onChange={(e) => setFieldForm({...fieldForm, label: e.target.value})}
                    placeholder="e.g., Project Code"
                    data-testid="input-field-label"
                  />
                </div>
                <div>
                  <Label>Field Type</Label>
                  <Select 
                    value={fieldForm.type} 
                    onValueChange={(value: any) => setFieldForm({...fieldForm, type: value})}
                  >
                    <SelectTrigger data-testid="select-field-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                      <SelectItem value="user-dropdown">User Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(fieldForm.type === 'text' || fieldForm.type === 'textarea' || fieldForm.type === 'currency') && (
                  <div>
                    <Label>Placeholder (optional)</Label>
                    <Input 
                      value={fieldForm.placeholder} 
                      onChange={(e) => setFieldForm({...fieldForm, placeholder: e.target.value})}
                      placeholder="Enter placeholder text"
                      data-testid="input-field-placeholder"
                    />
                  </div>
                )}
                {fieldForm.type === 'select' && (
                  <div>
                    <Label>Options (comma-separated)</Label>
                    <Textarea 
                      value={fieldForm.options?.join(', ')} 
                      onChange={(e) => setFieldForm({...fieldForm, options: e.target.value.split(',').map(s => s.trim())})}
                      placeholder="Option 1, Option 2, Option 3"
                      data-testid="textarea-field-options"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={fieldForm.required} 
                    onCheckedChange={(checked) => setFieldForm({...fieldForm, required: checked})}
                    data-testid="switch-field-required"
                  />
                  <Label>Required Field</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsFieldModalOpen(false)}>Cancel</Button>
                  <Button onClick={editingField ? handleUpdateField : handleAddField} data-testid="button-save-field">
                    {editingField ? 'Update' : 'Add'} Field
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
          <CardDescription>Drag to reorder, click to edit or delete</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading form configuration...</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-3 bg-secondary rounded-lg border"
                            data-testid={`field-item-${field.id}`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              {getFieldIcon(field.type)}
                              <div>
                                <div className="font-medium">{field.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  Type: {field.type} {field.required && <Badge variant="outline" className="ml-2">Required</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditField(field)} data-testid={`button-edit-${field.id}`}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteField(field.id)} className="text-destructive" data-testid={`button-delete-${field.id}`}>
                                <Trash2 className="h-4 w-4" />
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
