import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Mail, Phone, Building2, Calendar, DollarSign, User, CheckCircle2, Tag as TagIcon, FileText, Percent, MessageSquare, StickyNote, ListTodo, CalendarCheck, Trash2, ArrowRight, X, Plus, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Lead, Task, User as StaffUser, LeadPipelineStage, CustomField, Tag, LeadSource, Quote } from "@shared/schema";
import LeadNotesSection from "@/components/forms/lead-notes-section";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import LeadAppointmentsDisplay from "@/components/forms/lead-appointments-display";
import { CallButton } from "@/components/voip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions, useHasPermission } from "@/hooks/use-has-permission";
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

  const { isAdminOrManager } = useRolePermissions();
  const { hasPermission: canDeleteLeads } = useHasPermission('leads.canDelete');

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

  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  const convertToClientMutation = useMutation({
    mutationFn: async (params?: { force?: boolean }) => {
      if (!lead) throw new Error("Lead data not available");
      const response = await apiRequest("POST", `/api/leads/${lead.id}/convert`, { force: params?.force || false });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        console.error("Failed to parse conversion response:", text.substring(0, 200));
        throw new Error("Server returned an unexpected response. Please try again.");
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });

      if (data.alreadyConverted) {
        toast({
          title: "Already converted",
          description: "This lead has already been converted to a client.",
        });
        if (data.clientId) {
          setLocation(`/clients/${data.clientId}`);
        }
      } else {
        toast({
          title: "Lead converted to client",
          description: "Lead converted successfully!",
        });
        setLocation(`/clients/${data.clientId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Conversion failed",
        description: error.message || "Failed to convert lead to client. Please contact an admin.",
        variant: "destructive",
      });
    },
  });

  const handleConvertClick = () => {
    const hasAcceptedQuote = leadQuotes.some(q => ['accepted', 'signed', 'completed'].includes(q.status));
    if (!hasAcceptedQuote && leadQuotes.length > 0) {
      setShowConvertConfirm(true);
    } else {
      convertToClientMutation.mutate();
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/leads/${leadId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Lead deleted",
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
    
    if (fieldName === 'projectedDaysToClose') {
      if (!valueToSave || valueToSave === '') {
        updateLeadFieldMutation.mutate({ fieldName: 'projectedCloseDate', value: null });
        return;
      }
      const days = parseInt(valueToSave as string);
      if (isNaN(days) || days < 0) {
        toast({ title: "Invalid input", description: "Please enter a valid number of business days.", variant: "destructive" });
        return;
      }
      const closeDate = days === 0 ? new Date() : addBusinessDays(new Date(), days);
      updateLeadFieldMutation.mutate({ fieldName: 'projectedCloseDate', value: closeDate });
      return;
    }

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

  const addBusinessDays = (startDate: Date, days: number): Date => {
    const result = new Date(startDate);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dow = result.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return result;
  };

  const getBusinessDaysRemaining = (targetDate: Date | string | null): number | null => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    if (target <= today) return 0;
    let count = 0;
    const cursor = new Date(today);
    while (cursor < target) {
      cursor.setDate(cursor.getDate() + 1);
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) count++;
    }
    return count;
  };

  const handleStartEditLeadField = (fieldName: string, currentValue: any) => {
    setEditingLeadField(fieldName);
    if (fieldName === 'projectedDaysToClose') {
      const remaining = getBusinessDaysRemaining(lead?.projectedCloseDate);
      setLeadFieldEditValue(remaining !== null ? String(remaining) : '');
      return;
    }
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
          {lead?.isConverted && lead?.clientId ? (
            <>
              <Link href={`/clients/${lead.clientId}`}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-view-client"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  View Client →
                </Button>
              </Link>
              {isAdminOrManager && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => convertToClientMutation.mutate({ force: true })}
                  disabled={convertToClientMutation.isPending}
                  data-testid="button-force-reconvert"
                >
                  {convertToClientMutation.isPending ? "Re-converting..." : "Re-convert"}
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleConvertClick}
              disabled={convertToClientMutation.isPending}
              data-testid="button-convert-to-client"
            >
              <ArrowRight className="h-4 w-4" />
              {convertToClientMutation.isPending ? "Converting..." : "Convert to Client"}
            </Button>
          )}
          {(isAdminOrManager || canDeleteLeads) && (
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
            
            {/* Phone with Call Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {renderEditableField('phone', 'Phone', lead.phone, Phone)}
              </div>
              {lead.phone && (
                <CallButton phoneNumber={lead.phone} leadId={lead.id} leadName={lead.name} />
              )}
            </div>
            
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
            
            {/* Status - Inline editable dropdown */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Status</div>
                {editingLeadField === 'status' ? (
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
                ) : (
                  <div
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors w-fit"
                    onClick={() => isAdminOrManager && handleStartEditLeadField('status', lead.status || 'Open')}
                    data-testid="text-lead-status"
                  >
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
                )}
              </div>
            </div>
            
            {/* Potential Value */}
            {renderEditableField('value', 'Potential Value', lead.value, DollarSign, 'number')}
            
            {/* Probability */}
            {renderEditableField('probability', 'Probability (%)', lead.probability, Percent, 'number')}

            {/* Projected Days to Close */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Projected Days to Close</div>
                {editingLeadField === 'projectedDaysToClose' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Business days"
                      value={leadFieldEditValue ?? ''}
                      onChange={(e) => setLeadFieldEditValue(e.target.value)}
                      className="flex-1"
                      data-testid="input-lead-projectedDaysToClose"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveLeadField('projectedDaysToClose', 'number')}
                      disabled={updateLeadFieldMutation.isPending}
                      data-testid="button-save-lead-projectedDaysToClose"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelLeadFieldEdit}
                      data-testid="button-cancel-lead-projectedDaysToClose"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors w-fit"
                    onClick={() => handleStartEditLeadField('projectedDaysToClose', null)}
                    data-testid="text-lead-projectedDaysToClose"
                  >
                    {(() => {
                      const remaining = getBusinessDaysRemaining(lead.projectedCloseDate);
                      if (remaining === null) return <span className="text-gray-400">Click to set...</span>;
                      if (remaining === 0) return (
                        <Badge variant="destructive">Due today</Badge>
                      );
                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{remaining} business day{remaining !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-muted-foreground">
                            (by {format(new Date(lead.projectedCloseDate!), "MMM d, yyyy")})
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <Link href={`/tasks?openModal=true&leadId=${leadId}`}>
                <Button size="sm" data-testid="button-add-lead-task">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
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
      <AlertDialog open={showConvertConfirm} onOpenChange={setShowConvertConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Client</AlertDialogTitle>
            <AlertDialogDescription>
              This lead's quote has not been marked as accepted. Are you sure you want to convert manually?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConvertConfirm(false);
                convertToClientMutation.mutate();
              }}
            >
              Convert Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
