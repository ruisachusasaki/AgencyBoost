import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, ChevronDown, ChevronRight, FileText, CheckCircle, Plus, ExternalLink, Edit2, Save, X, Filter, Hash, Briefcase, Workflow, Target, UserCircle, ShoppingCart, Package, Trash2 } from "lucide-react";
import type { Client, Tag, InsertTag } from "@shared/schema";
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
  type: 'general' | 'email' | 'call' | 'meeting' | 'task' | 'note' | 'campaign' | 'workflow';
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
    content: "Changed contact status from Lead to Customer and updated billing information.",
    type: "general"
  },
  {
    id: "2", 
    description: "Email sent",
    user: "Sarah Johnson",
    timestamp: "2 hours ago",
    content: "Welcome email template sent successfully to client.",
    type: "email"
  },
  {
    id: "3",
    description: "Phone call completed",
    user: "Michael Brown",
    timestamp: "1 day ago",
    content: "Discussed project requirements and budget approval.",
    type: "call"
  },
  {
    id: "4",
    description: "Meeting scheduled",
    user: "Sarah Johnson", 
    timestamp: "2 days ago",
    content: "Initial consultation meeting scheduled for next week.",
    type: "meeting"
  },
  {
    id: "5",
    description: "Task assigned",
    user: "David Wilson",
    timestamp: "3 days ago", 
    content: "Follow-up call task assigned to team member.",
    type: "task"
  },
  {
    id: "6",
    description: "Note added",
    user: "Michael Brown",
    timestamp: "4 days ago",
    content: "Client expressed interest in premium package options.",
    type: "note"
  },
  {
    id: "7",
    description: "Campaign enrolled",
    user: "Sarah Johnson",
    timestamp: "1 week ago",
    content: "Added to Q1 Email Marketing Campaign.",
    type: "campaign"
  },
  {
    id: "8",
    description: "Workflow triggered",
    user: "System",
    timestamp: "1 week ago",
    content: "New Lead Welcome Workflow initiated automatically.",
    type: "workflow"
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
  
  // Activity filtering
  const [activityFilter, setActivityFilter] = useState<'all' | 'general' | 'email' | 'call' | 'meeting' | 'task' | 'note' | 'campaign' | 'workflow'>('all');
  
  // Tags state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Products & Bundles state
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<any[]>([]);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [editingBundleQuantities, setEditingBundleQuantities] = useState<string | null>(null);
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});
  
  // Actions section accordion state
  const [actionsExpanded, setActionsExpanded] = useState({
    tags: true,
    campaigns: false,
    workflows: false,
    opportunities: false
  });
  
  // Services section accordion state
  const [servicesExpanded, setServicesExpanded] = useState({
    services: true
  });



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

  // Fetch tags data
  const { data: tagsData = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['/api/tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });

  // Fetch products data
  const { data: productsData = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Fetch bundles data
  const { data: bundlesData = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ['/api/product-bundles'],
    queryFn: async () => {
      const response = await fetch('/api/product-bundles');
      if (!response.ok) throw new Error('Failed to fetch bundles');
      return response.json();
    },
  });

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user');
      if (!response.ok) throw new Error('Failed to fetch current user');
      return response.json();
    },
  });

  // Fetch client products data
  const { data: clientProductsData = [], isLoading: clientProductsLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'products'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/products`);
      if (!response.ok) throw new Error('Failed to fetch client products');
      return response.json();
    },
    enabled: !!clientId,
  });

  // Fetch bundle details for expanded bundles with client-specific quantities
  const { data: bundleDetailsData = {} } = useQuery({
    queryKey: ['/api/bundle-details', Array.from(expandedBundles), clientId],
    queryFn: async () => {
      const bundleDetails = {};
      for (const bundleId of expandedBundles) {
        try {
          const response = await fetch(`/api/product-bundles/${bundleId}/products?clientId=${clientId}`);
          if (response.ok) {
            bundleDetails[bundleId] = await response.json();
          }
        } catch (error) {
          console.error(`Failed to fetch bundle details for ${bundleId}:`, error);
        }
      }
      return bundleDetails;
    },
    enabled: expandedBundles.size > 0 && !!clientId,
  });

  // Check if current user can delete products/bundles (Admin, Accounting, Manager roles)
  const canDeleteProducts = currentUser && ['Admin', 'Accounting', 'Manager'].includes(currentUser.role);

  // Delete product/bundle mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/clients/${clientId}/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      return productId;
    },
    onSuccess: () => {
      // Invalidate and refetch client products
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
      toast({
        title: "Success",
        description: "Product removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive",
      });
    },
  });

  // Update bundle quantities mutation
  const updateBundleQuantitiesMutation = useMutation({
    mutationFn: async ({ bundleId, customQuantities }: { bundleId: string; customQuantities: Record<string, number> }) => {
      const response = await fetch(`/api/clients/${clientId}/bundles/${bundleId}/quantities`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customQuantities }),
      });
      if (!response.ok) throw new Error('Failed to update bundle quantities');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bundle-details', Array.from(expandedBundles), clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
      setEditingBundleQuantities(null);
      setTempQuantities({});
      toast({
        title: "Bundle customized",
        description: `Bundle quantities updated. New price: $${data.newPrice?.toFixed(2)}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bundle quantities.",
        variant: "destructive",
      });
    },
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

  // Tag management functions
  const addTagToClient = async (tagName: string) => {
    if (!client || !tagName.trim()) return;
    
    try {
      const currentTags = client.tags || [];
      if (currentTags.includes(tagName)) {
        toast({
          title: "Tag already exists",
          description: `"${tagName}" is already assigned to this client`,
          variant: "destructive"
        });
        return;
      }

      const updatedTags = [...currentTags, tagName];
      await apiRequest('PUT', `/api/clients/${clientId}`, {
        tags: updatedTags
      });

      toast({
        title: "Tag added",
        description: `"${tagName}" has been added to ${client.name}`,
      });

      // Refresh client data
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
    } catch (error) {
      toast({
        title: "Error adding tag",
        description: "Failed to add tag to client",
        variant: "destructive"
      });
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      // Create the tag in the database
      await apiRequest('POST', '/api/tags', {
        name: newTagName,
        color: '#3B82F6', // Default blue color
      });

      // Add the tag to the client
      await addTagToClient(newTagName);

      // Refresh tags data
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });

      // Reset form
      setNewTagName("");
      setIsAddingTag(false);
      setShowSuggestions(false);

      toast({
        title: "Tag created",
        description: `"${newTagName}" has been created and added to ${client?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error creating tag",
        description: "Failed to create new tag",
        variant: "destructive"
      });
    }
  };

  // Filter tags based on input
  const handleTagInputChange = (value: string) => {
    setNewTagName(value);
    
    if (value.trim()) {
      const filtered = tagsData.filter((tag: Tag) => 
        tag.name.toLowerCase().includes(value.toLowerCase()) &&
        !(client.tags || []).includes(tag.name)
      );
      setFilteredTags(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredTags([]);
      setShowSuggestions(false);
    }
  };

  const selectExistingTag = (tagName: string) => {
    addTagToClient(tagName);
    setNewTagName("");
    setIsAddingTag(false);
    setShowSuggestions(false);
  };

  // Product/Bundle management functions
  const addServiceToClient = async (productId: string, productName: string) => {
    if (!client || !productId) return;
    
    try {
      // Check if product/bundle already assigned
      const isAlreadyAssigned = clientProductsData.some((cp: any) => cp.productId === productId);
      if (isAlreadyAssigned) {
        toast({
          title: "Product already exists",
          description: `"${productName}" is already assigned to this client`,
          variant: "destructive"
        });
        return;
      }

      await apiRequest('POST', `/api/clients/${clientId}/products`, {
        productId,
      });

      toast({
        title: "Product added",
        description: `"${productName}" has been added to ${client.name}`,
      });

      // Refresh client products data
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
    } catch (error) {
      toast({
        title: "Error adding product",
        description: "Failed to add product to client",
        variant: "destructive"
      });
    }
  };

  const createNewProduct = async () => {
    if (!newServiceName.trim()) return;

    try {
      // Create the product in the database
      const createdProduct = await apiRequest('POST', '/api/products', {
        name: newServiceName,
        description: '',
        cost: 0,
        type: 'one_time'
      });

      // Add the service to the client
      await addServiceToClient(createdProduct.id, createdProduct.name);

      // Refresh products data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });

      // Reset form
      setNewServiceName("");
      setIsAddingService(false);
      setShowServiceSuggestions(false);

      toast({
        title: "Product created",
        description: `"${newServiceName}" has been created and added to ${client?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error creating product",
        description: "Failed to create new product",
        variant: "destructive"
      });
    }
  };

  // Filter products and bundles based on input
  const handleServiceInputChange = (value: string) => {
    setNewServiceName(value);
    
    if (value.trim()) {
      // Filter products
      const filteredProducts = productsData.filter((product: any) => 
        product.name.toLowerCase().includes(value.toLowerCase()) &&
        !clientProductsData.some((cp: any) => cp.productId === product.id)
      );
      
      // Filter bundles
      const filteredBundles = bundlesData.filter((bundle: any) => 
        bundle.name.toLowerCase().includes(value.toLowerCase()) &&
        !clientProductsData.some((cp: any) => cp.productId === bundle.id)
      );
      
      setFilteredProducts(filteredProducts);
      setFilteredBundles(filteredBundles);
      setShowServiceSuggestions(true);
    } else {
      setFilteredProducts([]);
      setFilteredBundles([]);
      setShowServiceSuggestions(false);
    }
  };

  const selectExistingService = (productId: string, productName: string) => {
    addServiceToClient(productId, productName);
    setNewServiceName("");
    setIsAddingService(false);
    setShowServiceSuggestions(false);
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
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => setLocation("/clients")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </Button>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{getClientDisplayName()}</h1>
              <p className="text-muted-foreground">{getBusinessDisplayName()}</p>
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
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Contact Information
                </h2>
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

            {/* Actions Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags Accordion */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setActionsExpanded(prev => ({ ...prev, tags: !prev.tags }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Tags
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingTag(true);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {actionsExpanded.tags ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  {actionsExpanded.tags && (
                    <div className="mt-3 space-y-2">
                      {client.tags && client.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {client.tags.map((tagName, index) => {
                            const tag = tagsData.find((t: Tag) => t.name === tagName);
                            return (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: tag?.color ? `${tag.color}20` : undefined, borderColor: tag?.color }}
                              >
                                {tagName}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No tags assigned</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Campaigns Accordion */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setActionsExpanded(prev => ({ ...prev, campaigns: !prev.campaigns }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Campaigns
                    </h4>
                    {actionsExpanded.campaigns ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {actionsExpanded.campaigns && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">No campaigns associated</p>
                      <p className="text-xs text-gray-400">Campaigns will appear when the client is added to marketing campaigns</p>
                    </div>
                  )}
                </div>

                {/* Workflows Accordion */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setActionsExpanded(prev => ({ ...prev, workflows: !prev.workflows }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      Workflows
                    </h4>
                    {actionsExpanded.workflows ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {actionsExpanded.workflows && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">No workflows active</p>
                      <p className="text-xs text-gray-400">Automated workflows will appear when triggered for this client</p>
                    </div>
                  )}
                </div>

                {/* Opportunities Accordion */}
                <div className="pb-2">
                  <button
                    onClick={() => setActionsExpanded(prev => ({ ...prev, opportunities: !prev.opportunities }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Opportunities
                    </h4>
                    {actionsExpanded.opportunities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {actionsExpanded.opportunities && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">No opportunities tracked</p>
                      <p className="text-xs text-gray-400">Sales opportunities will appear when pipeline functionality is added</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Services Accordion */}
                <div className="pb-2">
                  <button
                    onClick={() => setServicesExpanded(prev => ({ ...prev, services: !prev.services }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Products
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingService(true);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {servicesExpanded.services ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  {servicesExpanded.services && (
                    <div className="mt-3 space-y-2">
                      {clientProductsData && clientProductsData.length > 0 ? (
                        <div className="space-y-2">
                          {clientProductsData.map((clientProduct: any, index: number) => (
                            <div key={index} className="space-y-2">
                              {/* Main Product/Bundle Item */}
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <div className="flex items-center gap-2 flex-1">
                                  {clientProduct.itemType === 'bundle' ? (
                                    <button
                                      onClick={() => {
                                        const newExpanded = new Set(expandedBundles);
                                        if (newExpanded.has(clientProduct.productId)) {
                                          newExpanded.delete(clientProduct.productId);
                                        } else {
                                          newExpanded.add(clientProduct.productId);
                                        }
                                        setExpandedBundles(newExpanded);
                                      }}
                                      className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors"
                                    >
                                      <Package className="h-4 w-4 text-teal-600" />
                                      <span className="text-sm font-medium">{clientProduct.productName}</span>
                                      <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                        Bundle
                                      </Badge>
                                      {expandedBundles.has(clientProduct.productId) ? (
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                      )}
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <ShoppingCart className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">{clientProduct.productName}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {clientProduct.productCost && (
                                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      Cost: ${clientProduct.productCost}
                                    </Badge>
                                  )}
                                  {clientProduct.itemType === 'bundle' && canDeleteProducts && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingBundleQuantities(clientProduct.productId);
                                        // Initialize temp quantities with current bundle data
                                        const currentBundle = bundleDetailsData[clientProduct.productId] || [];
                                        const initialQuantities = {};
                                        currentBundle.forEach((product: any) => {
                                          initialQuantities[product.productId] = product.quantity;
                                        });
                                        setTempQuantities(initialQuantities);
                                      }}
                                      className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                      title="Customize bundle quantities for this client"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {canDeleteProducts && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteProductMutation.mutate(clientProduct.productId)}
                                      disabled={deleteProductMutation.isPending}
                                      className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Expanded Bundle Contents */}
                              {clientProduct.itemType === 'bundle' && expandedBundles.has(clientProduct.productId) && (
                                <div className="ml-6 space-y-1">
                                  {editingBundleQuantities === clientProduct.productId ? (
                                    // Edit mode for bundle quantities
                                    <div className="space-y-2 p-3 bg-blue-50 rounded border border-blue-200">
                                      <div className="flex items-center justify-between text-sm font-medium text-blue-700">
                                        <span>Customize Bundle Quantities</span>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              updateBundleQuantitiesMutation.mutate({
                                                bundleId: clientProduct.productId,
                                                customQuantities: tempQuantities
                                              });
                                            }}
                                            disabled={updateBundleQuantitiesMutation.isPending}
                                            className="h-6 text-xs"
                                          >
                                            {updateBundleQuantitiesMutation.isPending ? 'Saving...' : 'Save'}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingBundleQuantities(null);
                                              setTempQuantities({});
                                            }}
                                            className="h-6 text-xs"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="text-xs text-blue-600 mb-2">
                                        Costs will be automatically recalculated based on new quantities
                                      </div>
                                      <div className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded border border-amber-200">
                                        ⚠️ Note: Base bundles include 1 unit of each product. Set custom quantities here for this specific client.
                                      </div>
                                      {bundleDetailsData[clientProduct.productId]?.map((bundleProduct: any, bundleIndex: number) => (
                                        <div
                                          key={bundleIndex}
                                          className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 text-sm"
                                        >
                                          <div className="w-2 h-2 bg-teal-300 rounded-full"></div>
                                          <ShoppingCart className="h-3 w-3 text-gray-400" />
                                          <span className="text-gray-600 flex-1">{bundleProduct.productName}</span>
                                          <span className="text-xs text-gray-500 mr-2">Qty:</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={tempQuantities[bundleProduct.productId] || 0}
                                            onChange={(e) => {
                                              setTempQuantities(prev => ({
                                                ...prev,
                                                [bundleProduct.productId]: parseInt(e.target.value) || 0
                                              }));
                                            }}
                                            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // View mode for bundle contents
                                    bundleDetailsData[clientProduct.productId] ? (
                                      <>
                                        {/* Check if this client has custom quantities */}
                                        {(() => {
                                          const hasCustomQuantities = bundleDetailsData[clientProduct.productId]?.some((product: any) => 
                                            product.quantity !== product.baseQuantity
                                          );
                                          return hasCustomQuantities && (
                                            <div className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded border border-amber-200">
                                              🎯 This client has custom quantities (different from base bundle)
                                            </div>
                                          );
                                        })()}
                                        
                                        {bundleDetailsData[clientProduct.productId].map((bundleProduct: any, bundleIndex: number) => (
                                          <div
                                            key={bundleIndex}
                                            className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 text-sm"
                                          >
                                            <div className="w-2 h-2 bg-teal-300 rounded-full"></div>
                                            <ShoppingCart className="h-3 w-3 text-gray-400" />
                                            <span className="text-gray-600 flex-1">{bundleProduct.productName}</span>
                                            <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-500">
                                              Qty: {bundleProduct.quantity}
                                            </Badge>
                                            {bundleProduct.productCost && (
                                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                                                ${bundleProduct.productCost} each
                                              </Badge>
                                            )}
                                            {bundleProduct.quantity !== bundleProduct.baseQuantity && (
                                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                                                Custom
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 text-sm text-gray-500">
                                        Loading bundle details...
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No products assigned</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Activity & Quick Actions */}
          <div className="lg:col-span-1">
            {/* Recent Activity - Moved to Top */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activity</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="call">Calls</SelectItem>
                        <SelectItem value="meeting">Meetings</SelectItem>
                        <SelectItem value="task">Tasks</SelectItem>
                        <SelectItem value="note">Notes</SelectItem>
                        <SelectItem value="campaign">Campaigns</SelectItem>
                        <SelectItem value="workflow">Workflows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities
                    .filter(activity => activityFilter === 'all' || activity.type === activityFilter)
                    .map((activity) => (
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                          <span className="text-sm text-gray-500">{activity.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm ml-10">{activity.content}</p>
                    </div>
                  ))}
                  {mockActivities.filter(activity => activityFilter === 'all' || activity.type === activityFilter).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm">No {activityFilter === 'all' ? '' : activityFilter} activity found</p>
                      <p className="text-xs text-gray-400">Activity will appear as actions are performed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions - Moved Below Activity */}
            <Card>
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

        {/* Add Tag Dialog */}
        <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Search or Create Tag</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  placeholder="Type to search existing tags or create new..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredTags.length > 0 && filteredTags[0].name.toLowerCase() === newTagName.toLowerCase()) {
                        selectExistingTag(filteredTags[0].name);
                      } else {
                        createNewTag();
                      }
                    }
                  }}
                  onFocus={() => {
                    if (newTagName.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicking
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredTags.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                          Existing Tags
                        </div>
                        {filteredTags.map((tag: Tag) => (
                          <button
                            key={tag.id}
                            onClick={() => selectExistingTag(tag.name)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                          >
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: tag.color || '#3B82F6' }}
                            />
                            <span className="text-sm truncate">{tag.name}</span>
                          </button>
                        ))}
                      </>
                    ) : newTagName.trim() ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No existing tags found. Press Enter to create "{newTagName}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddingTag(false);
                  setNewTagName("");
                  setShowSuggestions(false);
                }}>
                  Cancel
                </Button>
                {newTagName.trim() && (
                  <>
                    {filteredTags.length > 0 && filteredTags[0].name.toLowerCase() === newTagName.toLowerCase() ? (
                      <Button 
                        onClick={() => selectExistingTag(filteredTags[0].name)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Existing Tag
                      </Button>
                    ) : (
                      <Button 
                        onClick={createNewTag}
                        disabled={!newTagName.trim()}
                      >
                        Create & Add Tag
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Service Dialog */}
        <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Search Products or Bundles</Label>
                <Input
                  value={newServiceName}
                  onChange={(e) => handleServiceInputChange(e.target.value)}
                  placeholder="Type to search existing products/bundles or create new..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Check products first
                      if (filteredProducts.length > 0) {
                        const exactMatch = filteredProducts.find((p: any) => 
                          p.name.toLowerCase() === newServiceName.toLowerCase()
                        );
                        const productToSelect = exactMatch || filteredProducts[0];
                        selectExistingService(productToSelect.id, productToSelect.name);
                      } 
                      // Then check bundles
                      else if (filteredBundles.length > 0) {
                        const exactMatch = filteredBundles.find((b: any) => 
                          b.name.toLowerCase() === newServiceName.toLowerCase()
                        );
                        const bundleToSelect = exactMatch || filteredBundles[0];
                        selectExistingService(bundleToSelect.id, bundleToSelect.name);
                      } 
                      // Create new product if no matches
                      else if (newServiceName.trim()) {
                        createNewProduct();
                      }
                    }
                  }}
                  onFocus={() => {
                    if (newServiceName.trim()) {
                      setShowServiceSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicking
                    setTimeout(() => setShowServiceSuggestions(false), 200);
                  }}
                />
                
                {/* Autocomplete Suggestions */}
                {showServiceSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                          Products
                        </div>
                        {filteredProducts.map((product: any) => (
                          <button
                            key={product.id}
                            onClick={() => selectExistingService(product.id, product.name)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              <span className="text-sm truncate">{product.name}</span>
                            </div>
                            {product.cost && (
                              <Badge variant="outline" className="text-xs">
                                Cost: ${product.cost}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                    
                    {filteredBundles.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                          Bundles
                        </div>
                        {filteredBundles.map((bundle: any) => (
                          <button
                            key={bundle.id}
                            onClick={() => selectExistingService(bundle.id, bundle.name)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-teal-600 flex-shrink-0" />
                              <span className="text-sm truncate">{bundle.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs text-teal-600">
                              Bundle
                            </Badge>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {filteredProducts.length === 0 && filteredBundles.length === 0 && newServiceName.trim() && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No existing products or bundles found. Press Enter to create "{newServiceName}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddingService(false);
                  setNewServiceName("");
                  setShowServiceSuggestions(false);
                }}>
                  Cancel
                </Button>
                {newServiceName.trim() && (
                  <>
                    {/* Check if there's an exact match in products or bundles */}
                    {(filteredProducts.length > 0 && filteredProducts[0].name.toLowerCase() === newServiceName.toLowerCase()) || 
                     (filteredBundles.length > 0 && filteredBundles[0].name.toLowerCase() === newServiceName.toLowerCase()) ? (
                      <Button 
                        onClick={() => {
                          if (filteredProducts.length > 0 && filteredProducts[0].name.toLowerCase() === newServiceName.toLowerCase()) {
                            selectExistingService(filteredProducts[0].id, filteredProducts[0].name);
                          } else if (filteredBundles.length > 0 && filteredBundles[0].name.toLowerCase() === newServiceName.toLowerCase()) {
                            selectExistingService(filteredBundles[0].id, filteredBundles[0].name);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Existing {filteredProducts.length > 0 && filteredProducts[0].name.toLowerCase() === newServiceName.toLowerCase() ? 'Product' : 'Bundle'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={createNewProduct}
                        disabled={!newServiceName.trim()}
                      >
                        Create & Add Product
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
