import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { X, Settings, Check, Plus, Trash2, Filter, Tag, ChevronsUpDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

  // Fetch tags for tag autocomplete
  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ["/api/tags"],
  });

  // Fetch clients for client selection filters
  const { data: clientsData } = useQuery<any>({
    queryKey: ["/api/clients"],
  });
  const clients = clientsData?.clients || [];

  // Fetch projects for project selection filters
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch staff for staff selection filters
  const { data: staff = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  const queryClient = useQueryClient();

  // Mutation to create new tags
  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const response = await apiRequest("POST", "/api/tags", {
        name: tagName,
        color: "#3B82F6" // Default blue color
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    }
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

  // Get available fields for filtering (combine core fields and custom fields)
  const getAvailableFields = () => {
    const fields: any[] = [];
    
    // If this trigger has form_id in schema, use form fields
    if (triggerDefinition?.configSchema?.form_id) {
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
    } else if (triggerDefinition?.type?.includes('project')) {
      // For project triggers, add project-specific core fields FIRST
      fields.push({
        id: 'project',
        name: 'Project',
        type: 'project_select',
        options: []
      });
      fields.push({
        id: 'client',
        name: 'Client',
        type: 'client_select',
        options: []
      });
      fields.push({
        id: 'priority',
        name: 'Project Priority',
        type: 'dropdown',
        options: ['low', 'medium', 'high']
      });
      fields.push({
        id: 'status',
        name: 'Project Status',
        type: 'dropdown',
        options: ['planning', 'active', 'completed', 'cancelled', 'on_hold']
      });
      // Also include custom fields for projects
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type?.includes('task')) {
      // For task triggers, add task-specific core fields FIRST
      fields.push({
        id: 'assignee',
        name: 'Assigned To',
        type: 'staff_select',
        options: []
      });
      fields.push({
        id: 'priority',
        name: 'Task Priority',
        type: 'dropdown',
        options: ['low', 'normal', 'high', 'urgent']
      });
      fields.push({
        id: 'status',
        name: 'Task Status',
        type: 'dropdown',
        options: ['pending', 'in_progress', 'completed', 'cancelled']
      });
      fields.push({
        id: 'client',
        name: 'Client',
        type: 'client_select',
        options: []
      });
      fields.push({
        id: 'project',
        name: 'Project',
        type: 'project_select',
        options: []
      });
      // Also include custom fields for tasks
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type?.includes('lead')) {
      // For lead triggers, add lead-specific core fields FIRST
      fields.push({
        id: 'assignee',
        name: 'Assigned To',
        type: 'staff_select',
        options: []
      });
      fields.push({
        id: 'source',
        name: 'Lead Source',
        type: 'dropdown',
        options: ['website', 'referral', 'social_media', 'advertising', 'cold_outreach']
      });
      fields.push({
        id: 'stage',
        name: 'Lead Stage',
        type: 'dropdown',
        options: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
      });
      fields.push({
        id: 'value',
        name: 'Lead Value',
        type: 'number',
        options: []
      });
      // Also include custom fields for leads
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type?.includes('campaign')) {
      // For campaign triggers, add campaign-specific core fields FIRST
      fields.push({
        id: 'client',
        name: 'Client',
        type: 'client_select',
        options: []
      });
      fields.push({
        id: 'type',
        name: 'Campaign Type',
        type: 'dropdown',
        options: ['social_media', 'ppc', 'seo', 'email', 'content']
      });
      fields.push({
        id: 'status',
        name: 'Campaign Status',
        type: 'dropdown',
        options: ['draft', 'active', 'paused', 'completed', 'cancelled']
      });
      fields.push({
        id: 'budget',
        name: 'Budget',
        type: 'number',
        options: []
      });
      // Also include custom fields for campaigns
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type?.includes('invoice')) {
      // For financial triggers, add financial-specific core fields FIRST
      fields.push({
        id: 'client',
        name: 'Client',
        type: 'client_select',
        options: []
      });
      fields.push({
        id: 'project',
        name: 'Project',
        type: 'project_select',
        options: []
      });
      fields.push({
        id: 'amount',
        name: 'Invoice Amount',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'status',
        name: 'Invoice Status',
        type: 'dropdown',
        options: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
      });
      // Also include custom fields for invoices
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else {
      // For other non-form triggers, use custom fields directly
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    }
    
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
            {selectedField?.type === "client_select" ? (
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(index, "value", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 ? (
                    clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          {client.company && (
                            <span className="text-xs text-muted-foreground">{client.company}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No clients available
                    </div>
                  )}
                </SelectContent>
              </Select>
            ) : selectedField?.type === "project_select" ? (
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(index, "value", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length > 0 ? (
                    projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{project.name}</span>
                          {project.client && (
                            <span className="text-xs text-muted-foreground">Client: {project.client.name}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No projects available
                    </div>
                  )}
                </SelectContent>
              </Select>
            ) : selectedField?.type === "staff_select" ? (
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(index, "value", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.length > 0 ? (
                    staff.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.firstName} {member.lastName}</span>
                          {member.department && (
                            <span className="text-xs text-muted-foreground">{member.department}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No staff members available
                    </div>
                  )}
                </SelectContent>
              </Select>
            ) : selectedField?.type === "dropdown" && selectedField?.options?.length > 0 ? (
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
                      {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
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
              disabled={triggerDefinition?.configSchema?.form_id && !conditions.form_id}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>
          
          {triggerDefinition?.configSchema?.form_id && !conditions.form_id && (
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

          {filters.length === 0 && (triggerDefinition?.configSchema?.form_id ? conditions.form_id : true) && (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                {triggerDefinition?.configSchema?.form_id 
                  ? "No filters added. This trigger will fire for any submission of the selected form."
                  : "No filters added. This trigger will fire for any new client created."
                }
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

    // Special handling for tag_name fields - show tag autocomplete with create new functionality
    if (fieldName === "tag_name" && fieldSchema.type === "string") {
      const [open, setOpen] = useState(false);
      const [searchValue, setSearchValue] = useState("");

      const filteredTags = tags.filter((tag: any) => 
        tag.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      
      const exactMatch = tags.find((tag: any) => 
        tag.name.toLowerCase() === searchValue.toLowerCase()
      );

      const handleCreateTag = async () => {
        if (searchValue.trim() && !exactMatch) {
          try {
            await createTagMutation.mutateAsync(searchValue.trim());
            setConditions((prev: any) => ({ ...prev, [fieldName]: searchValue.trim() }));
            setOpen(false);
            setSearchValue("");
          } catch (error) {
            console.error("Failed to create tag:", error);
          }
        }
      };

      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {value || "Select or create a tag..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput 
                  placeholder="Search tags..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandEmpty>
                  {searchValue.trim() && !exactMatch ? (
                    <div className="p-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={handleCreateTag}
                        disabled={createTagMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create "{searchValue.trim()}"
                      </Button>
                    </div>
                  ) : (
                    "No tags found."
                  )}
                </CommandEmpty>
                {filteredTags.length > 0 && (
                  <CommandGroup>
                    {filteredTags.map((tag: any) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={(currentValue) => {
                          setConditions((prev: any) => ({ ...prev, [fieldName]: currentValue }));
                          setOpen(false);
                          setSearchValue("");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {tag.name}
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 ${
                            value === tag.name ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
          {value && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-3 w-3" />
              Selected: <Badge variant="secondary">{value}</Badge>
            </div>
          )}
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

    if (fieldSchema.type === "staff_select") {
      // For staff selection, we'll need to fetch staff data
      // For now, using placeholder staff options
      const staffOptions = [
        { id: "staff-1", name: "John Smith" },
        { id: "staff-2", name: "Sarah Johnson" },
        { id: "staff-3", name: "Mike Wilson" },
        { id: "staff-4", name: "Emily Davis" }
      ];
      
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
              {staffOptions.map((staff: any) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    <div className="space-y-6">
      {/* Trigger Info Header */}
      <div className="space-y-3">
        <Badge variant="outline" className="bg-blue-100 text-blue-800 w-fit">
          {trigger.name}
        </Badge>
        {triggerDefinition?.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {triggerDefinition.description}
          </p>
        )}
      </div>

      {/* Configuration Content */}
      {triggerDefinition?.configSchema ? (
        <>
          <div className="space-y-4">
            {/* Always show form selection first */}
            {triggerDefinition.configSchema.form_id && 
              renderConfigField("form_id", triggerDefinition.configSchema.form_id)
            }
            
            {/* Add separator if form_id exists */}
            {triggerDefinition.configSchema.form_id && Object.keys(triggerDefinition.configSchema).length > 1 && (
              <Separator className="my-4" />
            )}
            
            {/* For project triggers, show core fields first */}
            {triggerDefinition.type?.includes('project') && (
              <>
                {/* Project Status Changed trigger */}
                {triggerDefinition.configSchema.from_status && 
                  renderConfigField("from_status", triggerDefinition.configSchema.from_status)
                }
                {triggerDefinition.configSchema.to_status && 
                  renderConfigField("to_status", triggerDefinition.configSchema.to_status)
                }
                
                {/* Project Deadline Approaching trigger */}
                {triggerDefinition.configSchema.days_before && 
                  renderConfigField("days_before", triggerDefinition.configSchema.days_before)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.from_status || 
                  triggerDefinition.configSchema.to_status || 
                  triggerDefinition.configSchema.days_before) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for all project triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For task triggers, show core fields first */}
            {triggerDefinition.type?.includes('task') && (
              <>
                {/* Task Status Changed trigger */}
                {triggerDefinition.configSchema.from_status && 
                  renderConfigField("from_status", triggerDefinition.configSchema.from_status)
                }
                {triggerDefinition.configSchema.to_status && 
                  renderConfigField("to_status", triggerDefinition.configSchema.to_status)
                }
                
                {/* Task Due Soon trigger */}
                {triggerDefinition.configSchema.hours_before && 
                  renderConfigField("hours_before", triggerDefinition.configSchema.hours_before)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.from_status || 
                  triggerDefinition.configSchema.to_status || 
                  triggerDefinition.configSchema.hours_before) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for all task triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For lead triggers, show core fields first */}
            {triggerDefinition.type?.includes('lead') && (
              <>
                {/* Lead Stage Changed trigger */}
                {triggerDefinition.configSchema.from_stage && 
                  renderConfigField("from_stage", triggerDefinition.configSchema.from_stage)
                }
                {triggerDefinition.configSchema.to_stage && 
                  renderConfigField("to_stage", triggerDefinition.configSchema.to_stage)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.from_stage || 
                  triggerDefinition.configSchema.to_stage) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for all lead triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For campaign triggers, show core fields first */}
            {triggerDefinition.type?.includes('campaign') && (
              <>
                {/* Campaign Status Changed trigger */}
                {triggerDefinition.configSchema.from_status && 
                  renderConfigField("from_status", triggerDefinition.configSchema.from_status)
                }
                {triggerDefinition.configSchema.to_status && 
                  renderConfigField("to_status", triggerDefinition.configSchema.to_status)
                }
                
                {/* Campaign Performance Milestone trigger */}
                {triggerDefinition.configSchema.metric_type && 
                  renderConfigField("metric_type", triggerDefinition.configSchema.metric_type)
                }
                {triggerDefinition.configSchema.threshold && 
                  renderConfigField("threshold", triggerDefinition.configSchema.threshold)
                }
                
                {/* Campaign Budget Exceeded trigger */}
                {triggerDefinition.configSchema.percentage_threshold && 
                  renderConfigField("percentage_threshold", triggerDefinition.configSchema.percentage_threshold)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.from_status || 
                  triggerDefinition.configSchema.to_status || 
                  triggerDefinition.configSchema.metric_type || 
                  triggerDefinition.configSchema.threshold || 
                  triggerDefinition.configSchema.percentage_threshold) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for all campaign triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For financial triggers, show core fields first */}
            {triggerDefinition.type?.includes('invoice') && (
              <>
                {/* Invoice Overdue trigger */}
                {triggerDefinition.configSchema.days_overdue && 
                  renderConfigField("days_overdue", triggerDefinition.configSchema.days_overdue)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {triggerDefinition.configSchema.days_overdue && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for all financial triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}
            
            {/* For other triggers, show all fields normally */}
            {!triggerDefinition.type?.includes('project') && 
             !triggerDefinition.type?.includes('task') && 
             !triggerDefinition.type?.includes('lead') && 
             !triggerDefinition.type?.includes('campaign') && 
             !triggerDefinition.type?.includes('invoice') && 
              Object.entries(triggerDefinition.configSchema).map(([fieldName, fieldSchema]) => {
                if (fieldName === "form_id") return null; // Already rendered above
                return renderConfigField(fieldName, fieldSchema);
              })
            }
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
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 flex-1">
              <Check className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No configuration options available for this trigger.</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      )}
    </div>
  );
}