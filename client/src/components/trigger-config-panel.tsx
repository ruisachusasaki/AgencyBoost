import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Settings, Check } from "lucide-react";

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

  useEffect(() => {
    setConditions(trigger.conditions || {});
  }, [trigger]);

  const handleSave = () => {
    onSave({
      ...trigger,
      conditions
    });
  };

  const renderConfigField = (fieldName: string, fieldSchema: any) => {
    const value = conditions[fieldName] || "";
    const label = fieldSchema.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

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