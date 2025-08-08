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
          ) : type === 'textarea' ? (
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

  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
  });

  // Fetch custom field folders
  const { data: customFieldFoldersData } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['/api/custom-field-folders'],
  });

  // Fetch custom fields
  const { data: customFieldsData } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
    queryKey: ['/api/custom-fields'],
  });

  // Update sections when custom field folders are loaded
  useEffect(() => {
    if (customFieldFoldersData) {
      const newSections: Section[] = [
        { id: "contact-details", name: "Contact Details", isOpen: true }
      ];
      
      // Add custom field folders as sections
      customFieldFoldersData.forEach(folder => {
        newSections.push({
          id: folder.name.toLowerCase().replace(/\s+/g, '-'),
          name: folder.name,
          isOpen: false
        });
      });
      
      setSections(newSections);
    }
  }, [customFieldFoldersData]);

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
    if (fieldType === 'checkbox') {
      processedValue = fieldEditValue === 'true';
    } else if (fieldType === 'number') {
      processedValue = fieldEditValue ? parseFloat(fieldEditValue) : null;
    } else if (fieldType === 'currency') {
      processedValue = fieldEditValue ? parseFloat(fieldEditValue.replace(/[^\d.-]/g, '')) : null;
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
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Contact Details */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button variant="ghost" onClick={() => setLocation("/clients")} className="mb-3 p-0 h-auto font-normal text-sm text-[#46a1a0]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clients
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#46a1a0]/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-[#46a1a0]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-600">{client.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Owner Changed: today</span>
            <span>•</span>
            <span>Followers: 1</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Dynamic Sections - Contact Details + Custom Field Folders */}
          {sections.map((section) => (
            <div key={section.id} className="border-b border-gray-200">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{section.name}</span>
                {isSectionOpen(section.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isSectionOpen(section.id) && (
                <div className="px-4 pb-4 overflow-x-hidden" style={{ wordWrap: 'break-word' }}>
                  {section.id === "contact-details" ? (
                    <div className="space-y-4 text-sm">
                      <EditableField
                        fieldId="name"
                        label="Name"
                        value={client.name}
                        type="text"
                        isCustomField={false}
                        required={true}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="company"
                        label="Company"
                        value={client.company}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="position"
                        label="Position"
                        value={client.position}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="email"
                        label="Email"
                        value={client.email}
                        type="email"
                        isCustomField={false}
                        className="text-[#46a1a0]"
                        required={true}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="phone"
                        label="Phone"
                        value={client.phone}
                        type="phone"
                        isCustomField={false}
                        className="text-[#46a1a0]"
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="address"
                        label="Address"
                        value={client.address}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="address2"
                        label="Address 2 (Apt/Suite)"
                        value={client.address2}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="city"
                        label="City"
                        value={client.city}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="state"
                        label="State"
                        value={client.state}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="zipCode"
                        label="Zip Code"
                        value={client.zipCode}
                        type="text"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="website"
                        label="Website"
                        value={client.website}
                        type="url"
                        isCustomField={false}
                        className="text-[#46a1a0]"
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="clientVertical"
                        label="Client Vertical"
                        value={client.clientVertical}
                        type="dropdown"
                        isCustomField={false}
                        options={["Live Events", "Financial Lead Gen", "E-commerce", "SaaS", "Healthcare", "Real Estate", "Other"]}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="status"
                        label="Contact Status"
                        value={client.status}
                        type="dropdown"
                        isCustomField={false}
                        options={["active", "inactive", "pending"]}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="contactSource"
                        label="Contact Source"
                        value={client.contactSource}
                        type="dropdown"
                        isCustomField={false}
                        options={["Website", "Referral", "Social Media", "Advertising", "Cold Outreach", "Event", "Other"]}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="contactType"
                        label="Contact Type"
                        value={client.contactType}
                        type="dropdown"
                        isCustomField={false}
                        options={["lead", "client", "prospect"]}
                        {...editableFieldProps}
                      />
                      <EditableField
                        fieldId="notes"
                        label="Notes"
                        value={client.notes}
                        type="textarea"
                        isCustomField={false}
                        {...editableFieldProps}
                      />
                    </div>
                  ) : (
                    // Custom Field Folder Content
                    (() => {
                      // Find the current folder data
                      const currentFolder = customFieldFoldersData?.find(
                        folder => folder.name.toLowerCase().replace(/\s+/g, '-') === section.id
                      );
                      
                      // Get custom fields for this folder
                      const folderFields = customFieldsData?.filter(
                        field => field.folderId === currentFolder?.id
                      ) || [];

                      if (folderFields.length === 0) {
                        return (
                          <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No Custom Fields</h3>
                            <p className="text-slate-600 mb-4">
                              No custom fields have been added to this folder yet.
                            </p>
                            <p className="text-sm text-slate-500">
                              Admins can add custom fields to this folder in Settings → Custom Fields.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4 text-sm">
                          {folderFields.map((field) => {
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
                                className={field.type === 'email' || field.type === 'url' ? "text-[#46a1a0]" : undefined}
                                {...editableFieldProps}
                              />
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[#46a1a0] border-[#46a1a0]">
                {client.status}
              </Badge>
              <Badge variant="outline">
                {client.contactType}
              </Badge>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Send an SMS..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="max-w-xs"
                onKeyPress={(e) => e.key === 'Enter' && sendSMS()}
              />
              <Button 
                onClick={sendSMS}
                disabled={!smsMessage.trim()}
                className="bg-[#46a1a0] hover:bg-[#3a8684] text-white"
              >
                Send SMS
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Send an email..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="max-w-xs"
                onKeyPress={(e) => e.key === 'Enter' && sendEmail()}
              />
              <Button 
                onClick={sendEmail}
                disabled={!emailMessage.trim()}
                variant="outline"
              >
                Send Email
              </Button>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {mockActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#46a1a0]/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-[#46a1a0]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">by {activity.user}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.timestamp}</span>
                  </div>
                  <p className="text-gray-700 text-sm ml-10">{activity.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveRightSection("notes")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeRightSection === "notes"
                  ? "border-[#46a1a0] text-[#46a1a0]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveRightSection("tasks")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeRightSection === "tasks"
                  ? "border-[#46a1a0] text-[#46a1a0]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Tasks
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeRightSection === "notes" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notes</h3>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
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
                  className="w-full bg-[#46a1a0] hover:bg-[#3a8684] text-white"
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
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                        <Input
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                        <Textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter task description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
                          <Input
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Due Time</label>
                          <Input
                            type="time"
                            value={newTask.dueTime}
                            onChange={(e) => setNewTask(prev => ({ ...prev, dueTime: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</label>
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
                        <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                          Recurring task
                        </label>
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
                          className="bg-[#46a1a0] hover:bg-[#3a8684] text-white"
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
        </div>
      </div>
    </div>
  );
}
