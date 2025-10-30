import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Mail, Phone, Building2, Calendar, DollarSign, User, CheckCircle2, Tag as TagIcon, FileText, Percent, MessageSquare, StickyNote, ListTodo, CalendarCheck, Trash2, ArrowRight, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { Lead, Task, User as StaffUser, LeadPipelineStage, CustomField, Tag, LeadSource, Quote } from "@shared/schema";
import LeadNotesSection from "@/components/forms/lead-notes-section";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import LeadAppointmentsDisplay from "@/components/forms/lead-appointments-display";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LeadDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/leads/:id");
  const [activeTab, setActiveTab] = useState<"notes" | "tasks" | "appointments" | "quotes">("notes");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<string | null>(null);
  const [editingLeadField, setEditingLeadField] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customFieldEditValue, setCustomFieldEditValue] = useState<any>(null);
  const [leadFieldEditValue, setLeadFieldEditValue] = useState<any>(null);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Extract lead ID from route params
  const leadId = params?.id;

  // Fetch current user for role checking
  const { data: currentUser } = useQuery<StaffUser>({
    queryKey: ["/api/auth/current-user"],
  });

  // Check if user is admin or manager
  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  // Fetch lead data - using the specific lead endpoint
  const { data: lead, isLoading: leadLoading } = useQuery<Lead>({
    queryKey: [`/api/leads/${leadId}`],
    enabled: !!leadId,
  });

  // Fetch tasks for this lead
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Filter tasks for this lead
  const leadTasks = allTasks.filter(task => task.leadId === leadId);

  // Fetch staff data for assignee names
  const { data: staff = [] } = useQuery<StaffUser[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch pipeline stages
  const { data: pipelineStages = [] } = useQuery<LeadPipelineStage[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Fetch custom fields
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
  });

  // Fetch lead sources
  const { data: leadSources = [] } = useQuery<LeadSource[]>({
    queryKey: ["/api/lead-sources"],
  });

  // Fetch quotes for this lead
  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  // Filter quotes for this lead
  const leadQuotes = allQuotes.filter(quote => quote.leadId === leadId);

  // Filter out custom fields that duplicate core lead fields
  const coreFieldNames = ['name', 'email', 'phone', 'company', 'pipeline stage', 'status', 'potential value', 'value', 'probability', 'assigned to', 'source', 'last contact', 'created'];
  const filteredCustomFields = customFields.filter(field => 
    !coreFieldNames.includes(field.name.toLowerCase())
  );

  // Convert to Client mutation
  const convertToClientMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("Lead data not available");
      
      // Wait for quotes to finish loading before validation
      if (quotesLoading) {
        throw new Error("Loading quotes data. Please wait a moment and try again.");
      }
      
      // Validate quotes before conversion
      if (leadQuotes.length === 0) {
        throw new Error(`${lead.name} has no quotes associated to them. Please create a quote first and ensure it has been accepted.`);
      }

      // Check for accepted quotes
      const acceptedQuotes = leadQuotes.filter(q => q.status === 'accepted');
      
      if (acceptedQuotes.length === 0) {
        throw new Error(`${lead.name} has ZERO Accepted Quotes. Please go and ensure there is an ACCEPTED quote for this lead.`);
      }

      // If multiple accepted quotes, use the most recent one
      const selectedQuote = acceptedQuotes.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )[0];
      
      // Create a client from the lead data
      const clientData = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        industry: lead.industry,
        website: lead.website,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        country: lead.country,
        tags: lead.tags,
        assignedTeam: lead.assignedTo ? [lead.assignedTo] : [],
        leadId: lead.id, // This triggers automatic deal creation in the backend
        selectedQuoteId: selectedQuote.id, // Pass the selected quote ID for product transfer
      };
      
      return await apiRequest("POST", "/api/clients", clientData);
    },
    onSuccess: (data: any) => {
      // Invalidate leads cache to refresh the pipeline view
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
      
      toast({
        title: "Lead converted to client",
        description: "The lead has been successfully converted to a client.",
      });
      // Redirect to the client detail page
      setLocation(`/clients/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to client.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/leads/${leadId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
      setLocation("/leads");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead.",
        variant: "destructive",
      });
    },
  });

  // Update custom field mutation
  const updateCustomFieldMutation = useMutation({
    mutationFn: async ({ fieldName, value }: { fieldName: string; value: any }) => {
      const customFieldData = { ...(lead?.customFieldData as Record<string, any> || {}), [fieldName]: value };
      return await apiRequest("PUT", `/api/leads/${leadId}`, {
        customFields: customFieldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditingCustomField(null);
      toast({
        title: "Custom field updated",
        description: "The custom field has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update custom field.",
        variant: "destructive",
      });
    },
  });

  // Update lead field mutation
  const updateLeadFieldMutation = useMutation({
    mutationFn: async ({ fieldName, value }: { fieldName: string; value: any }) => {
      return await apiRequest("PUT", `/api/leads/${leadId}`, {
        [fieldName]: value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditingLeadField(null);
      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
        variant: "destructive",
      });
    },
  });

  // Update tags mutation
  const updateTagsMutation = useMutation({
    mutationFn: async (newTags: string[]) => {
      return await apiRequest("PUT", `/api/leads/${leadId}`, {
        tags: newTags,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditingTags(false);
      toast({
        title: "Tags updated",
        description: "The tags have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tags.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLead = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleSaveCustomField = (fieldName: string, fieldType: string) => {
    // Convert value based on field type before saving
    let valueToSave = customFieldEditValue;
    
    if (fieldType === 'number' && customFieldEditValue !== null && customFieldEditValue !== '') {
      valueToSave = Number(customFieldEditValue);
    } else if (fieldType === 'date' && customFieldEditValue) {
      valueToSave = customFieldEditValue; // Date inputs already return proper format
    }
    
    updateCustomFieldMutation.mutate({ fieldName, value: valueToSave });
  };

  const handleCancelCustomFieldEdit = () => {
    setEditingCustomField(null);
    setCustomFieldEditValue(null);
  };

  const handleStartEditCustomField = (fieldName: string, currentValue: any) => {
    setEditingCustomField(fieldName);
    // Use nullish coalescing to preserve falsy values like 0, false, empty string
    setCustomFieldEditValue(currentValue ?? '');
  };

  const handleSaveLeadField = (fieldName: string, fieldType?: string) => {
    let valueToSave = leadFieldEditValue;
    
    // Handle "unassigned" sentinel for assignedTo field
    if (fieldName === 'assignedTo' && valueToSave === 'unassigned') {
      valueToSave = null;
    }
    // Handle empty strings - convert to null for cleaner data
    else if (valueToSave === '') {
      valueToSave = null;
    }
    // Handle date fields - convert string to Date object
    else if (fieldType === 'date' && valueToSave) {
      valueToSave = new Date(valueToSave);
    }
    // Handle number fields
    else if (fieldType === 'number' && valueToSave !== null && valueToSave !== '') {
      const numValue = Number(valueToSave);
      // Guard against NaN
      valueToSave = isNaN(numValue) ? null : numValue;
    }
    
    updateLeadFieldMutation.mutate({ fieldName, value: valueToSave });
  };

  const handleCancelLeadFieldEdit = () => {
    setEditingLeadField(null);
    setLeadFieldEditValue(null);
  };

  const handleStartEditLeadField = (fieldName: string, currentValue: any) => {
    setEditingLeadField(fieldName);
    // Handle date formatting for date inputs
    if (fieldName === 'lastContactDate' && currentValue) {
      const date = new Date(currentValue);
      setLeadFieldEditValue(date.toISOString().split('T')[0]);
    }
    // Handle assignedTo field - convert null to "unassigned"
    else if (fieldName === 'assignedTo' && !currentValue) {
      setLeadFieldEditValue('unassigned');
    }
    else {
      setLeadFieldEditValue(currentValue ?? '');
    }
  };

  const handleStartEditTags = () => {
    setEditingTags(true);
    setSelectedTags(lead?.tags || []);
  };

  const handleSaveTags = () => {
    updateTagsMutation.mutate(selectedTags);
  };

  const handleCancelTagsEdit = () => {
    setEditingTags(false);
    setSelectedTags([]);
  };

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  if (leadLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading lead details...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lead not found</div>
      </div>
    );
  }

  const currentStage = pipelineStages.find(stage => stage.id === lead.pipelineStageId);
  const assignedStaff = staff.find(s => s.id === lead.assignedTo);

  // Helper function to render editable field
  const renderEditableField = (
    fieldName: string,
    label: string,
    value: any,
    icon: any,
    fieldType: 'text' | 'number' | 'date' | 'select' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const Icon = icon;
    const isEditing = editingLeadField === fieldName;
    
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <div className="flex-1">
          <div className="text-sm text-gray-500">{label}</div>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              {fieldType === 'select' && options ? (
                <Select
                  value={leadFieldEditValue ?? ''}
                  onValueChange={setLeadFieldEditValue}
                >
                  <SelectTrigger className="flex-1" data-testid={`select-lead-${fieldName}`}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={fieldType}
                  value={leadFieldEditValue ?? ''}
                  onChange={(e) => setLeadFieldEditValue(e.target.value)}
                  className="flex-1"
                  data-testid={`input-lead-${fieldName}`}
                />
              )}
              <Button
                size="sm"
                onClick={() => handleSaveLeadField(fieldName, fieldType)}
                disabled={updateLeadFieldMutation.isPending}
                data-testid={`button-save-lead-${fieldName}`}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelLeadFieldEdit}
                data-testid={`button-cancel-lead-${fieldName}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="font-medium cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
              onClick={() => handleStartEditLeadField(fieldName, value)}
              data-testid={`text-lead-${fieldName}`}
            >
              {value !== null && value !== undefined ? String(value) : <span className="text-gray-400">Click to add...</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/leads")}
            data-testid="button-back-to-leads"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-lead-name">
              {lead.name}
            </h1>
            {currentStage && (
              <Badge 
                className="mt-2"
                style={{ backgroundColor: currentStage.color }}
                data-testid="badge-lead-stage"
              >
                {currentStage.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => convertToClientMutation.mutate()}
            disabled={convertToClientMutation.isPending || quotesLoading}
            data-testid="button-convert-to-client"
          >
            <ArrowRight className="h-4 w-4" />
            {convertToClientMutation.isPending ? "Converting..." : quotesLoading ? "Loading quotes..." : "Convert to Client"}
          </Button>
          {isAdminOrManager && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
              data-testid="button-delete-lead"
            >
              <Trash2 className="h-4 w-4" />
              Delete Lead
            </Button>
          )}
        </div>
      </div>

      {/* Lead Details Card - Now Editable */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name */}
            {renderEditableField('name', 'Name', lead.name, User)}

            {/* Email */}
            {renderEditableField('email', 'Email', lead.email, Mail)}
            
            {/* Phone */}
            {renderEditableField('phone', 'Phone', lead.phone, Phone)}
            
            {/* Company */}
            {renderEditableField('company', 'Company', lead.company, Building2)}

            {/* Pipeline Stage - Non-editable for now (requires dropdown with stages) */}
            {currentStage && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Pipeline Stage</div>
                  <Badge 
                    style={{ backgroundColor: currentStage.color }}
                    data-testid="badge-lead-detail-stage"
                  >
                    {currentStage.name}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Status - Select dropdown */}
            {editingLeadField === 'status' ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={leadFieldEditValue ?? ''}
                      onValueChange={setLeadFieldEditValue}
                    >
                      <SelectTrigger className="flex-1" data-testid="select-lead-status">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Won">Won</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleSaveLeadField('status')}
                      disabled={updateLeadFieldMutation.isPending}
                      data-testid="button-save-lead-status"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelLeadFieldEdit}
                      data-testid="button-cancel-lead-status"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Status</div>
                  <Badge 
                    variant={
                      lead.status === 'Won' ? 'default' : 
                      lead.status === 'Lost' ? 'destructive' : 
                      'secondary'
                    }
                    data-testid="badge-lead-status"
                  >
                    {lead.status || 'Open'}
                  </Badge>
                </div>
                {isAdminOrManager && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEditLeadField('status', lead.status || 'Open')}
                    data-testid="button-edit-lead-status"
                  >
                    Edit
                  </Button>
                )}
              </div>
            )}
            
            {/* Potential Value */}
            {renderEditableField('value', 'Potential Value', lead.value, DollarSign, 'number')}
            
            {/* Probability */}
            {renderEditableField('probability', 'Probability (%)', lead.probability, Percent, 'number')}
            
            {/* Assigned To - Select dropdown */}
            {editingLeadField === 'assignedTo' ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Assigned To</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={leadFieldEditValue ?? ''}
                      onValueChange={setLeadFieldEditValue}
                    >
                      <SelectTrigger className="flex-1" data-testid="select-lead-assignedTo">
                        <SelectValue placeholder="Select staff..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.firstName} {s.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleSaveLeadField('assignedTo')}
                      disabled={updateLeadFieldMutation.isPending}
                      data-testid="button-save-lead-assignedTo"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelLeadFieldEdit}
                      data-testid="button-cancel-lead-assignedTo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Assigned To</div>
                  <div
                    className="font-medium cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
                    onClick={() => handleStartEditLeadField('assignedTo', lead.assignedTo)}
                    data-testid="text-lead-assignedTo"
                  >
                    {assignedStaff ? `${assignedStaff.firstName} ${assignedStaff.lastName}` : <span className="text-gray-400">Click to assign...</span>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Source - Select dropdown */}
            {editingLeadField === 'source' ? (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Source</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={leadFieldEditValue ?? ''}
                      onValueChange={setLeadFieldEditValue}
                    >
                      <SelectTrigger className="flex-1" data-testid="select-lead-source">
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSources.filter(s => s.isActive).map((source) => (
                          <SelectItem key={source.id} value={source.name}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleSaveLeadField('source')}
                      disabled={updateLeadFieldMutation.isPending}
                      data-testid="button-save-lead-source"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelLeadFieldEdit}
                      data-testid="button-cancel-lead-source"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Source</div>
                  <div
                    className="font-medium cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
                    onClick={() => handleStartEditLeadField('source', lead.source)}
                    data-testid="text-lead-source"
                  >
                    {lead.source || <span className="text-gray-400">Click to add...</span>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Last Contact Date */}
            {renderEditableField('lastContactDate', 'Last Contact', lead.lastContactDate ? format(new Date(lead.lastContactDate), "MMM d, yyyy") : null, Calendar, 'date')}
            
            {/* Created Date - Non-editable (system field) */}
            {lead.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium" data-testid="text-lead-created">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Card - Collapsible and Collapsed by Default */}
      {filteredCustomFields.length > 0 && (
        <Card>
          <Collapsible open={isCustomFieldsOpen} onOpenChange={setIsCustomFieldsOpen}>
            <CardHeader className="cursor-pointer" onClick={() => setIsCustomFieldsOpen(!isCustomFieldsOpen)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="flex items-center gap-2">
                    Custom Fields
                    <span className="text-sm font-normal text-gray-500">
                      ({filteredCustomFields.length} {filteredCustomFields.length === 1 ? 'field' : 'fields'})
                    </span>
                  </CardTitle>
                  {isCustomFieldsOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCustomFields.map(field => {
                    const customFieldData = lead.customFieldData as Record<string, any> || {};
                    const value = customFieldData[field.name];
                    const isEditing = editingCustomField === field.name;
                    
                    return (
                      <div key={field.id} className="space-y-1">
                        <div className="text-sm font-medium text-gray-700">{field.name}</div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            {field.type === 'select' && field.options ? (
                              <Select
                                value={customFieldEditValue ?? ''}
                                onValueChange={setCustomFieldEditValue}
                              >
                                <SelectTrigger className="flex-1" data-testid={`select-custom-field-${field.id}`}>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                value={customFieldEditValue ?? ''}
                                onChange={(e) => setCustomFieldEditValue(e.target.value)}
                                className="flex-1"
                                data-testid={`input-custom-field-${field.id}`}
                              />
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleSaveCustomField(field.name, field.type)}
                              disabled={updateCustomFieldMutation.isPending}
                              data-testid={`button-save-custom-field-${field.id}`}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelCustomFieldEdit}
                              data-testid={`button-cancel-custom-field-${field.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
                            onClick={() => handleStartEditCustomField(field.name, value)}
                            data-testid={`custom-field-${field.id}`}
                          >
                            {value !== null && value !== undefined ? String(value) : <span className="text-gray-400">Click to add...</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Tags Card - Inline Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingTags ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      style={isSelected ? { backgroundColor: tag.color } : undefined}
                      onClick={() => handleToggleTag(tag.name)}
                      data-testid={`badge-tag-select-${tag.id}`}
                    >
                      {tag.name}
                      {isSelected && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveTags}
                  disabled={updateTagsMutation.isPending}
                  data-testid="button-save-tags"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelTagsEdit}
                  data-testid="button-cancel-tags"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer hover:bg-gray-50 p-4 rounded border border-transparent hover:border-gray-200 transition-colors min-h-[60px]"
              onClick={handleStartEditTags}
              data-testid="tags-display"
            >
              {lead.tags && lead.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tagName: string, index: number) => {
                    const tag = tags.find(t => t.name === tagName);
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        style={{ backgroundColor: tag?.color ? `${tag.color}20` : undefined }}
                        data-testid={`badge-tag-${index}`}
                      >
                        {tagName}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Click to add tags...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs Section - Marketing Page Style */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "notes" as const, name: "Notes", icon: StickyNote, count: 0 },
            { id: "tasks" as const, name: "Tasks", icon: ListTodo, count: leadTasks.length },
            { id: "appointments" as const, name: "Appointments", icon: CalendarCheck, count: 0 },
            { id: "quotes" as const, name: "Quotes", icon: FileText, count: leadQuotes.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "notes" && (
        <div className="mt-6">
          <LeadNotesSection leadId={leadId || ""} />
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="mt-6">
          <LeadAppointmentsDisplay leadId={leadId || ""} />
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8 text-gray-500">Loading tasks...</div>
              ) : leadTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="text-no-tasks">
                  No tasks associated with this lead yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {leadTasks.map((task) => {
                    const taskAssignee = staff.find(s => s.id === task.assignedTo);
                    
                    return (
                      <Link 
                        key={task.id} 
                        href={`/tasks/${task.id}`}
                        data-testid={`link-task-${task.id}`}
                      >
                        <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium" data-testid={`text-task-title-${task.id}`}>
                                  {task.title}
                                </h3>
                                {task.status === 'completed' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                {task.status && (
                                  <Badge variant="outline" data-testid={`badge-task-status-${task.id}`}>
                                    {task.status}
                                  </Badge>
                                )}
                                
                                {task.priority && (
                                  <Badge 
                                    variant={
                                      task.priority === 'urgent' ? 'destructive' : 
                                      task.priority === 'high' ? 'default' : 
                                      'secondary'
                                    }
                                    data-testid={`badge-task-priority-${task.id}`}
                                  >
                                    {task.priority}
                                  </Badge>
                                )}
                                
                                {taskAssignee && (
                                  <span data-testid={`text-task-assignee-${task.id}`}>
                                    Assigned to: {taskAssignee.firstName} {taskAssignee.lastName}
                                  </span>
                                )}
                                
                                {task.dueDate && (
                                  <span data-testid={`text-task-due-date-${task.id}`}>
                                    Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "quotes" && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading quotes...</div>
              ) : leadQuotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="text-no-quotes">
                  No quotes associated with this lead yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {leadQuotes.map((quote) => {
                    const quoteCreator = staff.find(s => s.id === quote.createdBy);
                    
                    return (
                      <Link 
                        key={quote.id} 
                        href="/sales"
                        data-testid={`link-quote-${quote.id}`}
                      >
                        <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium" data-testid={`text-quote-name-${quote.id}`}>
                                  {quote.name}
                                </h3>
                                {quote.status === 'accepted' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <Badge 
                                  variant={
                                    quote.status === 'accepted' ? 'default' : 
                                    quote.status === 'rejected' ? 'destructive' : 
                                    quote.status === 'sent' ? 'secondary' :
                                    'outline'
                                  }
                                  data-testid={`badge-quote-status-${quote.id}`}
                                >
                                  {quote.status}
                                </Badge>
                                
                                <span className="flex items-center gap-1" data-testid={`text-quote-budget-${quote.id}`}>
                                  <DollarSign className="h-3 w-3" />
                                  {parseFloat(quote.clientBudget || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                
                                <span className="flex items-center gap-1" data-testid={`text-quote-margin-${quote.id}`}>
                                  <Percent className="h-3 w-3" />
                                  {parseFloat(quote.desiredMargin || '0').toFixed(2)}% margin
                                </span>
                                
                                {quoteCreator && (
                                  <span data-testid={`text-quote-creator-${quote.id}`}>
                                    Created by: {quoteCreator.firstName} {quoteCreator.lastName}
                                  </span>
                                )}
                                
                                {quote.createdAt && (
                                  <span data-testid={`text-quote-created-${quote.id}`}>
                                    Created: {format(new Date(quote.createdAt), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-lead">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lead.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
