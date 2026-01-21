import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import CustomFieldFileUpload from "./CustomFieldFileUpload";
import ContactCardField from "./contact-card-field";
import type { CustomField, CustomFieldFileUpload as CustomFieldFileUploadType } from "@shared/schema";

interface CustomFieldRendererProps {
  field: CustomField;
  clientId: string;
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export default function CustomFieldRenderer({
  field,
  clientId,
  value,
  onChange,
  disabled = false,
  showLabel = true,
}: CustomFieldRendererProps) {
  const [localValue, setLocalValue] = useState(value);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Fetch file uploads for file upload fields
  const { data: fileUploads = [], isLoading: isLoadingFiles } = useQuery<CustomFieldFileUploadType[]>({
    queryKey: ["/api/custom-field-files", clientId, field.id],
    queryFn: async () => {
      const response = await fetch(`/api/custom-field-files?clientId=${clientId}&customFieldId=${field.id}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch file uploads');
      }
      return response.json();
    },
    enabled: field.type === "file_upload",
  });

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleLocalChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <Input
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text"}
            value={localValue || ""}
            onChange={(e) => handleLocalChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );

      case "number":
      case "currency":
        return (
          <Input
            type="number"
            step={field.type === "currency" ? "0.01" : "1"}
            value={localValue || ""}
            onChange={(e) => handleLocalChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );

      case "date":
        const dateValue = localValue ? (typeof localValue === 'string' ? parseISO(localValue) : new Date(localValue)) : undefined;
        return (
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full pl-3 text-left font-normal justify-start",
                  !localValue && "text-muted-foreground"
                )}
              >
                {localValue ? (
                  format(dateValue!, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  handleLocalChange(date ? format(date, "yyyy-MM-dd") : null);
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "multiline":
        return (
          <Textarea
            value={localValue || ""}
            onChange={(e) => handleLocalChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            rows={3}
          />
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {(field.options || []).map((option, index) => {
              const isChecked = Array.isArray(localValue) ? localValue.includes(option) : false;
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(localValue) ? localValue : [];
                      if (checked) {
                        handleLocalChange([...currentValues, option]);
                      } else {
                        handleLocalChange(currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={localValue || ""}
            onValueChange={handleLocalChange}
            disabled={disabled}
          >
            {(field.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-radio-${index}`} />
                <Label htmlFor={`${field.id}-radio-${index}`} className="text-sm font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "dropdown":
        return (
          <Select value={localValue || ""} onValueChange={handleLocalChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "dropdown_multiple":
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-500 mb-2">
              {Array.isArray(localValue) && localValue.length > 0 
                ? `Selected: ${localValue.join(", ")}`
                : "None selected"
              }
            </div>
            {(field.options || []).map((option, index) => {
              const isSelected = Array.isArray(localValue) ? localValue.includes(option) : false;
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-multiple-${index}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(localValue) ? localValue : [];
                      if (checked) {
                        handleLocalChange([...currentValues, option]);
                      } else {
                        handleLocalChange(currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${field.id}-multiple-${index}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case "file_upload":
        if (isLoadingFiles) {
          return <div className="text-sm text-gray-500">Loading files...</div>;
        }
        return (
          <CustomFieldFileUpload
            customFieldId={field.id}
            clientId={clientId}
            value={fileUploads}
            onChange={(files) => {
              // The file uploads are managed by the CustomFieldFileUpload component
              // We don't need to store them in the client's customFieldValues JSON
              // They are stored separately in the customFieldFileUploads table
            }}
            label={field.name}
            required={field.required || false}
          />
        );

      case "contact_card":
        return (
          <ContactCardField
            value={Array.isArray(localValue) ? localValue : []}
            onChange={handleLocalChange}
            fieldName={field.name}
            maxContacts={10}
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={localValue || ""}
            onChange={(e) => handleLocalChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label className="text-sm font-medium">
          {field.name}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {renderField()}
    </div>
  );
}