import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, ChevronDown, ChevronRight, FileText, CheckCircle, Plus, ExternalLink, Edit2, Save, X } from "lucide-react";
import type { Client } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface Section {
  id: string;
  name: string;
  isOpen: boolean;
}

interface Activity {
  id: string;
  description: string;
  user: string;
  timestamp: string;
  content: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "pending" | "completed";
}

interface NewTask {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  recurring: boolean;
}

// Mock data
const mockActivities: Activity[] = [
  {
    id: "1",
    description: "Contact updated",
    user: "Michael Brown",
    timestamp: "4 minutes ago",
    content: "Changed contact status from Lead to Customer and updated billing information."
  },
  {
    id: "2", 
    description: "Email sent",
    user: "Sarah Johnson",
    timestamp: "2 hours ago",
    content: "Welcome email template sent successfully to client."
  }
];

const mockUsers = [
  { id: "1", name: "Michael Brown" },
  { id: "2", name: "Sarah Johnson" },
  { id: "3", name: "David Wilson" }
];

// Editable Field Component (moved outside main component to prevent recreation)
const EditableField = ({ 
  fieldId, 
  label, 
  value, 
  type = 'text', 
  isCustomField = false,
  className = "text-gray-900",
  required = false,
  options = undefined as string[] | undefined,
  editingField,
  fieldEditValue,
  setFieldEditValue,
  startEditing,
  cancelEditing,
  saveFieldValue,
  updateFieldMutation,
  formatPhoneNumber
}: {
  fieldId: string;
  label: string;
  value: any;
  type?: string;
  isCustomField?: boolean;
  className?: string;
  required?: boolean;
  options?: string[];
  editingField: string | null;
  fieldEditValue: string;
  setFieldEditValue: (value: string) => void;
  startEditing: (fieldId: string, value: any) => void;
  cancelEditing: () => void;
  saveFieldValue: (fieldId: string, type: string, isCustomField: boolean) => void;
  updateFieldMutation: any;
  formatPhoneNumber: (phone: string) => string;
}) => {
  const isEditing = editingField === fieldId;
  
  return (
    <div>
      <label className="flex items-center justify-between text-gray-500 mb-1">
        <span>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            onClick={() => startEditing(fieldId, value)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </label>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          {type === 'dropdown' && options ? (
            <Select value={fieldEditValue} onValueChange={setFieldEditValue}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : type === 'dropdown_multiple' && options ? (
            <div className="flex-1">
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">Select multiple options:</div>
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    const currentValues = fieldEditValue ? fieldEditValue.split(',').map(v => v.trim()).filter(v => v) : [];
                    if (!currentValues.includes(value)) {
                      const newValues = [...currentValues, value];
                      setFieldEditValue(newValues.join(', '));
                    }
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Add option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {options.filter(option => {
                      const currentValues = fieldEditValue ? fieldEditValue.split(',').map(v => v.trim()).filter(v => v) : [];
                      return !currentValues.includes(option);
                    }).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldEditValue && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fieldEditValue.split(',').map(v => v.trim()).filter(v => v).map((value, index) => (
                      <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                        {value}
                        <button
                          type="button"
                          onClick={() => {
                            const currentValues = fieldEditValue.split(',').map(v => v.trim()).filter(v => v);
                            const newValues = currentValues.filter(v => v !== value);
                            setFieldEditValue(newValues.join(', '));
                          }}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : type === 'radio' && options ? (
            <div className="flex-1">
              <RadioGroup value={fieldEditValue} onValueChange={setFieldEditValue}>
                <div className="space-y-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                  {options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                      <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ) : type === 'checkbox' && options ? (
            <div className="flex-1">
              <div className="space-y-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                {options.map((option) => {
                  const currentValues = fieldEditValue ? fieldEditValue.split(',').map(v => v.trim()).filter(v => v) : [];
                  const isChecked = currentValues.includes(option);
                  return (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${fieldId}-${option}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          let newValues = [...currentValues];
                          if (checked) {
                            if (!newValues.includes(option)) {
                              newValues.push(option);
                            }
                          } else {
                            newValues = newValues.filter(v => v !== option);
                          }
                          setFieldEditValue(newValues.join(', '));
                        }}
                        className="data-[state=checked]:bg-[#46a1a0] data-[state=checked]:border-[#46a1a0] rounded-sm"
                      />
                      <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : type === 'multiline' || type === 'textarea' ? (
            <Textarea
              placeholder="Enter value"
              value={fieldEditValue}
              onChange={(e) => setFieldEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  saveFieldValue(fieldId, type, isCustomField);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEditing();
                }
              }}
              className="min-h-[60px]"
              autoFocus
            />
          ) : (
            <Input
              type={type === 'currency' ? 'number' : type}
              step={type === 'currency' ? '0.01' : undefined}
              placeholder={type === 'currency' ? '0.00' : 'Enter value'}
              value={fieldEditValue}
              onChange={(e) => setFieldEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveFieldValue(fieldId, type, isCustomField);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEditing();
                }
              }}
              className={type === 'url' ? "h-8 text-sm overflow-hidden" : "h-8"}
              style={type === 'url' ? { maxWidth: '100%', wordWrap: 'break-word' } : undefined}
              autoFocus
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            onClick={() => saveFieldValue(fieldId, type, isCustomField)}
            disabled={updateFieldMutation.isPending}
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            onClick={cancelEditing}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="group cursor-pointer" onClick={() => startEditing(fieldId, value)}>
          {type === 'email' && value ? (
            <a href={`mailto:${value}`} className={`${className} hover:underline group-hover:bg-gray-50 p-1 rounded block`} onClick={(e) => e.stopPropagation()}>
              {value}
            </a>
          ) : type === 'phone' && value ? (
            <p className={`${className} group-hover:bg-gray-50 p-1 rounded`}>
              {formatPhoneNumber(value)}
            </p>
          ) : type === 'url' && value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className={`${className} hover:underline group-hover:bg-gray-50 p-1 rounded block break-all`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
              {value.length > 60 ? `${value.substring(0, 60)}...` : value}
            </a>
          ) : type === 'currency' && value ? (
            <p className={`${className} group-hover:bg-gray-50 p-1 rounded`}>
              ${Number(value).toFixed(2)}
            </p>
          ) : type === 'multiline' && value ? (
            <div className={`${className} group-hover:bg-gray-50 p-1 rounded whitespace-pre-wrap`}>
              {value || "Not specified"}
            </div>
          ) : (type === 'dropdown_multiple' || type === 'checkbox') ? (
            <div className={`${className} group-hover:bg-gray-50 p-1 rounded`}>
              {value ? (
                value.split(',').map((item: string, index: number) => {
                  const trimmedItem = item.trim();
                  return trimmedItem ? (
                    <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">
                      {trimmedItem}
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-gray-500">Not specified</span>
              )}
            </div>
          ) : type === 'radio' && value ? (
            <p className={`${className} group-hover:bg-gray-50 p-1 rounded`}>
              <Badge variant="outline" className="text-xs">{value}</Badge>
            </p>
          ) : (
            <p className={`${className} group-hover:bg-gray-50 p-1 rounded`}>
              {value || "Not specified"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default function EnhancedClientDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract client ID from URL
  const clientId = window.location.pathname.split('/').pop();
  
  // State management
  const [sections, setSections] = useState<Section[]>([
    { id: "contact-details", name: "Contact Details", isOpen: true }
  ]);
  const [activeRightSection, setActiveRightSection] = useState<"notes" | "tasks">("notes");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    assignee: "",
    recurring: false
  });

  // Field editing state (works for both custom and standard fields)
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldEditValue, setFieldEditValue] = useState<string>("");

  // Helper functions to get dynamic names from custom fields
  const getClientDisplayName = () => {
    if (!client || !customFieldsData) return client?.name || "";
    
    // Find First Name and Last Name fields by exact name match
    const firstNameField = customFieldsData.find(field => 
      field.name === 'First Name' || field.name === 'FirstName' || field.name === 'first name'
    );
    const lastNameField = customFieldsData.find(field => 
      field.name === 'Last Name' || field.name === 'LastName' || field.name === 'last name'
    );
    
    const customFieldValues = client.customFieldValues as Record<string, any> || {};
    const firstName = firstNameField ? customFieldValues[firstNameField.id] || "" : "";
    const lastName = lastNameField ? customFieldValues[lastNameField.id] || "" : "";
    
    // If we have both first and last name from custom fields, use them
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    // If we only have first name, use it
    if (firstName) {
      return firstName;
    }
    // Otherwise fall back to database name
    return client.name || "";
  };

  const getBusinessDisplayName = () => {
    if (!client || !customFieldsData) return client?.company || "";
    
    // Find Business Name field by exact name match
    const businessNameField = customFieldsData.find(field => 
      field.name === 'Business Name' || field.name === 'Company Name' || field.name === 'business name'
    );
    
    const customFieldValues = client.customFieldValues as Record<string, any> || {};
    const businessName = businessNameField ? customFieldValues[businessNameField.id] || "" : "";
    
    // If we have business name from custom fields, use it
    if (businessName) {
      return businessName;
    }
    // Otherwise fall back to database company
    return client.company || "";
  };

  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
  });

  // Fetch custom field folders
  const { data: customFieldFoldersData } = useQuery<Array<{ id: string; name: string; order: number }>>({
    queryKey: ['/api/custom-field-folders'],
  });

  // Fetch custom fields
  const { data: customFieldsData } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
    queryKey: ['/api/custom-fields'],
  });

  // Update sections when custom field folders are loaded
  useEffect(() => {
    if (customFieldFoldersData && customFieldsData) {
      const newSections: Section[] = [];
      
      // Sort folders by order and add as sections only if they have fields
      const sortedFolders = [...customFieldFoldersData].sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedFolders.forEach(folder => {
        // Check if this folder has any fields
        const folderHasFields = customFieldsData.some(field => field.folderId === folder.id);
        
        if (folderHasFields) {
          newSections.push({
            id: folder.name.toLowerCase().replace(/\s+/g, '-'),
            name: folder.name,
            isOpen: false  // Closed by default
          });
        }
      });
      
      setSections(newSections);
    }
  }, [customFieldFoldersData, customFieldsData]);

  // Utility functions
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
  };

  const isSectionOpen = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.isOpen || false;
  };

  const sendSMS = () => {
    if (!smsMessage.trim()) return;
    toast({
      title: "SMS Sent",
      description: `Message sent to ${client?.name}`,
    });
    setSmsMessage("");
  };

  const sendEmail = () => {
    if (!emailMessage.trim()) return;
    toast({
      title: "Email Sent",
      description: `Email sent to ${client?.name}`,
    });
    setEmailMessage("");
  };

  // Field update mutation (handles both custom and standard fields)
  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, value, isCustomField }: { fieldId: string; value: any; isCustomField: boolean }) => {
      if (isCustomField) {
        const updatedCustomFieldValues = {
          ...(client?.customFieldValues || {}),
          [fieldId]: value
        };
        
        return await apiRequest('PUT', `/api/clients/${clientId}`, {
          customFieldValues: updatedCustomFieldValues
        });
      } else {
        return await apiRequest('PUT', `/api/clients/${clientId}`, {
          [fieldId]: value
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      toast({
        title: "Field Updated",
        description: "Field value has been saved successfully.",
      });
      setEditingField(null);
      setFieldEditValue("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update field value.",
        variant: "destructive"
      });
    }
  });

  const startEditing = useCallback((fieldId: string, currentValue: any) => {
    setEditingField(fieldId);
    setFieldEditValue(currentValue || "");
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setFieldEditValue("");
  }, []);

  const saveFieldValue = useCallback((fieldId: string, fieldType: string, isCustomField: boolean = true) => {
    let processedValue: any = fieldEditValue;
    
    // Process value based on field type
    if (fieldType === 'number') {
      processedValue = fieldEditValue ? parseFloat(fieldEditValue) : null;
    } else if (fieldType === 'currency') {
      processedValue = fieldEditValue ? parseFloat(fieldEditValue.replace(/[^\d.-]/g, '')) : null;
    } else if (fieldType === 'dropdown_multiple' || fieldType === 'checkbox') {
      // Keep comma-separated string values for multiple selections
      processedValue = fieldEditValue?.trim() || "";
    } else if (fieldType === 'radio' || fieldType === 'dropdown') {
      // Keep single string values
      processedValue = fieldEditValue?.trim() || "";
    } else if (fieldType === 'multiline') {
      // Keep multiline text as-is
      processedValue = fieldEditValue || "";
    } else {
      // Default: keep string value
      processedValue = fieldEditValue || "";
    }
    
    updateFieldMutation.mutate({ fieldId, value: processedValue, isCustomField });
  }, [fieldEditValue, updateFieldMutation]);

  // Common props for EditableField components
  const editableFieldProps = {
    editingField,
    fieldEditValue,
    setFieldEditValue,
    startEditing,
    cancelEditing,
    saveFieldValue,
    updateFieldMutation,
    formatPhoneNumber
  };



  // Loading state
  if (isLoading || !clientId) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-80"></div>
          </div>
        </div>
        <div className="w-80 bg-white border-l border-gray-200 animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
            <p className="text-gray-600 mb-4">The client you're looking for doesn't exist or has been deleted.</p>
            <Button variant="ghost" onClick={() => setLocation("/clients")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/clients")} className="mb-4 p-0 h-auto font-normal text-sm text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getClientDisplayName()}</h1>
                <p className="text-gray-600 mt-2">{getBusinessDisplayName()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary">
                {client.status}
              </Badge>
              <Badge variant="outline">
                {client.contactType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dynamic Sections - Custom Field Folders */}
                {sections.map((section) => (
                  <div key={section.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between w-full text-left mb-3"
                    >
                      <span className="font-medium text-gray-900">{section.name}</span>
                      {isSectionOpen(section.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    
                    {isSectionOpen(section.id) && (
                      <div className="space-y-4">
                        {(() => {
                          // Find the current folder data
                          const currentFolder = customFieldFoldersData?.find(
                            folder => folder.name.toLowerCase().replace(/\s+/g, '-') === section.id
                          );
                          
                          // Get custom fields for this folder, sorted by order
                          const folderFields = (customFieldsData?.filter(
                            field => field.folderId === currentFolder?.id
                          ) || []).sort((a, b) => {
                            const aOrder = (a as any).order || 0;
                            const bOrder = (b as any).order || 0;
                            return aOrder - bOrder;
                          });

                          return folderFields.map((field) => {
                            // Get the field value from client custom field values (if exists)
                            const fieldValue = (client?.customFieldValues as Record<string, any>)?.[field.id] || "";
                            
                            return (
                              <EditableField
                                key={field.id}
                                fieldId={field.id}
                                label={field.name}
                                value={fieldValue}
                                type={field.type}
                                isCustomField={true}
                                required={field.required}
                                options={field.options}
                                className={field.type === 'email' || field.type === 'url' ? "text-primary" : undefined}
                                {...editableFieldProps}
                              />
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Activity & Quick Actions */}
          <div className="lg:col-span-1">
            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Send SMS</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="SMS message..."
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendSMS()}
                    />
                    <Button 
                      onClick={sendSMS}
                      disabled={!smsMessage.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Send
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Send Email</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email message..."
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendEmail()}
                    />
                    <Button 
                      onClick={sendEmail}
                      disabled={!emailMessage.trim()}
                      variant="outline"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activity.description}</p>
                            <p className="text-sm text-gray-500">by {activity.user}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{activity.timestamp}</span>
                      </div>
                      <p className="text-gray-700 text-sm ml-10">{activity.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notes & Tasks */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex border-b border-gray-200 -mb-6">
                  <button
                    onClick={() => setActiveRightSection("notes")}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeRightSection === "notes"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => setActiveRightSection("tasks")}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeRightSection === "tasks"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Tasks
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {activeRightSection === "notes" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notes</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        placeholder="Search notes..."
                        value={searchNotes}
                        onChange={(e) => setSearchNotes(e.target.value)}
                        className="text-sm"
                      />
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                      <Button 
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!newNote.trim()}
                      >
                        Add Note
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">Meeting scheduled</span>
                          <span className="text-xs text-gray-500">2h ago</span>
                        </div>
                        <p className="text-sm text-gray-600">Discussed project requirements and timeline. Client is interested in our premium package.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">Follow-up required</span>
                          <span className="text-xs text-gray-500">1d ago</span>
                        </div>
                        <p className="text-sm text-gray-600">Need to send proposal by Friday. Client mentioned budget constraints.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Tasks</h3>
                      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Title *</Label>
                              <Input
                                value={newTask.title}
                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter task title"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Description</Label>
                              <Textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter task description"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</Label>
                                <Input
                                  type="date"
                                  value={newTask.dueDate}
                                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1 block">Due Time</Label>
                                <Input
                                  type="time"
                                  value={newTask.dueTime}
                                  onChange={(e) => setNewTask(prev => ({ ...prev, dueTime: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</Label>
                              <Select
                                value={newTask.assignee}
                                onValueChange={(value) => setNewTask(prev => ({ ...prev, assignee: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="recurring"
                                checked={newTask.recurring}
                                onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, recurring: !!checked }))}
                              />
                              <Label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                                Recurring task
                              </Label>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  if (newTask.title.trim()) {
                                    const task: Task = {
                                      id: Date.now().toString(),
                                      title: newTask.title,
                                      description: newTask.description,
                                      dueDate: newTask.dueDate ? `${newTask.dueDate}${newTask.dueTime ? ` ${newTask.dueTime}` : ''}` : undefined,
                                      status: "pending"
                                    };
                                    setClientTasks(prev => [...prev, task]);
                                    setNewTask({
                                      title: "",
                                      description: "",
                                      dueDate: "",
                                      dueTime: "",
                                      assignee: "",
                                      recurring: false
                                    });
                                    setIsTaskDialogOpen(false);
                                    toast({
                                      title: "Task Created",
                                      description: "New task has been created successfully.",
                                    });
                                  }
                                }}
                                disabled={!newTask.title.trim()}
                                className="bg-primary hover:bg-primary/90"
                              >
                                Create Task
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {clientTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No tasks yet</p>
                          <p className="text-xs text-gray-400">Create a task to get started</p>
                        </div>
                      ) : (
                        clientTasks.map((task) => (
                          <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                <Checkbox
                                  checked={task.status === "completed"}
                                  onCheckedChange={(checked) => {
                                    setClientTasks(prev => prev.map(t => 
                                      t.id === task.id 
                                        ? { ...t, status: checked ? "completed" : "pending" }
                                        : t
                                    ));
                                  }}
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                  )}
                                  {task.dueDate && (
                                    <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
