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
import { X, Settings, Check, Plus, Trash2, Filter, Tag, ChevronsUpDown, Mail, MessageSquare, Users, FileText } from "lucide-react";
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
  const [staffComboboxOpen, setStaffComboboxOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  useEffect(() => {
    const initialSettings = action.settings || {};
    
    // Auto-select contact/lead for new email actions when form triggers exist
    if (action.type === 'send_email' && hasFormTrigger && !initialSettings.recipient) {
      initialSettings.recipient = 'contact';
    }
    
    setSettings(initialSettings);
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
    
    // Validate create lead requirements
    if (action.type === 'create_lead') {
      if (!settings.stageId) {
        errors.push('Pipeline stage is required');
      }
      if (!settings.assignmentType) {
        errors.push('Lead assignment method is required');
      }
      if (settings.assignmentType === 'specific_staff' && !settings.assignedTo) {
        errors.push('Staff member selection is required when using specific assignment');
      }
      if (settings.assignmentType === 'department_rotation' && !settings.department) {
        errors.push('Department selection is required when using department rotation');
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
      settings
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
                      <CommandGroup>
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
                      <CommandGroup>
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
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={settings.title || ""}
                onChange={(e) => updateSetting("title", e.target.value)}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <Label htmlFor="task-description">Task Description</Label>
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
                value={settings.assigneeId || ""} 
                onValueChange={(value) => updateSetting("assigneeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No assignment</SelectItem>
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

      case "send_internal_notification":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Notification Title</Label>
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
              <Label htmlFor="notify-who">Notify</Label>
              <Select 
                value={settings.notifyType || "assigned_staff"} 
                onValueChange={(value) => updateSetting("notifyType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select who to notify" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned_staff">Assigned Staff Member</SelectItem>
                  <SelectItem value="specific_staff">Specific Staff Member</SelectItem>
                  <SelectItem value="all_staff">All Staff</SelectItem>
                  <SelectItem value="managers_only">Managers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.notifyType === "specific_staff" && (
              <div>
                <Label htmlFor="staff-to-notify">Staff Member</Label>
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
                      <CommandGroup>
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
                      <CommandGroup>
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