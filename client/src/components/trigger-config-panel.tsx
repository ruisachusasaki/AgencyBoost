import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Settings, Check, Plus, Trash2, Filter } from "lucide-react";

interface TriggerConfigPanelProps {
  trigger: {
    id?: string;
    type: string;
    name: string;
    conditions: any;
  };
  triggerDefinition: {
    id: string;
    name: string;
    type: string;
    description: string;
    configSchema: any;
  } | null;
  onSave: (updatedTrigger: any) => void;
  onClose: () => void;
}

export default function TriggerConfigPanel({ 
  trigger, 
  triggerDefinition, 
  onSave, 
  onClose 
}: TriggerConfigPanelProps) {
  const [conditions, setConditions] = useState(trigger.conditions || {});

  // Fetch all forms for form_id dropdowns
  const { data: forms = [] } = useQuery<any[]>({
    queryKey: ["/api/forms"],
  });

  // Fetch form fields for selected form
  const selectedFormId = conditions.form_id;
  const { data: formFields = [] } = useQuery<any[]>({
    queryKey: ["/api/form-fields", selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return [];
      const response = await fetch(`/api/form-fields?formId=${selectedFormId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedFormId
  });

  // Fetch custom fields for the filter dropdowns
  const { data: customFields = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-fields"],
  });

  useEffect(() => {
    setConditions(trigger.conditions || {});
  }, [trigger]);

  // Initialize filters array if it doesn't exist
  useEffect(() => {
    if (conditions && !conditions.filters) {
      setConditions((prev: any) => ({ ...prev, filters: [] }));
    }
  }, [conditions]);

  // Add a new filter
  const addFilter = () => {
    const newFilter = {
      field_id: "",
      operator: "equals",
      value: ""
    };
    setConditions((prev: any) => ({
      ...prev,
      filters: [...(prev.filters || []), newFilter]
    }));
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    setConditions((prev: any) => ({
      ...prev,
      filters: (prev.filters || []).filter((_: any, i: number) => i !== index)
    }));
  };

  // Update a specific filter
  const updateFilter = (index: number, field: string, value: any) => {
    setConditions((prev: any) => ({
      ...prev,
      filters: (prev.filters || []).map((filter: any, i: number) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const handleSave = () => {
    onSave({
      ...trigger,
      conditions
    });
  };

  // Get available fields for filtering (combine form fields and custom fields)
  const getAvailableFields = () => {
    const fields: any[] = [];
    
    // Process form fields with enhanced API structure
    formFields.forEach((formField: any) => {
      if (formField.label && formField.type !== 'button' && formField.type !== 'html' && formField.type !== 'terms_conditions') {
        if (formField.customFieldId && formField.customField) {
          // Custom field reference
          fields.push({
            id: formField.customFieldId,
            name: formField.label,
            type: formField.customField.type,
            options: formField.customField.options || []
          });
        } else if (!formField.customFieldId) {
          // Standard form field
          fields.push({
            id: formField.id,
            name: formField.label,
            type: formField.type,
            options: formField.options || []
          });
        }
      }
    });
    
    return fields;
  };

  // Render a single filter row
  const renderFilterRow = (filter: any, index: number) => {
    const availableFields = getAvailableFields();
    const selectedField = availableFields.find(f => f.id === filter.field_id);
    const operators = [
      { value: "equals", label: "Equals" },
      { value: "not_equals", label: "Not Equals" },
      { value: "contains", label: "Contains" },
      { value: "not_contains", label: "Does Not Contain" },
      { value: "is_empty", label: "Is Empty" },
      { value: "is_not_empty", label: "Is Not Empty" }
    ];

    return (
      <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Filter {index + 1}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeFilter(index)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Field Selection */}
          <div className="space-y-2">
            <Label>Field</Label>
            <Select
              value={filter.field_id}
              onValueChange={(value) => updateFilter(index, "field_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.length > 0 ? (
                  availableFields.map((field: any) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No fields available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Selection */}
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select
              value={filter.operator}
              onValueChange={(value) => updateFilter(index, "operator", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose condition" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label>Value</Label>
            {selectedField?.type === "dropdown" && selectedField?.options?.length > 0 ? (
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(index, "value", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose value" />
                </SelectTrigger>
                <SelectContent>
                  {selectedField.options.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={filter.value}
                onChange={(e) => updateFilter(index, "value", e.target.value)}
                placeholder="Enter value"
                disabled={filter.operator === "is_empty" || filter.operator === "is_not_empty"}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderConfigField = (fieldName: string, fieldSchema: any) => {
    const value = conditions[fieldName] || "";
    const label = fieldSchema.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    // Special handling for filters array - show dynamic filter builder
    if (fieldName === "filters" && fieldSchema.type === "array") {
      const filters = conditions.filters || [];
      return (
        <div key={fieldName} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">{label}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFilter}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              disabled={!conditions.form_id}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>
          
          {!conditions.form_id && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please select a form first to add custom field filters.
              </p>
            </div>
          )}

          {filters.length > 0 && (
            <div className="space-y-3">
              {filters.map((filter: any, index: number) => renderFilterRow(filter, index))}
            </div>
          )}

          {filters.length === 0 && conditions.form_id && (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                No filters added. This trigger will fire for any submission of the selected form.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (fieldSchema.type === "string" && fieldSchema.options) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Select 
            value={value} 
            onValueChange={(newValue) => setConditions((prev: any) => ({ ...prev, [fieldName]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldSchema.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    // Special handling for form_id fields - show form dropdown
    if (fieldName === "form_id" && fieldSchema.type === "string") {
      const activeForms = forms.filter((form: any) => form.status === "published");
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>Choose a Form</Label>
          <Select 
            value={value} 
            onValueChange={(newValue) => setConditions((prev: any) => ({ ...prev, [fieldName]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a form" />
            </SelectTrigger>
            <SelectContent>
              {activeForms.length > 0 ? (
                activeForms.map((form: any) => (
                  <SelectItem key={form.id} value={form.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{form.name}</span>
                      {form.description && (
                        <span className="text-xs text-muted-foreground">{form.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No published forms available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "string") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Input
            id={fieldName}
            value={value}
            onChange={(e) => setConditions((prev: any) => ({ ...prev, [fieldName]: e.target.value }))}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "number") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Input
            id={fieldName}
            type="number"
            value={value}
            onChange={(e) => setConditions((prev: any) => ({ ...prev, [fieldName]: Number(e.target.value) }))}
            placeholder={`Enter ${label.toLowerCase()}`}
            min={fieldSchema.min}
            max={fieldSchema.max}
          />
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "boolean") {
      return (
        <div key={fieldName} className="flex items-center space-x-2">
          <Checkbox
            id={fieldName}
            checked={value}
            onCheckedChange={(checked) => setConditions((prev: any) => ({ ...prev, [fieldName]: checked }))}
          />
          <Label htmlFor={fieldName}>{label}</Label>
        </div>
      );
    }

    if (fieldSchema.type === "array" && fieldSchema.items?.type === "string") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Input
            id={fieldName}
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => setConditions((prev: any) => ({ 
              ...prev, 
              [fieldName]: e.target.value.split(',').map((item: string) => item.trim()).filter(Boolean)
            }))}
            placeholder={`Enter ${label.toLowerCase()} (comma-separated)`}
          />
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    return null;
  };

  const hasConditions = Object.keys(conditions).some(key => conditions[key] !== "" && conditions[key] !== null && conditions[key] !== undefined);

  return (
    <Card className="w-80 border-2 border-blue-500 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Configure Trigger</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {trigger.name}
          </Badge>
          {triggerDefinition && (
            <p className="text-sm text-muted-foreground">{triggerDefinition.description}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {triggerDefinition?.configSchema ? (
          <>
            <div className="space-y-4">
              {Object.entries(triggerDefinition.configSchema).map(([fieldName, fieldSchema]) => 
                renderConfigField(fieldName, fieldSchema)
              )}
            </div>
            
            {hasConditions && (
              <div className="pt-2 border-t">
                <p className="text-xs text-green-600 font-medium mb-2">✓ Conditions Configured</p>
                <div className="space-y-1">
                  {Object.entries(conditions).map(([key, value]) => {
                    if (value === "" || value === null || value === undefined) return null;
                    
                    // For form_id, show the form name instead of the ID
                    if (key === "form_id") {
                      const selectedForm = forms.find((form: any) => form.id === value);
                      return (
                        <div key={key} className="text-xs text-muted-foreground">
                          <span className="font-medium">Form:</span> {selectedForm?.name || value}
                        </div>
                      );
                    }

                    // For filters, show a summary of applied filters
                    if (key === "filters" && Array.isArray(value) && value.length > 0) {
                      const availableFields = getAvailableFields();
                      return (
                        <div key={key} className="text-xs text-muted-foreground">
                          <span className="font-medium">Filters:</span>
                          <div className="ml-2 mt-1 space-y-1">
                            {value.map((filter: any, idx: number) => {
                              const field = availableFields.find(f => f.id === filter.field_id);
                              const fieldName = field?.name || filter.field_id;
                              const operator = filter.operator?.replace(/_/g, ' ') || 'equals';
                              return (
                                <div key={idx} className="text-xs">
                                  {fieldName} {operator} "{filter.value}"
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={key} className="text-xs text-muted-foreground">
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {
                          Array.isArray(value) ? value.join(', ') : String(value)
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Check className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No configuration options available for this trigger.</p>
            <Button onClick={onClose} className="mt-2">Close</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}