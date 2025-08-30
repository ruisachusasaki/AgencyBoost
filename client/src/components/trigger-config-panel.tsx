import { useState, useEffect } from "react";
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
  pipelineStages?: any[];
  onSave: (updatedTrigger: any) => void;
  onClose: () => void;
}

export default function TriggerConfigPanel({ 
  trigger, 
  triggerDefinition, 
  pipelineStages = [],
  onSave, 
  onClose 
}: TriggerConfigPanelProps) {
  const [conditions, setConditions] = useState(trigger.conditions || {});

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

    if (fieldSchema.type === "pipeline_stage") {
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
              <SelectItem value="">Any Stage</SelectItem>
              {pipelineStages.map((stage: any) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
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
    <div className="h-full flex flex-col">
      <div className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Configure Trigger</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 mt-3">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {trigger.name}
          </Badge>
          {triggerDefinition && (
            <p className="text-sm text-muted-foreground">{triggerDefinition.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
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
                    
                    // Format display value for pipeline stages
                    let displayValue = value;
                    if (key.includes('stage_id') && typeof value === 'string') {
                      const stage = pipelineStages.find(s => s.id === value);
                      displayValue = stage ? stage.name : value;
                    }
                    
                    return (
                      <div key={key} className="text-xs text-muted-foreground">
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {
                          Array.isArray(displayValue) ? displayValue.join(', ') : String(displayValue)
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No configuration options available for this trigger.</p>
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 flex-1">
            <Check className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}