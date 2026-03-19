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
import * as LucideIcons from "lucide-react";
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
  const [customName, setCustomName] = useState(trigger.customName || "");

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

  // Fetch all surveys for survey_id dropdowns
  const { data: surveys = [] } = useQuery<any[]>({
    queryKey: ["/api/surveys"],
  });

  // Fetch survey fields for selected survey
  const selectedSurveyId = conditions.survey_id;
  const { data: surveyFields = [] } = useQuery<any[]>({
    queryKey: ["/api/surveys", selectedSurveyId, "fields"],
    queryFn: async () => {
      if (!selectedSurveyId) return [];
      const response = await fetch(`/api/surveys/${selectedSurveyId}/fields`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedSurveyId
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

  // Projects have been removed from the system
  const projects: never[] = [];

  // Fetch staff for staff selection filters
  const { data: staff = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch dynamic task statuses for task triggers
  const { data: taskStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/task-statuses"],
  });

  // Fetch dynamic task priorities for task triggers
  const { data: taskPriorities = [] } = useQuery<any[]>({
    queryKey: ["/api/task-priorities"],
  });

  // Fetch team workflows for task triggers (contains workflow-specific statuses)
  const { data: teamWorkflows = [] } = useQuery<any[]>({
    queryKey: ["/api/team-workflows"],
  });

  // Fetch tasks for task selection filters
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch leads for lead selection filters
  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  // Fetch lead pipeline stages for lead triggers
  const { data: leadPipelineStages = [] } = useQuery<any[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  // Fetch calendars for calendar selection filters
  const { data: calendars = [] } = useQuery<any[]>({
    queryKey: ["/api/calendars"],
  });

  // Fetch training courses for course selection filters
  const { data: trainingCourses = [] } = useQuery<any[]>({
    queryKey: ["/api/training/courses"],
  });

  // Fetch training categories for category selection filters  
  const { data: trainingCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/training/categories"],
  });

  // Fetch training lessons for lesson selection filters - only if course is selected
  const selectedCourseId = conditions.courseId;
  const { data: trainingLessons = [] } = useQuery<any[]>({
    queryKey: ["/api/training/courses", selectedCourseId, "lessons"],
    queryFn: async () => {
      if (!selectedCourseId || selectedCourseId === "any") return [];
      const response = await fetch(`/api/training/courses/${selectedCourseId}/lessons`);
      if (!response.ok) throw new Error('Failed to fetch lessons');
      return response.json();
    },
    enabled: !!selectedCourseId && selectedCourseId !== "any",
  });

  // Fetch knowledge base categories for category selection filters
  const { data: knowledgeBaseCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/knowledge-base/categories"],
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
    setCustomName(trigger.customName || "");
  }, [trigger]);

  // Initialize filters and additionalFilters arrays if they don't exist
  useEffect(() => {
    if (conditions && !conditions.filters) {
      setConditions((prev: any) => ({ ...prev, filters: [] }));
    }
    if (conditions && !conditions.additionalFilters) {
      setConditions((prev: any) => ({ ...prev, additionalFilters: [] }));
    }
  }, [conditions]);

  // Add a new filter - generic for both filters and additionalFilters
  const addFilter = (fieldName: string = "filters") => {
    const newFilter = {
      field_id: "",
      operator: "equals",
      value: ""
    };
    setConditions((prev: any) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), newFilter]
    }));
  };

  // Remove a filter - generic for both filters and additionalFilters
  const removeFilter = (index: number, fieldName: string = "filters") => {
    setConditions((prev: any) => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  // Update a specific filter - generic for both filters and additionalFilters
  const updateFilter = (index: number, field: string, value: any, fieldName: string = "filters") => {
    setConditions((prev: any) => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).map((filter: any, i: number) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const handleSave = () => {
    onSave({
      ...trigger,
      conditions,
      customName: customName.trim() || undefined
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
    } else if (triggerDefinition?.configSchema?.survey_id) {
      // If this trigger has survey_id in schema, use survey fields
      surveyFields.forEach((surveyField: any) => {
        if (surveyField.label && surveyField.type !== 'image' && surveyField.type !== 'html') {
          if (surveyField.customFieldId) {
            // Custom field reference - find the matching custom field
            const matchingCustomField = customFields.find((cf: any) => cf.id === surveyField.customFieldId);
            if (matchingCustomField) {
              fields.push({
                id: surveyField.customFieldId,
                name: surveyField.label,
                type: matchingCustomField.type,
                options: matchingCustomField.options || []
              });
            }
          } else {
            // Standard survey field
            fields.push({
              id: surveyField.id,
              name: surveyField.label,
              type: surveyField.type,
              options: surveyField.options || []
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
        id: 'task',
        name: 'Task',
        type: 'task_select',
        options: []
      });
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
        options: taskPriorities.map((priority: any) => priority.value)
      });
      fields.push({
        id: 'status',
        name: 'Task Status',
        type: 'dropdown',
        options: taskStatuses.map((status: any) => status.value)
      });
      fields.push({
        id: 'workflow',
        name: 'Task Workflow',
        type: 'dropdown',
        options: teamWorkflows.map((workflow: any) => workflow.name)
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
    } else if (triggerDefinition?.type === 'appointment_booked' || triggerDefinition?.type === 'appointment_status_changed') {
      // For calendar triggers, add calendar-specific core fields FIRST
      fields.push({
        id: 'calendar',
        name: 'Calendar',
        type: 'calendar_select',
        options: []
      });
      fields.push({
        id: 'assignee',
        name: 'Assigned Staff Member',
        type: 'staff_select',
        options: []
      });
      fields.push({
        id: 'client',
        name: 'Client',
        type: 'client_select',
        options: []
      });
      fields.push({
        id: 'title',
        name: 'Appointment Title',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'duration',
        name: 'Duration (minutes)',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'booking_source',
        name: 'Booking Source',
        type: 'dropdown',
        options: ['external_calendar_link', 'manually', 'api', 'sync_google', 'sync_microsoft']
      });
      fields.push({
        id: 'tag',
        name: 'Has Tag',
        type: 'tag_select',
        options: []
      });
      fields.push({
        id: 'status',
        name: 'Appointment Status',
        type: 'dropdown',
        options: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']
      });
      // Also include custom fields for appointments
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type === 'quote_created' || 
               triggerDefinition?.type === 'quote_sent' || 
               triggerDefinition?.type === 'quote_viewed' ||
               triggerDefinition?.type === 'quote_accepted' ||
               triggerDefinition?.type === 'quote_signed') {
      // For quote-related triggers, add quote-specific core fields FIRST
      fields.push({
        id: 'name',
        name: 'Quote Name',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'status',
        name: 'Quote Status',
        type: 'dropdown',
        options: ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected']
      });
      fields.push({
        id: 'totalCost',
        name: 'Total Cost',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'clientBudget',
        name: 'Client Budget',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'desiredMargin',
        name: 'Desired Margin (%)',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'tag',
        name: 'Has Tag',
        type: 'tag_select',
        options: []
      });
      fields.push({
        id: 'createdBy',
        name: 'Created By',
        type: 'staff_select',
        options: []
      });
      // Also include custom fields for quotes
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type === 'client_updated' || 
               triggerDefinition?.type === 'client_status_toggle' || 
               triggerDefinition?.type === 'client_health_score_changed' ||
               triggerDefinition?.type === 'client_product_added' ||
               triggerDefinition?.type === 'client_approval_event' ||
               triggerDefinition?.type === 'client_team_changed' ||
               triggerDefinition?.type === 'client_brief_updated' ||
               triggerDefinition?.type === 'note_added') {
      // For client-related triggers, add client-specific core fields FIRST
      fields.push({
        id: 'name',
        name: 'Client Name',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'email',
        name: 'Email',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'phone',
        name: 'Phone',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'company',
        name: 'Company',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'status',
        name: 'Client Status',
        type: 'dropdown',
        options: ['active', 'inactive', 'pending', 'archived']
      });
      fields.push({
        id: 'tag',
        name: 'Has Tag',
        type: 'tag_select',
        options: []
      });
      fields.push({
        id: 'assignee',
        name: 'Account Manager',
        type: 'staff_select',
        options: []
      });
      fields.push({
        id: 'city',
        name: 'City',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'state',
        name: 'State',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'country',
        name: 'Country',
        type: 'string',
        options: []
      });
      // Also include custom fields for clients
      customFields.forEach((customField: any) => {
        fields.push({
          id: customField.id,
          name: customField.name,
          type: customField.type,
          options: customField.options || []
        });
      });
    } else if (triggerDefinition?.type === 'task_dependency_completed') {
      // For task dependency completed triggers, add task-specific core fields FIRST
      fields.push({
        id: 'taskTitle',
        name: 'Completed Task Title',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'taskPriority',
        name: 'Task Priority',
        type: 'dropdown',
        options: ['low', 'medium', 'high', 'urgent']
      });
      fields.push({
        id: 'taskStatus',
        name: 'Task Status',
        type: 'dropdown',
        options: ['completed', 'cancelled']
      });
      fields.push({
        id: 'unblockedTaskCount',
        name: 'Number of Unblocked Tasks',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'assignee',
        name: 'Assigned To',
        type: 'staff_select',
        options: []
      });
      fields.push({
        id: 'tag',
        name: 'Has Tag',
        type: 'tag_select',
        options: []
      });
    } else if (triggerDefinition?.type === 'email_received') {
      // For email received triggers, add email-specific core fields FIRST
      fields.push({
        id: 'sender',
        name: 'Sender Email',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'subject',
        name: 'Subject',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'body',
        name: 'Body Content',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'hasAttachments',
        name: 'Has Attachments',
        type: 'dropdown',
        options: ['yes', 'no']
      });
      fields.push({
        id: 'recipientAddress',
        name: 'Recipient Address',
        type: 'string',
        options: []
      });
    } else if (triggerDefinition?.type === 'client_portal_activity') {
      // For client portal activity triggers, add portal-specific core fields FIRST
      fields.push({
        id: 'activityType',
        name: 'Activity Type',
        type: 'dropdown',
        options: ['login', 'download', 'upload', 'view', 'comment']
      });
      fields.push({
        id: 'clientName',
        name: 'Client Name',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'clientEmail',
        name: 'Client Email',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'fileName',
        name: 'File Name',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'fileType',
        name: 'File Type',
        type: 'dropdown',
        options: ['document', 'image', 'video', 'audio', 'other']
      });
    } else if (triggerDefinition?.type === 'file_uploaded') {
      // For file uploaded triggers, add file-specific core fields FIRST
      fields.push({
        id: 'fileName',
        name: 'File Name',
        type: 'string',
        options: []
      });
      fields.push({
        id: 'fileType',
        name: 'File Type',
        type: 'dropdown',
        options: ['document', 'image', 'video', 'audio', 'spreadsheet', 'other']
      });
      fields.push({
        id: 'fileSize',
        name: 'File Size (bytes)',
        type: 'number',
        options: []
      });
      fields.push({
        id: 'uploadedBy',
        name: 'Uploaded By',
        type: 'staff_select',
        options: []
      });
      fields.push({
        id: 'location',
        name: 'Upload Location',
        type: 'dropdown',
        options: ['client_documents', 'project_files', 'campaign_assets', 'general']
      });
      fields.push({
        id: 'tag',
        name: 'Has Tag',
        type: 'tag_select',
        options: []
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
  const renderFilterRow = (filter: any, index: number, fieldName: string = "filters") => {
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
            onClick={() => removeFilter(index, fieldName)}
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
              onValueChange={(value) => updateFilter(index, "field_id", value, fieldName)}
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
              onValueChange={(value) => updateFilter(index, "operator", value, fieldName)}
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
                onValueChange={(value) => updateFilter(index, "value", value, fieldName)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 ? (
                    clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.company || client.name}</span>
                          {client.company && client.name && (
                            <span className="text-xs text-muted-foreground">Contact: {client.name}</span>
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
                onValueChange={(value) => updateFilter(index, "value", value, fieldName)}
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
                            <span className="text-xs text-muted-foreground">Client: {project.client.company || project.client.name}</span>
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
                onValueChange={(value) => updateFilter(index, "value", value, fieldName)}
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
            ) : selectedField?.type === "task_select" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {filter.value ? 
                      (() => {
                        const selectedTask = tasks.find((task: any) => task.id === filter.value);
                        return selectedTask ? selectedTask.title : "Task not found";
                      })()
                      : "Search and select task..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search tasks..." />
                    <CommandEmpty>No tasks found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {tasks.map((task: any) => (
                        <CommandItem
                          key={task.id}
                          value={`${task.title} ${task.project?.name || ''}`}
                          onSelect={() => {
                            updateFilter(index, "value", task.id, fieldName);
                          }}
                        >
                          <div className="flex flex-col w-full">
                            <span className="font-medium">{task.title}</span>
                            {task.project && (
                              <span className="text-xs text-muted-foreground">Project: {task.project.name}</span>
                            )}
                          </div>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              filter.value === task.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : selectedField?.type === "dropdown" && selectedField?.options?.length > 0 ? (
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(index, "value", value, fieldName)}
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
                onChange={(e) => updateFilter(index, "value", e.target.value, fieldName)}
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

    // Special handling for filters and additionalFilters array - show dynamic filter builder
    if ((fieldName === "filters" || fieldName === "additionalFilters") && (fieldSchema.type === "array" || fieldSchema.type === "filters")) {
      const filters = conditions[fieldName] || [];
      const needsFormSelection = triggerDefinition?.configSchema?.form_id && !conditions.form_id;
      const needsSurveySelection = triggerDefinition?.configSchema?.survey_id && !conditions.survey_id;
      const isDisabled = needsFormSelection || needsSurveySelection;
      
      return (
        <div key={fieldName} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">{label}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addFilter(fieldName)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              disabled={isDisabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>
          
          {needsFormSelection && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please select a form first to add custom field filters.
              </p>
            </div>
          )}
          
          {needsSurveySelection && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please select a survey first to add custom field filters.
              </p>
            </div>
          )}

          {filters.length > 0 && (
            <div className="space-y-3">
              {filters.map((filter: any, index: number) => renderFilterRow(filter, index, fieldName))}
            </div>
          )}

          {filters.length === 0 && !isDisabled && (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                {triggerDefinition?.configSchema?.form_id 
                  ? "No filters added. This trigger will fire for any submission of the selected form."
                  : triggerDefinition?.configSchema?.survey_id
                  ? "No filters added. This trigger will fire for any submission of the selected survey."
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
                  {fieldName === "change_type" ? (
                    option === "has_changed" ? "Has Changed" : 
                    option === "has_changed_to" ? "Has Changed To" : 
                    option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                  ) : (
                    option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "select") {
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
                  {fieldName === "change_type" ? (
                    option === "has_changed" ? "Has Changed" : 
                    option === "has_changed_to" ? "Has Changed To" : 
                    option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                  ) : (
                    option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                  )}
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

    // Special handling for survey_id fields - show survey dropdown
    if (fieldName === "survey_id" && fieldSchema.type === "string") {
      const publishedSurveys = surveys.filter((survey: any) => survey.status === "published");
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>Choose a Survey</Label>
          <Select 
            value={value} 
            onValueChange={(newValue) => setConditions((prev: any) => ({ ...prev, [fieldName]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a survey" />
            </SelectTrigger>
            <SelectContent>
              {publishedSurveys.length > 0 ? (
                publishedSurveys.map((survey: any) => (
                  <SelectItem key={survey.id} value={survey.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{survey.name}</span>
                      {survey.description && (
                        <span className="text-xs text-muted-foreground">{survey.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No published surveys available
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
              {staff.length > 0 ? (
                staff.map((staffMember: any) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{staffMember.firstName} {staffMember.lastName}</span>
                      {staffMember.email && (
                        <span className="text-xs text-muted-foreground">{staffMember.email}</span>
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
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "calendar_select") {
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
              {calendars.length > 0 ? (
                calendars.map((calendar: any) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No calendars available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "course_select") {
      const publishedCourses = trainingCourses.filter((course: any) => course.isPublished);
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Select 
            value={value} 
            onValueChange={(newValue) => setConditions((prev: any) => ({ ...prev, [fieldName]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={fieldSchema.placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldSchema.placeholder && (
                <SelectItem value="any">
                  <span className="text-muted-foreground">Any Course</span>
                </SelectItem>
              )}
              {publishedCourses.length > 0 ? (
                publishedCourses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.title}</span>
                      {course.shortDescription && (
                        <span className="text-xs text-muted-foreground">{course.shortDescription}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No published courses available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "category_select") {
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
              <SelectItem value="any">
                <span className="text-muted-foreground">Any Category</span>
              </SelectItem>
              {trainingCategories.length > 0 ? (
                trainingCategories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No categories available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "lesson_select") {
      const selectedCourseId = conditions.courseId;
      const hasCourseSelected = selectedCourseId && selectedCourseId !== "any";
      
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Select 
            value={value} 
            onValueChange={(newValue) => setConditions((prev: any) => ({ ...prev, [fieldName]: newValue }))}
            disabled={!hasCourseSelected}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !hasCourseSelected 
                  ? "Select a course first" 
                  : fieldSchema.placeholder || `Select ${label.toLowerCase()}`
              } />
            </SelectTrigger>
            <SelectContent>
              {fieldSchema.placeholder && hasCourseSelected && (
                <SelectItem value="any">
                  <span className="text-muted-foreground">Any Lesson</span>
                </SelectItem>
              )}
              {!hasCourseSelected ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Please select a course first
                </div>
              ) : trainingLessons.length > 0 ? (
                trainingLessons.map((lesson: any) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{lesson.title}</span>
                      {lesson.description && (
                        <span className="text-xs text-muted-foreground">{lesson.description}</span>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Lesson {lesson.order || 1}</span>
                        <span>•</span>
                        <span className="capitalize">{lesson.contentType}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No lessons available for this course
                </div>
              )}
            </SelectContent>
          </Select>
          {!hasCourseSelected && (
            <p className="text-xs text-amber-600">Select a course above to see available lessons</p>
          )}
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "kb_category_select") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Select 
            value={value} 
            onValueChange={(newValue) => setConditions((prev: any) => ({ ...prev, [fieldName]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={fieldSchema.placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldSchema.placeholder && (
                <SelectItem value="any">
                  <span className="text-muted-foreground">Any Category</span>
                </SelectItem>
              )}
              {knowledgeBaseCategories.length > 0 ? (
                knowledgeBaseCategories.map((category: any) => {
                  const IconComponent = category.icon ? (LucideIcons as any)[category.icon] : null;
                  return (
                    <SelectItem key={category.id} value={category.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 w-full">
                        {IconComponent && (
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{category.name}</span>
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No categories available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "tag_select") {
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
              {tags.length > 0 ? (
                tags.map((tag: any) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No tags available
                </div>
              )}
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

    if (fieldSchema.type === "lead_stage_select") {
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
              {leadPipelineStages.length > 0 ? (
                leadPipelineStages.map((stage: any) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No pipeline stages available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "client_select") {
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
              {clients.length > 0 ? (
                clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.company || client.name}</span>
                      {client.company && client.name && (
                        <span className="text-xs text-muted-foreground">Contact: {client.name}</span>
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
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "lead_select") {
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
              {leads.length > 0 ? (
                leads.map((lead: any) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.name}</span>
                      {lead.company && (
                        <span className="text-xs text-muted-foreground">{lead.company}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No leads available
                </div>
              )}
            </SelectContent>
          </Select>
          {fieldSchema.required && <p className="text-xs text-muted-foreground">Required</p>}
        </div>
      );
    }

    if (fieldSchema.type === "webhook_url_display") {
      // Generate webhook ID if not exists
      if (!conditions.webhook_id) {
        const webhookId = `wh_${Math.random().toString(36).substr(2, 9)}`;
        setConditions((prev: any) => ({ ...prev, webhook_id: webhookId }));
      }
      
      const webhookUrl = conditions.webhook_id ? 
        `${window.location.origin}/api/webhooks/${conditions.webhook_id}` : 
        "Generating webhook URL...";
      
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
          )}
          <div className="flex items-center space-x-2">
            <Input
              id={fieldName}
              value={webhookUrl}
              readOnly
              className="bg-gray-50 text-gray-700"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                // Could add a toast notification here
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-blue-600">
            💡 Use this URL to send {conditions.webhook_method || 'POST'} requests to trigger this automation
          </p>
        </div>
      );
    }

    if (fieldSchema.type === "hidden") {
      // Hidden fields don't render anything but ensure the value exists
      if (!value && fieldSchema.auto_generate) {
        const generatedValue = fieldName === "webhook_id" ? 
          `wh_${Math.random().toString(36).substr(2, 9)}` :
          `gen_${Math.random().toString(36).substr(2, 9)}`;
        setConditions((prev: any) => ({ ...prev, [fieldName]: generatedValue }));
      }
      return null;
    }

    if (fieldSchema.type === "custom_field_select") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>{label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {value ? 
                  (() => {
                    const selectedField = customFields.find((field: any) => field.id === value);
                    return selectedField ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedField.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedField.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} • {selectedField.entity_type}
                        </span>
                      </div>
                    ) : "Field not found";
                  })()
                  : "Search and select custom field..."
                }
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search custom fields..." />
                <CommandEmpty>No custom fields found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {customFields.map((field: any) => (
                    <CommandItem
                      key={field.id}
                      value={`${field.name} ${field.entity_type} ${field.type}`}
                      onSelect={() => {
                        setConditions((prev: any) => ({ ...prev, [fieldName]: field.id }));
                      }}
                    >
                      <div className="flex flex-col w-full">
                        <span className="font-medium">{field.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {field.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} • {field.entity_type}
                        </span>
                      </div>
                      <Check
                        className={`ml-auto h-4 w-4 ${
                          value === field.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
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

      {/* Custom Name Input */}
      <div className="space-y-2">
        <Label htmlFor="customName" className="text-sm font-medium">
          Custom Name (Optional)
        </Label>
        <Input
          id="customName"
          data-testid="input-trigger-custom-name"
          placeholder={`e.g., "Lead Form Submitted - Landing Page"`}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="bg-white"
        />
        <p className="text-xs text-muted-foreground">
          Give this trigger a custom name to help identify it in your workflow
        </p>
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

            {/* Always show survey selection first for survey triggers */}
            {triggerDefinition.configSchema.survey_id && 
              renderConfigField("survey_id", triggerDefinition.configSchema.survey_id)
            }
            
            {/* Add separator if survey_id exists */}
            {triggerDefinition.configSchema.survey_id && Object.keys(triggerDefinition.configSchema).length > 1 && (
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
                
                {/* Task Overdue trigger */}
                {triggerDefinition.configSchema.days_overdue && 
                  renderConfigField("days_overdue", triggerDefinition.configSchema.days_overdue)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.from_status || 
                  triggerDefinition.configSchema.to_status || 
                  triggerDefinition.configSchema.hours_before ||
                  triggerDefinition.configSchema.days_overdue) && 
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

            {/* For field change triggers, show core fields first */}
            {triggerDefinition.type === 'field_change' && (
              <>
                {/* Custom Field Selection */}
                {triggerDefinition.configSchema.custom_field_id && 
                  renderConfigField("custom_field_id", triggerDefinition.configSchema.custom_field_id)
                }
                
                {/* Change Detection Type */}
                {triggerDefinition.configSchema.change_type && 
                  renderConfigField("change_type", triggerDefinition.configSchema.change_type)
                }
                
                {/* Target Value (conditional - only show when "Has Changed To" is selected) */}
                {triggerDefinition.configSchema.target_value && conditions.change_type === "has_changed_to" && 
                  renderConfigField("target_value", triggerDefinition.configSchema.target_value)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.custom_field_id || 
                  triggerDefinition.configSchema.change_type) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for field change triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For calendar triggers, show core fields first */}
            {(triggerDefinition.type === 'appointment_booked' || triggerDefinition.type === 'appointment_status_changed') && (
              <>
                {/* Calendar Selection */}
                {triggerDefinition.configSchema.calendar_id && 
                  renderConfigField("calendar_id", triggerDefinition.configSchema.calendar_id)
                }
                
                {/* Appointment Status Changed trigger - From/To Status */}
                {triggerDefinition.configSchema.from_status && 
                  renderConfigField("from_status", triggerDefinition.configSchema.from_status)
                }
                {triggerDefinition.configSchema.to_status && 
                  renderConfigField("to_status", triggerDefinition.configSchema.to_status)
                }
                
                {/* Appointment Booked trigger - Staff, Tag, Booking Source */}
                {triggerDefinition.type === 'appointment_booked' && (
                  <>
                    {/* Staff Assignment */}
                    {triggerDefinition.configSchema.assigned_to && 
                      renderConfigField("assigned_to", triggerDefinition.configSchema.assigned_to)
                    }
                    
                    {/* Tag Selection */}
                    {triggerDefinition.configSchema.has_tag && 
                      renderConfigField("has_tag", triggerDefinition.configSchema.has_tag)
                    }
                    
                    {/* Booking Source */}
                    {triggerDefinition.configSchema.booking_source && 
                      renderConfigField("booking_source", triggerDefinition.configSchema.booking_source)
                    }
                  </>
                )}
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.calendar_id || 
                  triggerDefinition.configSchema.from_status || 
                  triggerDefinition.configSchema.to_status ||
                  triggerDefinition.configSchema.assigned_to || 
                  triggerDefinition.configSchema.has_tag || 
                  triggerDefinition.configSchema.booking_source) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for calendar triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For note added triggers, show core fields first */}
            {triggerDefinition.type === 'note_added' && (
              <>
                {/* Entity Type Selection */}
                {triggerDefinition.configSchema.entity_type && 
                  renderConfigField("entity_type", triggerDefinition.configSchema.entity_type)
                }
                
                {/* Client Selection (conditional - only show when entity_type is "client") */}
                {triggerDefinition.configSchema.client_id && conditions.entity_type === "client" && 
                  renderConfigField("client_id", triggerDefinition.configSchema.client_id)
                }
                
                {/* Lead Selection (conditional - only show when entity_type is "lead") */}
                {triggerDefinition.configSchema.lead_id && conditions.entity_type === "lead" && 
                  renderConfigField("lead_id", triggerDefinition.configSchema.lead_id)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {triggerDefinition.configSchema.entity_type && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for note added triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client updated triggers, show core fields first */}
            {triggerDefinition.type === 'client_updated' && (
              <>
                {/* Changed Fields */}
                {triggerDefinition.configSchema.changedFields && 
                  renderConfigField("changedFields", triggerDefinition.configSchema.changedFields)
                }
                
                {/* Updated By */}
                {triggerDefinition.configSchema.updatedBy && 
                  renderConfigField("updatedBy", triggerDefinition.configSchema.updatedBy)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.changedFields || 
                  triggerDefinition.configSchema.updatedBy) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client updated triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client status toggle triggers, show core fields first */}
            {triggerDefinition.type === 'client_status_toggle' && (
              <>
                {/* Action (required) */}
                {triggerDefinition.configSchema.action && 
                  renderConfigField("action", triggerDefinition.configSchema.action)
                }
                
                {/* Reason */}
                {triggerDefinition.configSchema.reason && 
                  renderConfigField("reason", triggerDefinition.configSchema.reason)
                }
                
                {/* Minimum Tenure */}
                {triggerDefinition.configSchema.minTenure && 
                  renderConfigField("minTenure", triggerDefinition.configSchema.minTenure)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.action || 
                  triggerDefinition.configSchema.reason || 
                  triggerDefinition.configSchema.minTenure) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client status toggle triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client health score changed triggers, show core fields first */}
            {triggerDefinition.type === 'client_health_score_changed' && (
              <>
                {/* From Color */}
                {triggerDefinition.configSchema.fromColor && 
                  renderConfigField("fromColor", triggerDefinition.configSchema.fromColor)
                }
                
                {/* To Color */}
                {triggerDefinition.configSchema.toColor && 
                  renderConfigField("toColor", triggerDefinition.configSchema.toColor)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.fromColor || 
                  triggerDefinition.configSchema.toColor) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client health score triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client product added triggers, show core fields first */}
            {triggerDefinition.type === 'client_product_added' && (
              <>
                {/* Product Type */}
                {triggerDefinition.configSchema.productType && 
                  renderConfigField("productType", triggerDefinition.configSchema.productType)
                }
                
                {/* Product ID */}
                {triggerDefinition.configSchema.productId && 
                  renderConfigField("productId", triggerDefinition.configSchema.productId)
                }
                
                {/* Bundle ID */}
                {triggerDefinition.configSchema.bundleId && 
                  renderConfigField("bundleId", triggerDefinition.configSchema.bundleId)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.productType || 
                  triggerDefinition.configSchema.productId || 
                  triggerDefinition.configSchema.bundleId) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client product added triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client approval event triggers, show core fields first */}
            {triggerDefinition.type === 'client_approval_event' && (
              <>
                {/* Event Type */}
                {triggerDefinition.configSchema.eventType && 
                  renderConfigField("eventType", triggerDefinition.configSchema.eventType)
                }
                
                {/* Approval Status */}
                {triggerDefinition.configSchema.approvalStatus && 
                  renderConfigField("approvalStatus", triggerDefinition.configSchema.approvalStatus)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.eventType || 
                  triggerDefinition.configSchema.approvalStatus) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client approval event triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client team changed triggers, show core fields first */}
            {triggerDefinition.type === 'client_team_changed' && (
              <>
                {/* Change Type */}
                {triggerDefinition.configSchema.changeType && 
                  renderConfigField("changeType", triggerDefinition.configSchema.changeType)
                }
                
                {/* Staff Member */}
                {triggerDefinition.configSchema.staffMember && 
                  renderConfigField("staffMember", triggerDefinition.configSchema.staffMember)
                }
                
                {/* Role */}
                {triggerDefinition.configSchema.role && 
                  renderConfigField("role", triggerDefinition.configSchema.role)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.changeType || 
                  triggerDefinition.configSchema.staffMember || 
                  triggerDefinition.configSchema.role) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client team changed triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For client brief updated triggers, show core fields first */}
            {triggerDefinition.type === 'client_brief_updated' && (
              <>
                {/* Section */}
                {triggerDefinition.configSchema.section && 
                  renderConfigField("section", triggerDefinition.configSchema.section)
                }
                
                {/* Updated By */}
                {triggerDefinition.configSchema.updatedBy && 
                  renderConfigField("updatedBy", triggerDefinition.configSchema.updatedBy)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.section || 
                  triggerDefinition.configSchema.updatedBy) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for client brief updated triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For quote created triggers, show core fields first */}
            {triggerDefinition.type === 'quote_created' && (
              <>
                {/* Client */}
                {triggerDefinition.configSchema.clientId && 
                  renderConfigField("clientId", triggerDefinition.configSchema.clientId)
                }
                
                {/* Lead */}
                {triggerDefinition.configSchema.leadId && 
                  renderConfigField("leadId", triggerDefinition.configSchema.leadId)
                }
                
                {/* Created By */}
                {triggerDefinition.configSchema.createdBy && 
                  renderConfigField("createdBy", triggerDefinition.configSchema.createdBy)
                }
                
                {/* Minimum Quote Total */}
                {triggerDefinition.configSchema.minTotal && 
                  renderConfigField("minTotal", triggerDefinition.configSchema.minTotal)
                }
                
                {/* Maximum Quote Total */}
                {triggerDefinition.configSchema.maxTotal && 
                  renderConfigField("maxTotal", triggerDefinition.configSchema.maxTotal)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.clientId || 
                  triggerDefinition.configSchema.leadId || 
                  triggerDefinition.configSchema.createdBy || 
                  triggerDefinition.configSchema.minTotal || 
                  triggerDefinition.configSchema.maxTotal) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for quote created triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For quote sent triggers, show core fields first */}
            {triggerDefinition.type === 'quote_sent' && (
              <>
                {/* Client */}
                {triggerDefinition.configSchema.clientId && 
                  renderConfigField("clientId", triggerDefinition.configSchema.clientId)
                }
                
                {/* Lead */}
                {triggerDefinition.configSchema.leadId && 
                  renderConfigField("leadId", triggerDefinition.configSchema.leadId)
                }
                
                {/* Sent By */}
                {triggerDefinition.configSchema.sentBy && 
                  renderConfigField("sentBy", triggerDefinition.configSchema.sentBy)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.clientId || 
                  triggerDefinition.configSchema.leadId || 
                  triggerDefinition.configSchema.sentBy) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for quote sent triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For quote viewed triggers, show core fields first */}
            {triggerDefinition.type === 'quote_viewed' && (
              <>
                {/* Client */}
                {triggerDefinition.configSchema.clientId && 
                  renderConfigField("clientId", triggerDefinition.configSchema.clientId)
                }
                
                {/* Lead */}
                {triggerDefinition.configSchema.leadId && 
                  renderConfigField("leadId", triggerDefinition.configSchema.leadId)
                }
                
                {/* Minimum View Count */}
                {triggerDefinition.configSchema.minViewCount && 
                  renderConfigField("minViewCount", triggerDefinition.configSchema.minViewCount)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.clientId || 
                  triggerDefinition.configSchema.leadId || 
                  triggerDefinition.configSchema.minViewCount) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for quote viewed triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For quote accepted triggers, show core fields first */}
            {triggerDefinition.type === 'quote_accepted' && (
              <>
                {/* Client */}
                {triggerDefinition.configSchema.clientId && 
                  renderConfigField("clientId", triggerDefinition.configSchema.clientId)
                }
                
                {/* Lead */}
                {triggerDefinition.configSchema.leadId && 
                  renderConfigField("leadId", triggerDefinition.configSchema.leadId)
                }
                
                {/* Minimum Quote Total */}
                {triggerDefinition.configSchema.minTotal && 
                  renderConfigField("minTotal", triggerDefinition.configSchema.minTotal)
                }
                
                {/* Maximum Quote Total */}
                {triggerDefinition.configSchema.maxTotal && 
                  renderConfigField("maxTotal", triggerDefinition.configSchema.maxTotal)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.clientId || 
                  triggerDefinition.configSchema.leadId || 
                  triggerDefinition.configSchema.minTotal || 
                  triggerDefinition.configSchema.maxTotal) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for quote accepted triggers */}
                {triggerDefinition.configSchema.filters && 
                  renderConfigField("filters", triggerDefinition.configSchema.filters)
                }
              </>
            )}

            {/* For quote signed triggers, show core fields first */}
            {triggerDefinition.type === 'quote_signed' && (
              <>
                {triggerDefinition.configSchema.clientId && 
                  renderConfigField("clientId", triggerDefinition.configSchema.clientId)
                }
                {triggerDefinition.configSchema.leadId && 
                  renderConfigField("leadId", triggerDefinition.configSchema.leadId)
                }
              </>
            )}

            {/* For client onboarding triggers, show core fields */}
            {(triggerDefinition.type === 'client_onboarding_started' ||
              triggerDefinition.type === 'client_onboarding_saved' ||
              triggerDefinition.type === 'client_onboarding_completed') && (
              <>
                {triggerDefinition.configSchema.clientId && 
                  renderConfigField("clientId", triggerDefinition.configSchema.clientId)
                }
                {triggerDefinition.type === 'client_onboarding_saved' && triggerDefinition.configSchema.currentStep &&
                  renderConfigField("currentStep", triggerDefinition.configSchema.currentStep)
                }
              </>
            )}

            {/* For task dependency completed triggers, show Additional Filters */}
            {triggerDefinition.type === 'task_dependency_completed' && (
              <>
                {/* Additional Filters Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Separator className="flex-1" />
                    <span className="font-medium">Additional Filters</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  {triggerDefinition.configSchema.filters && 
                    renderConfigField("filters", triggerDefinition.configSchema.filters)
                  }
                </div>
              </>
            )}

            {/* For email received triggers, show Additional Filters */}
            {triggerDefinition.type === 'email_received' && (
              <>
                {/* Additional Filters Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Separator className="flex-1" />
                    <span className="font-medium">Additional Filters</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  {triggerDefinition.configSchema.filters && 
                    renderConfigField("filters", triggerDefinition.configSchema.filters)
                  }
                </div>
              </>
            )}

            {/* For client portal activity triggers, show Additional Filters */}
            {triggerDefinition.type === 'client_portal_activity' && (
              <>
                {/* Additional Filters Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Separator className="flex-1" />
                    <span className="font-medium">Additional Filters</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  {triggerDefinition.configSchema.filters && 
                    renderConfigField("filters", triggerDefinition.configSchema.filters)
                  }
                </div>
              </>
            )}

            {/* For file uploaded triggers, show Additional Filters */}
            {triggerDefinition.type === 'file_uploaded' && (
              <>
                {/* Additional Filters Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Separator className="flex-1" />
                    <span className="font-medium">Additional Filters</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  {triggerDefinition.configSchema.filters && 
                    renderConfigField("filters", triggerDefinition.configSchema.filters)
                  }
                </div>
              </>
            )}

            {/* For time off status change triggers, show core fields in specific order */}
            {triggerDefinition.type === 'time_off_status_changed' && (
              <>
                {/* To Status (required) */}
                {triggerDefinition.configSchema.to_status && 
                  renderConfigField("to_status", triggerDefinition.configSchema.to_status)
                }
                
                {/* From Status (required) */}
                {triggerDefinition.configSchema.from_status && 
                  renderConfigField("from_status", triggerDefinition.configSchema.from_status)
                }
                
                {/* Department (optional) */}
                {triggerDefinition.configSchema.department && 
                  renderConfigField("department", triggerDefinition.configSchema.department)
                }
                
                {/* Request Type (optional) */}
                {triggerDefinition.configSchema.request_type && 
                  renderConfigField("request_type", triggerDefinition.configSchema.request_type)
                }
              </>
            )}

            {/* For weekly hours below threshold trigger */}
            {triggerDefinition.type === 'weekly_hours_below_threshold' && (
              <>
                {triggerDefinition.configSchema.hours_threshold && 
                  renderConfigField("hours_threshold", triggerDefinition.configSchema.hours_threshold)
                }
                {triggerDefinition.configSchema.check_day && 
                  renderConfigField("check_day", triggerDefinition.configSchema.check_day)
                }
                {triggerDefinition.configSchema.include_calendar_time && 
                  renderConfigField("include_calendar_time", triggerDefinition.configSchema.include_calendar_time)
                }
                {triggerDefinition.configSchema.staff_filter && 
                  renderConfigField("staff_filter", triggerDefinition.configSchema.staff_filter)
                }
                {conditions.staff_filter === 'specific_department' && triggerDefinition.configSchema.department && 
                  renderConfigField("department", triggerDefinition.configSchema.department)
                }
              </>
            )}

            {/* For webhook triggers, show core fields first */}
            {triggerDefinition.type === 'inbound_webhook' && (
              <>
                {/* HTTP Method Selection */}
                {triggerDefinition.configSchema.webhook_method && 
                  renderConfigField("webhook_method", triggerDefinition.configSchema.webhook_method)
                }
                
                {/* Webhook URL Display */}
                {triggerDefinition.configSchema.webhook_url && 
                  renderConfigField("webhook_url", triggerDefinition.configSchema.webhook_url)
                }
                
                {/* Hidden webhook_id field */}
                {triggerDefinition.configSchema.webhook_id && 
                  renderConfigField("webhook_id", triggerDefinition.configSchema.webhook_id)
                }
                
                {/* Add separator if core fields exist and filters exist */}
                {(triggerDefinition.configSchema.webhook_method || 
                  triggerDefinition.configSchema.webhook_url) && 
                 triggerDefinition.configSchema.filters && (
                  <Separator className="my-4" />
                )}
                
                {/* Show filters for webhook triggers */}
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
             triggerDefinition.type !== 'field_change' &&
             triggerDefinition.type !== 'note_added' &&
             triggerDefinition.type !== 'client_updated' &&
             triggerDefinition.type !== 'client_status_toggle' &&
             triggerDefinition.type !== 'client_health_score_changed' &&
             triggerDefinition.type !== 'client_product_added' &&
             triggerDefinition.type !== 'client_approval_event' &&
             triggerDefinition.type !== 'client_team_changed' &&
             triggerDefinition.type !== 'client_brief_updated' &&
             triggerDefinition.type !== 'quote_created' &&
             triggerDefinition.type !== 'quote_sent' &&
             triggerDefinition.type !== 'quote_viewed' &&
             triggerDefinition.type !== 'quote_accepted' &&
             triggerDefinition.type !== 'quote_signed' &&
             triggerDefinition.type !== 'client_onboarding_started' &&
             triggerDefinition.type !== 'client_onboarding_saved' &&
             triggerDefinition.type !== 'client_onboarding_completed' &&
             triggerDefinition.type !== 'task_dependency_completed' &&
             triggerDefinition.type !== 'email_received' &&
             triggerDefinition.type !== 'client_portal_activity' &&
             triggerDefinition.type !== 'file_uploaded' &&
             triggerDefinition.type !== 'time_off_status_changed' &&
             triggerDefinition.type !== 'inbound_webhook' &&
             triggerDefinition.type !== 'appointment_booked' &&
             triggerDefinition.type !== 'appointment_status_changed' &&
             triggerDefinition.type !== 'weekly_hours_below_threshold' &&
              Object.entries(triggerDefinition.configSchema).map(([fieldName, fieldSchema]) => {
                if (fieldName === "form_id") return null; // Already rendered above
                if (fieldName === "survey_id") return null; // Already rendered above
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
                  
                  // For survey_id, show the survey name instead of the ID
                  if (key === "survey_id") {
                    const selectedSurvey = surveys.find((survey: any) => survey.id === value);
                    return (
                      <div key={key} className="text-xs text-muted-foreground">
                        <span className="font-medium">Survey:</span> {selectedSurvey?.name || value}
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