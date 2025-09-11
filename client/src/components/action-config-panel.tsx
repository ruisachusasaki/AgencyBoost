import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X, Settings, Check, Plus, Trash2, Filter, Tag, ChevronsUpDown, Mail, MessageSquare, Users, FileText, Bell } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ActionConfigPanelProps {
  action: {
    id?: string;
    type: string;
    name: string;
    settings: any;
  };
  actionDefinition: {
    id: string;
    name: string;
    type: string;
    description: string;
    configSchema: any;
  } | null;
  workflowTriggers?: Array<{ type: string; name?: string; conditions?: any }>;
  onSave: (updatedAction: any) => void;
  onClose: () => void;
}

export default function ActionConfigPanel({ 
  action, 
  actionDefinition, 
  workflowTriggers = [], 
  onSave, 
  onClose 
}: ActionConfigPanelProps) {
  const [settings, setSettings] = useState(action.settings || {});
  const [customName, setCustomName] = useState(action.customName || "");
  const [staffComboboxOpen, setStaffComboboxOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tagSearchQueries, setTagSearchQueries] = useState<{ [key: number]: string }>({});

  // Check if workflow has form submission triggers
  const hasFormTrigger = workflowTriggers.some(trigger => 
    trigger.type === 'form_submission' || 
    trigger.type === 'form_filled' ||
    trigger.name?.toLowerCase().includes('form')
  );

  // Fetch data for different action types
  const { data: emailTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/email-templates"],
  });

  const { data: smsTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/sms-templates"],
  });

  const { data: staff = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  const { data: clientsData } = useQuery<any>({
    queryKey: ["/api/clients"],
  });
  const clients = clientsData?.clients || [];

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const { data: leadPipelineStages = [] } = useQuery<any[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  const { data: taskStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/task-statuses"],
  });

  const { data: customFields = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-fields"],
  });

  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ["/api/tags"],
  });
  
  // Merge tags for notifications - using useMemo to depend on loaded custom fields
  const mergeTagGroups = useMemo(() => [
    {
      label: "Contact Information",
      tags: [
        { label: "Name", value: "{{name}}" },
        { label: "Email", value: "{{email}}" },
        { label: "Phone", value: "{{phone}}" },
        { label: "Company", value: "{{company}}" },
        { label: "Position", value: "{{position}}" },
        { label: "Website", value: "{{website}}" },
      ]
    },
    {
      label: "Address",
      tags: [
        { label: "Street Address", value: "{{address}}" },
        { label: "Address Line 2", value: "{{address2}}" },
        { label: "City", value: "{{city}}" },
        { label: "State", value: "{{state}}" },
        { label: "Zip Code", value: "{{zipCode}}" },
      ]
    },
    {
      label: "Business Information",
      tags: [
        { label: "Client Vertical", value: "{{clientVertical}}" },
        { label: "Monthly Revenue", value: "{{mrr}}" },
        { label: "Payment Terms", value: "{{paymentTerms}}" },
        { label: "Invoicing Contact", value: "{{invoicingContact}}" },
        { label: "Invoicing Email", value: "{{invoicingEmail}}" },
      ]
    },
    {
      label: "Other",
      tags: [
        { label: "Notes", value: "{{notes}}" },
        { label: "Contact Source", value: "{{contactSource}}" },
      ]
    },
    // Dynamically add custom fields if they exist
    ...(Array.isArray(customFields) && customFields.length > 0 ? [{
      label: "Custom Fields",
      tags: customFields.map((field: any) => ({
        label: field.name,
        value: `{{custom.${field.name.toLowerCase().replace(/\s+/g, '_')}}}`
      }))
    }] : [])
  ], [customFields]);
  
  // Function to insert merge tag into message
  const insertMergeTag = (tag: string) => {
    const currentMessage = settings.message || "";
    const newMessage = currentMessage + tag;
    updateSetting("message", newMessage);
  };
  
  // Function to insert merge tag into notes
  const insertMergeTagIntoNotes = (tag: string) => {
    const currentNotes = settings.notes || "";
    const newNotes = currentNotes + tag;
    updateSetting("notes", newNotes);
  };
  
  // Function to insert merge tag into task title
  const insertMergeTagIntoTitle = (tag: string) => {
    const currentTitle = settings.title || "";
    const newTitle = currentTitle + tag;
    updateSetting("title", newTitle);
  };
  
  // Function to insert merge tag into task description
  const insertMergeTagIntoDescription = (tag: string) => {
    const currentDescription = settings.description || "";
    const newDescription = currentDescription + tag;
    updateSetting("description", newDescription);
  };

  useEffect(() => {
    const initialSettings = action.settings || {};
    
    // Auto-select contact/lead for new email actions when form triggers exist
    if (action.type === 'send_email' && hasFormTrigger && !initialSettings.recipient) {
      initialSettings.recipient = 'contact';
    }
    
    setSettings(initialSettings);
    setCustomName(action.customName || "");
  }, [action, hasFormTrigger]);

  const validateSettings = (): string[] => {
    const errors: string[] = [];
    
    // Email and SMS both require templates
    if ((action.type === 'send_email' || action.type === 'send_sms') && !settings.templateId) {
      errors.push(`${action.type === 'send_email' ? 'Email' : 'SMS'} template is required`);
    }
    
    // Validate email-specific requirements
    if (action.type === 'send_email') {
      if (settings.recipient === 'specific_staff' && !settings.staffId) {
        errors.push('Staff member selection is required');
      }
      if (settings.recipient === 'custom_email' && !settings.customEmail) {
        errors.push('Email address is required');
      }
    }
    
    // Validate SMS-specific requirements
    if (action.type === 'send_sms') {
      if (settings.recipient === 'specific_staff' && !settings.staffId) {
        errors.push('Staff member selection is required');
      }
      if (settings.recipient === 'custom_phone' && !settings.customPhone) {
        errors.push('Phone number is required');
      }
    }
    
    // Validate internal notification requirements
    if (action.type === 'send_internal_notification') {
      if (!settings.title) {
        errors.push('Notification title is required');
      }
      if (!settings.message) {
        errors.push('Notification message is required');
      }
      if (settings.notifyType === 'specific_staff' && !settings.staffId) {
        errors.push('Staff member selection is required');
      }
    }
    
    // Validate create_internal_notification requirements
    if (action.type === 'create_internal_notification') {
      if (!settings.notificationType) {
        errors.push('Notification type is required');
      }
      
      // Email validation
      if (settings.notificationType === 'email') {
        if (!settings.emailTemplateId) {
          errors.push('Email template is required');
        }
        if (!settings.userType) {
          errors.push('Recipient type is required');
        }
        if (settings.userType === 'particular_user' && !settings.userId) {
          errors.push('User selection is required');
        }
        if (settings.userType === 'custom_email' && !settings.customEmail) {
          errors.push('Custom email address is required');
        }
      }
      
      // SMS validation
      if (settings.notificationType === 'sms') {
        if (!settings.smsTemplateId) {
          errors.push('SMS template is required');
        }
        if (!settings.userType) {
          errors.push('Recipient type is required');
        }
        if (settings.userType === 'particular_user' && !settings.userId) {
          errors.push('User selection is required');
        }
        if (settings.userType === 'custom_number' && !settings.customNumber) {
          errors.push('Custom phone number is required');
        }
      }
      
      // Notification validation
      if (settings.notificationType === 'notification') {
        if (!settings.title) {
          errors.push('Notification title is required');
        }
        if (!settings.message) {
          errors.push('Notification message is required');
        }
        if (!settings.userType) {
          errors.push('Recipient type is required');
        }
        if (settings.userType === 'particular_user' && !settings.userId) {
          errors.push('User selection is required');
        }
      }
    }
    
    // Validate create lead requirements
    if (action.type === 'create_lead') {
      if (!settings.stageId) {
        errors.push('Pipeline stage is required');
      }
      if (!settings.assignmentType) {
        errors.push('Lead assignment method is required');
      }
      if (settings.assignmentType === 'round_robin' && (!settings.roundRobinUsers || settings.roundRobinUsers.length === 0)) {
        errors.push('At least one staff member must be selected for round robin assignment');
      }
      if (settings.assignmentType === 'specific_staff' && !settings.assignedTo) {
        errors.push('Staff member selection is required when using specific assignment');
      }
      if (settings.assignmentType === 'department_rotation' && !settings.department) {
        errors.push('Department selection is required when using department rotation');
      }
    }
    
    // Validate update client fields requirements
    if (action.type === 'update_client_fields') {
      if (!settings.fields || settings.fields.length === 0) {
        errors.push('At least one field must be configured');
      } else {
        settings.fields.forEach((field: any, index: number) => {
          if (!field.fieldId) {
            errors.push(`Field ${index + 1}: Field selection is required`);
          }
          if (!field.value || field.value.trim() === '') {
            errors.push(`Field ${index + 1}: Value is required`);
          }
        });
      }
    }
    
    return errors;
  };

  const handleSave = () => {
    const errors = validateSettings();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    onSave({
      ...action,
      settings,
      customName: customName.trim() || undefined
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
    
    // Clear validation errors when user starts fixing them
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const renderActionSettings = () => {
    switch (action.type) {
      case "send_email":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-template">Email Template</Label>
              <Select 
                value={settings.templateId || ""} 
                onValueChange={(value) => updateSetting("templateId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="email-to">Send To</Label>
              <Select 
                value={settings.recipient || "contact"} 
                onValueChange={(value) => updateSetting("recipient", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">
                    <div className="flex items-center gap-2">
                      <span>Contact/Lead</span>
                      {hasFormTrigger && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="assigned_staff">Assigned Staff Member</SelectItem>
                  <SelectItem value="specific_staff">Specific Staff Member</SelectItem>
                  <SelectItem value="custom_email">Custom Email Address</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.recipient === "specific_staff" && (
              <div>
                <Label htmlFor="staff-member">Staff Member</Label>
                <Popover open={staffComboboxOpen} onOpenChange={setStaffComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={staffComboboxOpen}
                      className="w-full justify-between"
                    >
                      {settings.staffId
                        ? staff.find((member: any) => member.id === settings.staffId)?.firstName + " " + staff.find((member: any) => member.id === settings.staffId)?.lastName
                        : "Select staff member..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search staff members..." />
                      <CommandEmpty>No staff member found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {staff.map((member: any) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.firstName} ${member.lastName} ${member.email}`}
                            onSelect={() => {
                              updateSetting("staffId", member.id);
                              setStaffComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                settings.staffId === member.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span>{member.firstName} {member.lastName}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {settings.recipient === "custom_email" && (
              <div>
                <Label htmlFor="custom-email">Email Address</Label>
                <Input
                  id="custom-email"
                  type="email"
                  value={settings.customEmail || ""}
                  onChange={(e) => updateSetting("customEmail", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            )}
          </div>
        );

      case "send_sms":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="sms-template">SMS Template</Label>
              <Select 
                value={settings.templateId || ""} 
                onValueChange={(value) => updateSetting("templateId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SMS template" />
                </SelectTrigger>
                <SelectContent>
                  {smsTemplates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sms-to">Send To</Label>
              <Select 
                value={settings.recipient || "contact"} 
                onValueChange={(value) => updateSetting("recipient", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contact/Lead Phone</SelectItem>
                  <SelectItem value="assigned_staff">Assigned Staff Phone</SelectItem>
                  <SelectItem value="specific_staff">Specific Staff Phone</SelectItem>
                  <SelectItem value="custom_phone">Custom Phone Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.recipient === "specific_staff" && (
              <div>
                <Label htmlFor="sms-staff-member">Staff Member</Label>
                <Popover open={staffComboboxOpen} onOpenChange={setStaffComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={staffComboboxOpen}
                      className="w-full justify-between"
                    >
                      {settings.staffId
                        ? staff.find((member: any) => member.id === settings.staffId)?.firstName + " " + staff.find((member: any) => member.id === settings.staffId)?.lastName
                        : "Select staff member..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search staff members..." />
                      <CommandEmpty>No staff member found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {staff.map((member: any) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.firstName} ${member.lastName} ${member.email}`}
                            onSelect={() => {
                              updateSetting("staffId", member.id);
                              setStaffComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                settings.staffId === member.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span>{member.firstName} {member.lastName}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {settings.recipient === "custom_phone" && (
              <div>
                <Label htmlFor="custom-phone">Phone Number</Label>
                <Input
                  id="custom-phone"
                  type="tel"
                  value={settings.customPhone || ""}
                  onChange={(e) => updateSetting("customPhone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            )}
          </div>
        );

      case "assign_contact_owner":
      case "assign_lead":
      case "assign_task":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">Assign To</Label>
              <Select 
                value={settings.staffId || ""} 
                onValueChange={(value) => updateSetting("staffId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} - {member.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reassign-existing"
                checked={settings.reassignExisting || false}
                onCheckedChange={(checked) => updateSetting("reassignExisting", checked)}
              />
              <Label htmlFor="reassign-existing">
                Reassign if already assigned to someone else
              </Label>
            </div>
          </div>
        );

      case "update_lead_stage":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pipeline-stage">New Stage</Label>
              <Select 
                value={settings.stageId || ""} 
                onValueChange={(value) => updateSetting("stageId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline stage" />
                </SelectTrigger>
                <SelectContent>
                  {leadPipelineStages.map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "create_task":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="task-title">Task Title</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Insert merge tag
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto">
                    {mergeTagGroups.map((group, groupIndex) => (
                      <div key={group.label}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50">
                          {group.label}
                        </div>
                        {group.tags.map((tag) => (
                          <DropdownMenuItem 
                            key={tag.value} 
                            onClick={() => insertMergeTagIntoTitle(tag.value)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{tag.label}</span>
                              <span className="text-xs text-gray-500">{tag.value}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        {groupIndex < mergeTagGroups.length - 1 && <DropdownMenuSeparator />}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Input
                id="task-title"
                value={settings.title || ""}
                onChange={(e) => updateSetting("title", e.target.value)}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="task-description">Task Description</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Insert merge tag
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto">
                    {mergeTagGroups.map((group, groupIndex) => (
                      <div key={group.label}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50">
                          {group.label}
                        </div>
                        {group.tags.map((tag) => (
                          <DropdownMenuItem 
                            key={tag.value} 
                            onClick={() => insertMergeTagIntoDescription(tag.value)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{tag.label}</span>
                              <span className="text-xs text-gray-500">{tag.value}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        {groupIndex < mergeTagGroups.length - 1 && <DropdownMenuSeparator />}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="task-description"
                value={settings.description || ""}
                onChange={(e) => updateSetting("description", e.target.value)}
                placeholder="Enter task description"
              />
            </div>

            <div>
              <Label htmlFor="task-assignee">Assign To</Label>
              <Select 
                value={settings.assigneeId || "unassigned"} 
                onValueChange={(value) => updateSetting("assigneeId", value === "unassigned" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No assignment</SelectItem>
                  {staff.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select 
                value={settings.priority || "medium"} 
                onValueChange={(value) => updateSetting("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="task-due-days">Due Date (Days from now)</Label>
              <Input
                id="task-due-days"
                type="number"
                value={settings.dueDays || ""}
                onChange={(e) => updateSetting("dueDays", parseInt(e.target.value) || 0)}
                placeholder="e.g., 7 for 7 days from now"
              />
            </div>
          </div>
        );

      case "add_tags":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tags-to-add">Tags to Add</Label>
              <div className="space-y-2">
                {tags.map((tag: any) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={(settings.tagIds || []).includes(tag.id)}
                      onCheckedChange={(checked) => {
                        const currentTags = settings.tagIds || [];
                        if (checked) {
                          updateSetting("tagIds", [...currentTags, tag.id]);
                        } else {
                          updateSetting("tagIds", currentTags.filter((id: string) => id !== tag.id));
                        }
                      }}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "update_client_fields":
        return (
          <div className="space-y-4">
            <div>
              <Label>Client Fields</Label>
              <p className="text-sm text-gray-600 mb-3">Add fields to update for the client who triggered this workflow.</p>
              
              {/* Existing Fields */}
              {(settings.fields || []).map((field: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`field-${index}`}>Field {index + 1}</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const currentFields = settings.fields || [];
                        const newFields = currentFields.filter((_: any, i: number) => i !== index);
                        updateSetting("fields", newFields);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Field Selection */}
                  <div>
                    <Label htmlFor={`field-select-${index}`}>Select Field</Label>
                    <Select 
                      value={field.fieldId || ""} 
                      onValueChange={(value) => {
                        const currentFields = [...(settings.fields || [])];
                        const selectedField = [...(clients.data?.clients || []).length > 0 ? Object.keys((clients.data?.clients || [])[0] || {}) : [], ...(customFields || []).map((cf: any) => ({ id: cf.id, name: cf.name, type: cf.type }))].find((f: any) => f.id === value || f === value);
                        currentFields[index] = { 
                          ...currentFields[index], 
                          fieldId: value,
                          fieldName: selectedField?.name || value,
                          fieldType: selectedField?.type || 'text'
                        };
                        updateSetting("fields", currentFields);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field to update" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {/* Standard Client Fields */}
                        <SelectItem value="firstName">First Name</SelectItem>
                        <SelectItem value="lastName">Last Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="address">Address</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="state">State</SelectItem>
                        <SelectItem value="zipCode">Zip Code</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="notes">Notes</SelectItem>
                        
                        {/* Custom Fields */}
                        {customFields && customFields.length > 0 && (
                          <>
                            <Separator />
                            {customFields.map((customField: any) => (
                              <SelectItem key={customField.id} value={customField.id}>
                                {customField.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Value Input */}
                  <div>
                    <Label htmlFor={`field-value-${index}`}>Value</Label>
                    <div className="relative">
                      {field.fieldType === 'multiline' ? (
                        <Textarea
                          id={`field-value-${index}`}
                          value={field.value || ""}
                          onChange={(e) => {
                            const currentFields = [...(settings.fields || [])];
                            currentFields[index] = { ...currentFields[index], value: e.target.value };
                            updateSetting("fields", currentFields);
                          }}
                          placeholder="Enter value or use merge tags like {{firstName}}, {{email}}"
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={`field-value-${index}`}
                          type={field.fieldType === 'number' ? 'number' : field.fieldType === 'email' ? 'email' : 'text'}
                          value={field.value || ""}
                          onChange={(e) => {
                            const currentFields = [...(settings.fields || [])];
                            currentFields[index] = { ...currentFields[index], value: e.target.value };
                            updateSetting("fields", currentFields);
                          }}
                          placeholder="Enter value or use merge tags like {{firstName}}, {{email}}"
                        />
                      )}
                      <div className="absolute right-2 top-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300">
                              <Tag className="h-3 w-3 mr-1" />
                              <span className="text-xs">Tags</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-0">
                            <div className="p-4">
                              <h4 className="text-sm font-medium mb-3">Insert Merge Tags</h4>
                              
                              {/* Search Input */}
                              <div className="mb-3">
                                <Input
                                  placeholder="Search merge tags..."
                                  value={tagSearchQueries?.[index] || ""}
                                  onChange={(e) => {
                                    const newSearchQueries = { ...tagSearchQueries };
                                    newSearchQueries[index] = e.target.value;
                                    setTagSearchQueries(newSearchQueries);
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              <div className="space-y-1 max-h-64 overflow-y-auto">
                                <div className="text-xs text-gray-500 mb-2">Click any tag to insert:</div>
                                {[
                                  // Client Basic Info
                                  { tag: '{{firstName}}', desc: 'Client first name', category: 'Client Info' },
                                  { tag: '{{lastName}}', desc: 'Client last name', category: 'Client Info' },
                                  { tag: '{{fullName}}', desc: 'Client full name', category: 'Client Info' },
                                  { tag: '{{email}}', desc: 'Client email address', category: 'Client Info' },
                                  { tag: '{{phone}}', desc: 'Client phone number', category: 'Client Info' },
                                  { tag: '{{company}}', desc: 'Client company name', category: 'Client Info' },
                                  { tag: '{{website}}', desc: 'Client website', category: 'Client Info' },
                                  
                                  // Client Address
                                  { tag: '{{address}}', desc: 'Client address', category: 'Address' },
                                  { tag: '{{city}}', desc: 'Client city', category: 'Address' },
                                  { tag: '{{state}}', desc: 'Client state', category: 'Address' },
                                  { tag: '{{zipCode}}', desc: 'Client zip code', category: 'Address' },
                                  { tag: '{{country}}', desc: 'Client country', category: 'Address' },
                                  
                                  // Date & Time
                                  { tag: '{{currentDate}}', desc: 'Current date', category: 'Date & Time' },
                                  { tag: '{{currentTime}}', desc: 'Current time', category: 'Date & Time' },
                                  { tag: '{{currentDateTime}}', desc: 'Current date and time', category: 'Date & Time' },
                                  { tag: '{{currentYear}}', desc: 'Current year', category: 'Date & Time' },
                                  { tag: '{{currentMonth}}', desc: 'Current month', category: 'Date & Time' },
                                  { tag: '{{currentDay}}', desc: 'Current day', category: 'Date & Time' },
                                  
                                  // System Info
                                  { tag: '{{assignedUser}}', desc: 'Assigned user name', category: 'System' },
                                  { tag: '{{assignedUserEmail}}', desc: 'Assigned user email', category: 'System' },
                                  { tag: '{{clientId}}', desc: 'Client unique ID', category: 'System' },
                                  { tag: '{{workflowName}}', desc: 'Current workflow name', category: 'System' },
                                  
                                  // Lead/Project Info
                                  { tag: '{{leadSource}}', desc: 'Lead source', category: 'Lead Info' },
                                  { tag: '{{leadStage}}', desc: 'Current lead stage', category: 'Lead Info' },
                                  { tag: '{{leadValue}}', desc: 'Lead value', category: 'Lead Info' },
                                  { tag: '{{projectName}}', desc: 'Associated project name', category: 'Project Info' },
                                  { tag: '{{projectStatus}}', desc: 'Project status', category: 'Project Info' },
                                  
                                  // Custom Fields (if available)
                                  ...(customFields || []).map((cf: any) => ({
                                    tag: `{{${cf.name.replace(/\s+/g, '')}}}`,
                                    desc: `Custom field: ${cf.name}`,
                                    category: 'Custom Fields'
                                  }))
                                ].filter(item => 
                                  !tagSearchQueries?.[index] || 
                                  item.tag.toLowerCase().includes((tagSearchQueries[index] || "").toLowerCase()) ||
                                  item.desc.toLowerCase().includes((tagSearchQueries[index] || "").toLowerCase()) ||
                                  item.category.toLowerCase().includes((tagSearchQueries[index] || "").toLowerCase())
                                ).map((item, tagIndex) => (
                                  <button
                                    key={tagIndex}
                                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs border border-transparent hover:border-gray-200"
                                    onClick={() => {
                                      const currentFields = [...(settings.fields || [])];
                                      const currentValue = currentFields[index]?.value || "";
                                      currentFields[index] = { ...currentFields[index], value: currentValue + item.tag };
                                      updateSetting("fields", currentFields);
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-mono text-blue-600 font-medium">{item.tag}</div>
                                        <div className="text-gray-500">{item.desc}</div>
                                      </div>
                                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {item.category}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Field Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentFields = settings.fields || [];
                  updateSetting("fields", [...currentFields, { fieldId: "", fieldName: "", fieldType: "text", value: "" }]);
                }}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
              
              {(!settings.fields || settings.fields.length === 0) && (
                <p className="text-sm text-gray-500 text-center">No fields configured. Click "Add Field" to start.</p>
              )}
            </div>
          </div>
        );

      case "create_internal_notification":
        return (
          <div className="space-y-4">
            {/* Notification Type Selection */}
            <div>
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select 
                value={settings.notificationType || ""} 
                onValueChange={(value) => {
                  // Clear other settings when type changes
                  setSettings({ notificationType: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="notification">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notification
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Configuration */}
            {settings.notificationType === "email" && (
              <>
                <div>
                  <Label htmlFor="email-template">Email Template</Label>
                  <Select 
                    value={settings.emailTemplateId || ""} 
                    onValueChange={(value) => updateSetting("emailTemplateId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select email template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="email-user-type">Send To</Label>
                  <Select 
                    value={settings.userType || ""} 
                    onValueChange={(value) => updateSetting("userType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="assigned_user">Assigned User</SelectItem>
                      <SelectItem value="particular_user">Particular User</SelectItem>
                      <SelectItem value="custom_email">Custom Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* SMS Configuration */}
            {settings.notificationType === "sms" && (
              <>
                <div>
                  <Label htmlFor="sms-template">SMS Template</Label>
                  <Select 
                    value={settings.smsTemplateId || ""} 
                    onValueChange={(value) => updateSetting("smsTemplateId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SMS template" />
                    </SelectTrigger>
                    <SelectContent>
                      {smsTemplates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sms-user-type">Send To</Label>
                  <Select 
                    value={settings.userType || ""} 
                    onValueChange={(value) => updateSetting("userType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="assigned_user">Assigned User</SelectItem>
                      <SelectItem value="particular_user">Particular User</SelectItem>
                      <SelectItem value="custom_number">Custom Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Notification Configuration */}
            {settings.notificationType === "notification" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="notification-title">Notification Title</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" type="button">
                          <Tag className="h-4 w-4 mr-2" />
                          Insert Merge Tag
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64" align="end">
                        {mergeTagGroups.map((group, groupIndex) => (
                          <div key={group.label}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                              {group.label}
                            </div>
                            {group.tags.map((tag) => (
                              <DropdownMenuItem 
                                key={tag.value} 
                                onClick={() => insertMergeTagIntoTitle(tag.value)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{tag.label}</span>
                                  <span className="text-xs text-gray-500">{tag.value}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                            {groupIndex < mergeTagGroups.length - 1 && <DropdownMenuSeparator />}
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Input
                    id="notification-title"
                    value={settings.title || ""}
                    onChange={(e) => updateSetting("title", e.target.value)}
                    placeholder="Enter notification title"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="notification-message">Message</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" type="button">
                          <Tag className="h-4 w-4 mr-2" />
                          Insert Merge Tag
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64" align="end">
                        {mergeTagGroups.map((group, groupIndex) => (
                          <div key={group.label}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                              {group.label}
                            </div>
                            {group.tags.map((tag) => (
                              <DropdownMenuItem 
                                key={tag.value} 
                                onClick={() => insertMergeTag(tag.value)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{tag.label}</span>
                                  <span className="text-xs text-gray-500">{tag.value}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                            {groupIndex < mergeTagGroups.length - 1 && <DropdownMenuSeparator />}
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea
                    id="notification-message"
                    value={settings.message || ""}
                    onChange={(e) => updateSetting("message", e.target.value)}
                    placeholder="Enter notification message (use merge tags to insert dynamic content)"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notification-user-type">Send To</Label>
                  <Select 
                    value={settings.userType || ""} 
                    onValueChange={(value) => updateSetting("userType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="assigned_user">Assigned User</SelectItem>
                      <SelectItem value="particular_user">Particular User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* User Selection (for all notification types when particular_user is selected) */}
            {settings.userType === "particular_user" && (
              <div>
                <Label htmlFor="staff-to-notify">Select User</Label>
                <Popover open={staffComboboxOpen} onOpenChange={setStaffComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={staffComboboxOpen}
                      className="w-full justify-between"
                      data-testid="button-select-user"
                    >
                      {settings.userId
                        ? staff.find((member: any) => member.id === settings.userId)?.firstName + " " + staff.find((member: any) => member.id === settings.userId)?.lastName
                        : "Select user..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {staff.map((member: any) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.firstName} ${member.lastName} ${member.email}`}
                            onSelect={() => {
                              updateSetting("userId", member.id);
                              setStaffComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                settings.userId === member.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span>{member.firstName} {member.lastName}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Custom Email Input */}
            {settings.userType === "custom_email" && (
              <div>
                <Label htmlFor="custom-email">Custom Email</Label>
                <Input
                  id="custom-email"
                  type="email"
                  value={settings.customEmail || ""}
                  onChange={(e) => updateSetting("customEmail", e.target.value)}
                  placeholder="Enter custom email address"
                  data-testid="input-custom-email"
                />
              </div>
            )}

            {/* Custom Number Input */}
            {settings.userType === "custom_number" && (
              <div>
                <Label htmlFor="custom-number">Custom Number</Label>
                <Input
                  id="custom-number"
                  type="tel"
                  value={settings.customNumber || ""}
                  onChange={(e) => updateSetting("customNumber", e.target.value)}
                  placeholder="Enter custom phone number"
                  data-testid="input-custom-number"
                />
              </div>
            )}
          </div>
        );

      case "log_communication":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select 
                value={settings.activityType || "email"} 
                onValueChange={(value) => updateSetting("activityType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="form_submission">Form Submission</SelectItem>
                  <SelectItem value="website_visit">Website Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity-subject">Subject/Title</Label>
              <Input
                id="activity-subject"
                value={settings.subject || ""}
                onChange={(e) => updateSetting("subject", e.target.value)}
                placeholder="e.g., New lead inquiry, Follow-up call"
              />
            </div>

            <div>
              <Label htmlFor="activity-contact">Contact/Client</Label>
              <Select 
                value={settings.contactSource || "trigger_contact"} 
                onValueChange={(value) => updateSetting("contactSource", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trigger_contact">
                    <div className="flex items-center gap-2">
                      <span>Contact from Trigger</span>
                      {hasFormTrigger && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="specific_contact">Specific Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.contactSource === "specific_contact" && (
              <div>
                <Label htmlFor="specific-contact">Select Contact</Label>
                <Select 
                  value={settings.contactId || ""} 
                  onValueChange={(value) => updateSetting("contactId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="activity-staff">Staff Member</Label>
              <Select 
                value={settings.staffId || ""} 
                onValueChange={(value) => updateSetting("staffId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_assign">Auto-assign</SelectItem>
                  {staff.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="activity-notes">Notes/Details</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" type="button">
                      <Tag className="h-4 w-4 mr-2" />
                      Insert Merge Tag
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                    {mergeTagGroups.map((group, groupIndex) => (
                      <div key={group.label}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                          {group.label}
                        </div>
                        {group.tags.map((tag) => (
                          <DropdownMenuItem 
                            key={tag.value} 
                            onClick={() => insertMergeTagIntoNotes(tag.value)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{tag.label}</span>
                              <span className="text-xs text-gray-500">{tag.value}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        {groupIndex < mergeTagGroups.length - 1 && <DropdownMenuSeparator />}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="activity-notes"
                value={settings.notes || ""}
                onChange={(e) => updateSetting("notes", e.target.value)}
                placeholder="Additional details about this communication..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="activity-outcome">Outcome/Result</Label>
              <Select 
                value={settings.outcome || "completed"} 
                onValueChange={(value) => updateSetting("outcome", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled_followup">Scheduled Follow-up</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "create_lead":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lead-pipeline-stage">Pipeline Stage</Label>
              <Select 
                value={settings.stageId || ""} 
                onValueChange={(value) => updateSetting("stageId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select initial pipeline stage" />
                </SelectTrigger>
                <SelectContent>
                  {leadPipelineStages.map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lead-assignment">Lead Assignment</Label>
              <Select 
                value={settings.assignmentType || "round_robin"} 
                onValueChange={(value) => updateSetting("assignmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">
                    <div className="flex items-center gap-2">
                      <span>Round Robin</span>
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific_staff">Specific Staff Member</SelectItem>
                  <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                  <SelectItem value="department_rotation">Department Rotation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.assignmentType === "round_robin" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="round-robin-users">Round Robin Users</Label>
                  <div className="space-y-3">
                    {/* Selected staff members display */}
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50 min-h-[40px]">
                      {settings.roundRobinUsers?.map((userId: string) => {
                        const member = staff.find((s: any) => s.id === userId);
                        if (!member) return null;
                        return (
                          <div key={userId} className="flex items-center gap-1 bg-white border rounded-md px-2 py-1">
                            <span className="text-sm">{member.firstName} {member.lastName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => {
                                const currentUsers = settings.roundRobinUsers || [];
                                const newUsers = currentUsers.filter((id: string) => id !== userId);
                                updateSetting("roundRobinUsers", newUsers);
                                // Also remove from weights
                                const currentWeights = settings.roundRobinWeights || {};
                                const { [userId]: removed, ...remainingWeights } = currentWeights;
                                updateSetting("roundRobinWeights", remainingWeights);
                              }}
                              className="h-4 w-4 p-0 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      }) || []}
                      
                      {/* Add user dropdown */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" type="button" className="border-dashed">
                            <Plus className="h-4 w-4 mr-1" />
                            Add User
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search staff members..." />
                            <CommandEmpty>No staff member found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {staff
                                .filter((member: any) => !settings.roundRobinUsers?.includes(member.id))
                                .map((member: any) => (
                                <CommandItem
                                  key={member.id}
                                  value={`${member.firstName} ${member.lastName} ${member.email}`}
                                  onSelect={() => {
                                    const currentUsers = settings.roundRobinUsers || [];
                                    updateSetting("roundRobinUsers", [...currentUsers, member.id]);
                                    // Initialize weight to 1
                                    const currentWeights = settings.roundRobinWeights || {};
                                    updateSetting("roundRobinWeights", {
                                      ...currentWeights,
                                      [member.id]: 1
                                    });
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span>{member.firstName} {member.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {(!settings.roundRobinUsers || settings.roundRobinUsers.length === 0) && (
                      <p className="text-sm text-gray-500">No users selected. Click "Add User" to select staff members for round robin assignment.</p>
                    )}
                  </div>
                </div>

                {settings.roundRobinUsers && settings.roundRobinUsers.length > 0 && (
                  <div>
                    <Label htmlFor="split-traffic">Split Traffic</Label>
                    <Select 
                      value={settings.splitTraffic || "equally"} 
                      onValueChange={(value) => updateSetting("splitTraffic", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select distribution method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equally">Equally</SelectItem>
                        <SelectItem value="unevenly">Unevenly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.splitTraffic === "unevenly" && settings.roundRobinUsers && settings.roundRobinUsers.length > 0 && (
                  <div>
                    <Label>Traffic Weightage</Label>
                    <div className="space-y-3 mt-2">
                      {settings.roundRobinUsers.map((userId: string) => {
                        const member = staff.find((s: any) => s.id === userId);
                        if (!member) return null;
                        return (
                          <div key={userId} className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {member.firstName} {member.lastName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={settings.roundRobinWeights?.[userId] || 1}
                                onChange={(e) => {
                                  const currentWeights = settings.roundRobinWeights || {};
                                  updateSetting("roundRobinWeights", {
                                    ...currentWeights,
                                    [userId]: parseInt(e.target.value) || 1
                                  });
                                }}
                                className="w-16 text-center"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {settings.roundRobinUsers && settings.roundRobinUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-unassigned-leads"
                      checked={settings.onlyUnassignedLeads || false}
                      onCheckedChange={(checked) => updateSetting("onlyUnassignedLeads", checked)}
                    />
                    <Label htmlFor="only-unassigned-leads" className="text-sm">
                      Only apply to unassigned leads
                    </Label>
                  </div>
                )}
              </div>
            )}

            {settings.assignmentType === "specific_staff" && (
              <div>
                <Label htmlFor="specific-staff-lead">Assign To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {settings.assignedTo 
                        ? staff.find((member: any) => member.id === settings.assignedTo)?.firstName + " " + 
                          staff.find((member: any) => member.id === settings.assignedTo)?.lastName
                        : "Select staff member..."
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search staff members..." />
                      <CommandEmpty>No staff member found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {staff.map((member: any) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.firstName} ${member.lastName} ${member.email}`}
                            onSelect={() => {
                              updateSetting("assignedTo", member.id);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                settings.assignedTo === member.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span>{member.firstName} {member.lastName}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {settings.assignmentType === "department_rotation" && (
              <div>
                <Label htmlFor="department-rotation">Department</Label>
                <Select 
                  value={settings.department || ""} 
                  onValueChange={(value) => updateSetting("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="business_development">Business Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="lead-source">Lead Source</Label>
              <Select 
                value={settings.source || ""} 
                onValueChange={(value) => updateSetting("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website_form">Website Form</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email_campaign">Email Campaign</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="trade_show">Trade Show</SelectItem>
                  <SelectItem value="content_marketing">Content Marketing</SelectItem>
                  <SelectItem value="paid_advertising">Paid Advertising</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lead-status">Initial Status</Label>
              <Select 
                value={settings.status || "new"} 
                onValueChange={(value) => updateSetting("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select initial status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lead-value">Estimated Value ($)</Label>
              <Input
                id="lead-value"
                type="number"
                value={settings.value || ""}
                onChange={(e) => updateSetting("value", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 5000"
              />
            </div>

            <div>
              <Label htmlFor="lead-probability">Close Probability (%)</Label>
              <Input
                id="lead-probability"
                type="number"
                min="0"
                max="100"
                value={settings.probability || ""}
                onChange={(e) => updateSetting("probability", parseInt(e.target.value) || 0)}
                placeholder="e.g., 25"
              />
            </div>

            {/* Custom Fields Section */}
            {customFields.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Custom Fields
                    </h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" type="button">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64" align="end">
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                          Available Fields
                        </div>
                        {customFields
                          .filter((field: any) => !settings.selectedCustomFields?.includes(field.id))
                          .map((field: any) => (
                            <DropdownMenuItem 
                              key={field.id} 
                              onClick={() => {
                                const currentFields = settings.selectedCustomFields || [];
                                updateSetting("selectedCustomFields", [...currentFields, field.id]);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{field.name}</span>
                                <span className="text-xs text-gray-500 capitalize">{field.type}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        {customFields.filter((field: any) => !settings.selectedCustomFields?.includes(field.id)).length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-gray-500">
                            All fields have been added
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {settings.selectedCustomFields?.map((fieldId: string) => {
                    const field = customFields.find((f: any) => f.id === fieldId);
                    if (!field) return null;
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`custom-${field.id}`}>{field.name}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const currentFields = settings.selectedCustomFields || [];
                              updateSetting("selectedCustomFields", currentFields.filter((id: string) => id !== field.id));
                              // Also remove the value
                              const currentCustomFields = settings.customFields || {};
                              const { [field.id]: removed, ...remainingFields } = currentCustomFields;
                              updateSetting("customFields", remainingFields);
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Text fields */}
                        {field.type === "text" && (
                          <Input
                            id={`custom-${field.id}`}
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: e.target.value
                            })}
                            placeholder={`Enter ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {/* Email fields */}
                        {field.type === "email" && (
                          <Input
                            id={`custom-${field.id}`}
                            type="email"
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: e.target.value
                            })}
                            placeholder={`Enter ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {/* Phone fields */}
                        {field.type === "phone" && (
                          <Input
                            id={`custom-${field.id}`}
                            type="tel"
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: e.target.value
                            })}
                            placeholder={`Enter ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {/* URL fields */}
                        {field.type === "url" && (
                          <Input
                            id={`custom-${field.id}`}
                            type="url"
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: e.target.value
                            })}
                            placeholder={`Enter ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {/* Currency fields */}
                        {field.type === "currency" && (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              id={`custom-${field.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              value={settings.customFields?.[field.id] || ""}
                              onChange={(e) => updateSetting("customFields", {
                                ...settings.customFields,
                                [field.id]: parseFloat(e.target.value) || 0
                              })}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                            />
                          </div>
                        )}
                        
                        {/* Date fields */}
                        {field.type === "date" && (
                          <Input
                            id={`custom-${field.id}`}
                            type="date"
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: e.target.value
                            })}
                          />
                        )}
                        
                        {/* Textarea fields */}
                        {field.type === "textarea" && (
                          <Textarea
                            id={`custom-${field.id}`}
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: e.target.value
                            })}
                            placeholder={`Enter ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {/* Select/Dropdown fields */}
                        {(field.type === "select" || field.type === "dropdown") && field.options && (
                          <Select
                            value={settings.customFields?.[field.id] || ""}
                            onValueChange={(value) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option: string, index: number) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {/* Number fields */}
                        {field.type === "number" && (
                          <Input
                            id={`custom-${field.id}`}
                            type="number"
                            value={settings.customFields?.[field.id] || ""}
                            onChange={(e) => updateSetting("customFields", {
                              ...settings.customFields,
                              [field.id]: parseFloat(e.target.value) || 0
                            })}
                            placeholder={`Enter ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {/* Checkbox fields */}
                        {field.type === "checkbox" && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`custom-${field.id}`}
                              checked={settings.customFields?.[field.id] || false}
                              onCheckedChange={(checked) => updateSetting("customFields", {
                                ...settings.customFields,
                                [field.id]: checked
                              })}
                            />
                            <Label htmlFor={`custom-${field.id}`}>{field.name}</Label>
                          </div>
                        )}
                        
                        {/* File upload fields */}
                        {field.type === "file_upload" && (
                          <Input
                            id={`custom-${field.id}`}
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              updateSetting("customFields", {
                                ...settings.customFields,
                                [field.id]: file?.name || ""
                              });
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  {(!settings.selectedCustomFields || settings.selectedCustomFields.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No custom fields added. Click "Add Field" to include custom fields.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "split":
        return (
          <div className="space-y-4">
            <div>
              <Label>Conditions</Label>
              <p className="text-sm text-gray-500 mb-3">Define the criteria for routing workflow execution</p>
              
              <div className="space-y-3">
                {(settings.conditions || []).map((condition: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Branch {index + 1}</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newConditions = settings.conditions.filter((_: any, i: number) => i !== index);
                          updateSetting("conditions", newConditions);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Field</Label>
                        <Input
                          value={condition.field || ""}
                          onChange={(e) => {
                            const newConditions = [...(settings.conditions || [])];
                            newConditions[index] = { ...condition, field: e.target.value };
                            updateSetting("conditions", newConditions);
                          }}
                          placeholder="e.g., email, company, score"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Operator</Label>
                        <Select 
                          value={condition.operator || ""} 
                          onValueChange={(value) => {
                            const newConditions = [...(settings.conditions || [])];
                            newConditions[index] = { ...condition, operator: value };
                            updateSetting("conditions", newConditions);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_contains">Not Contains</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="is_empty">Is Empty</SelectItem>
                            <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={condition.value || ""}
                          onChange={(e) => {
                            const newConditions = [...(settings.conditions || [])];
                            newConditions[index] = { ...condition, value: e.target.value };
                            updateSetting("conditions", newConditions);
                          }}
                          placeholder="Comparison value"
                          disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Next Action ID</Label>
                        <Input
                          value={condition.branch_action_id || ""}
                          onChange={(e) => {
                            const newConditions = [...(settings.conditions || [])];
                            newConditions[index] = { ...condition, branch_action_id: e.target.value };
                            updateSetting("conditions", newConditions);
                          }}
                          placeholder="Target action ID"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const newConditions = [...(settings.conditions || []), { field: "", operator: "equals", value: "", branch_action_id: "" }];
                    updateSetting("conditions", newConditions);
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="default-branch">Default Branch Action ID</Label>
              <Input
                id="default-branch"
                value={settings.default_branch_action_id || ""}
                onChange={(e) => updateSetting("default_branch_action_id", e.target.value)}
                placeholder="Action ID for when no conditions match"
              />
            </div>
          </div>
        );

      case "wait":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="wait-type">Wait Type</Label>
              <Select 
                value={settings.wait_type || ""} 
                onValueChange={(value) => updateSetting("wait_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wait type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_delay">Time Delay</SelectItem>
                  <SelectItem value="event_time">Event/Appointment Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {settings.wait_type === "time_delay" && (
              <>
                <div>
                  <Label htmlFor="delay-amount">Delay Amount</Label>
                  <Input
                    id="delay-amount"
                    type="number"
                    value={settings.delay_amount || ""}
                    onChange={(e) => updateSetting("delay_amount", parseInt(e.target.value) || 0)}
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <Label htmlFor="delay-unit">Time Unit</Label>
                  <Select 
                    value={settings.delay_unit || ""} 
                    onValueChange={(value) => updateSetting("delay_unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {settings.wait_type === "event_time" && (
              <>
                <div>
                  <Label htmlFor="event-timing">Event Timing</Label>
                  <Select 
                    value={settings.event_timing || ""} 
                    onValueChange={(value) => updateSetting("event_timing", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before</SelectItem>
                      <SelectItem value="after">After</SelectItem>
                      <SelectItem value="exact">Exact Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="time-offset-amount">Time Offset</Label>
                  <Input
                    id="time-offset-amount"
                    type="number"
                    value={settings.time_offset_amount || ""}
                    onChange={(e) => updateSetting("time_offset_amount", parseInt(e.target.value) || 0)}
                    placeholder="Enter offset amount"
                  />
                </div>
                
                <div>
                  <Label htmlFor="time-offset-unit">Offset Unit</Label>
                  <Select 
                    value={settings.time_offset_unit || ""} 
                    onValueChange={(value) => updateSetting("time_offset_unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-field">Date Field</Label>
                  <Input
                    id="date-field"
                    value={settings.date_field || ""}
                    onChange={(e) => updateSetting("date_field", e.target.value)}
                    placeholder="Field containing the date/time (e.g., appointment_date)"
                  />
                </div>
              </>
            )}
          </div>
        );

      case "go_to":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-action">Target Action ID</Label>
              <Input
                id="target-action"
                value={settings.target_action_id || ""}
                onChange={(e) => updateSetting("target_action_id", e.target.value)}
                placeholder="ID of the action to jump to"
              />
            </div>
            
            <div>
              <Label>Jump Condition (Optional)</Label>
              <p className="text-sm text-gray-500 mb-3">Leave empty to always jump, or add a condition</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Field</Label>
                  <Input
                    value={settings.condition?.field || ""}
                    onChange={(e) => updateSetting("condition", { ...settings.condition, field: e.target.value })}
                    placeholder="Field to check"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select 
                    value={settings.condition?.operator || "always"} 
                    onValueChange={(value) => updateSetting("condition", { ...settings.condition, operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={settings.condition?.value || ""}
                    onChange={(e) => updateSetting("condition", { ...settings.condition, value: e.target.value })}
                    placeholder="Comparison value"
                    disabled={settings.condition?.operator === 'always'}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "date_time_formatter":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="source-field">Source Field</Label>
              <Input
                id="source-field"
                value={settings.source_field || ""}
                onChange={(e) => updateSetting("source_field", e.target.value)}
                placeholder="Field containing the date to format"
              />
            </div>
            
            <div>
              <Label htmlFor="from-format">From Format</Label>
              <Select 
                value={settings.from_format || ""} 
                onValueChange={(value) => updateSetting("from_format", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select input format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                  <SelectItem value="MMMM DD, YYYY">MMMM DD, YYYY</SelectItem>
                  <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  <SelectItem value="timestamp">Timestamp</SelectItem>
                  <SelectItem value="iso8601">ISO 8601</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="to-format">To Format</Label>
              <Select 
                value={settings.to_format || ""} 
                onValueChange={(value) => updateSetting("to_format", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select output format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                  <SelectItem value="MMMM DD, YYYY">MMMM DD, YYYY</SelectItem>
                  <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY HH:mm">MM/DD/YYYY HH:mm</SelectItem>
                  <SelectItem value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</SelectItem>
                  <SelectItem value="timestamp">Timestamp</SelectItem>
                  <SelectItem value="iso8601">ISO 8601</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="target-field">Target Field</Label>
              <Input
                id="target-field"
                value={settings.target_field || ""}
                onChange={(e) => updateSetting("target_field", e.target.value)}
                placeholder="Field to store the formatted date"
              />
            </div>
            
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={settings.timezone || "UTC"}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                placeholder="e.g., America/New_York, UTC"
              />
            </div>
          </div>
        );

      case "number_formatter":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="source-field">Source Field</Label>
              <Input
                id="source-field"
                value={settings.source_field || ""}
                onChange={(e) => updateSetting("source_field", e.target.value)}
                placeholder="Field containing the value to format"
              />
            </div>
            
            <div>
              <Label htmlFor="format-type">Format Type</Label>
              <Select 
                value={settings.format_type || ""} 
                onValueChange={(value) => updateSetting("format_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text_to_number">Text to Number</SelectItem>
                  <SelectItem value="format_number">Format Number</SelectItem>
                  <SelectItem value="format_phone">Format Phone Number</SelectItem>
                  <SelectItem value="format_currency">Format Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(settings.format_type === "format_number" || settings.format_type === "format_currency") && (
              <>
                <div>
                  <Label htmlFor="decimal-places">Decimal Places</Label>
                  <Input
                    id="decimal-places"
                    type="number"
                    value={settings.decimal_places || 2}
                    onChange={(e) => updateSetting("decimal_places", parseInt(e.target.value) || 0)}
                    placeholder="Number of decimal places"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="thousands-separator">Thousands Separator</Label>
                    <Select 
                      value={settings.thousands_separator || ","} 
                      onValueChange={(value) => updateSetting("thousands_separator", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Comma (,)</SelectItem>
                        <SelectItem value=".">Period (.)</SelectItem>
                        <SelectItem value=" ">Space ( )</SelectItem>
                        <SelectItem value="">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="decimal-separator">Decimal Separator</Label>
                    <Select 
                      value={settings.decimal_separator || "."} 
                      onValueChange={(value) => updateSetting("decimal_separator", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=".">Period (.)</SelectItem>
                        <SelectItem value=",">Comma (,)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            
            {settings.format_type === "format_phone" && (
              <div>
                <Label htmlFor="phone-format">Phone Format</Label>
                <Select 
                  value={settings.phone_format || "(XXX) XXX-XXXX"} 
                  onValueChange={(value) => updateSetting("phone_format", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="(XXX) XXX-XXXX">(XXX) XXX-XXXX</SelectItem>
                    <SelectItem value="XXX-XXX-XXXX">XXX-XXX-XXXX</SelectItem>
                    <SelectItem value="+1 XXX XXX XXXX">+1 XXX XXX XXXX</SelectItem>
                    <SelectItem value="XXX.XXX.XXXX">XXX.XXX.XXXX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {settings.format_type === "format_currency" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currency-code">Currency</Label>
                  <Select 
                    value={settings.currency_code || "USD"} 
                    onValueChange={(value) => updateSetting("currency_code", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="symbol-position">Symbol Position</Label>
                  <Select 
                    value={settings.currency_symbol_position || "before"} 
                    onValueChange={(value) => updateSetting("currency_symbol_position", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before ($100)</SelectItem>
                      <SelectItem value="after">After (100$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="target-field">Target Field</Label>
              <Input
                id="target-field"
                value={settings.target_field || ""}
                onChange={(e) => updateSetting("target_field", e.target.value)}
                placeholder="Field to store the formatted value"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Action Configuration</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                This action type doesn't require additional configuration.
              </p>
            </div>
          </div>
        );
    }
  };

  const getActionIcon = () => {
    switch (action.type) {
      case "send_email":
        return Mail;
      case "send_sms":
        return MessageSquare;
      case "assign_contact_owner":
      case "assign_lead":
      case "assign_task":
        return Users;
      case "log_communication":
        return FileText;
      case "create_lead":
        return Users;
      case "split":
        return LucideIcons.GitBranch;
      case "wait":
        return LucideIcons.Clock;
      case "go_to":
        return LucideIcons.ArrowRight;
      case "date_time_formatter":
        return LucideIcons.Calendar;
      case "update_client_fields":
        return LucideIcons.Edit;
      case "number_formatter":
        return LucideIcons.Hash;
      default:
        return FileText;
    }
  };

  const ActionIcon = getActionIcon();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
            <ActionIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Configure Action</h2>
            <p className="text-sm text-gray-500">{action.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Action Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Custom Name Input */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="actionCustomName" className="text-sm font-medium">
                Custom Name (Optional)
              </Label>
              <Input
                id="actionCustomName"
                data-testid="input-action-custom-name"
                placeholder={`e.g., "Send Welcome Email - New Lead"`}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">
                Give this action a custom name to help identify it in your workflow
              </p>
            </div>
            
            {renderActionSettings()}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t p-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <X className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Please fix the following errors:</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#46a1a0] hover:bg-[#3a8a89]">
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}