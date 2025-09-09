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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
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

  useEffect(() => {
    const initialSettings = action.settings || {};
    
    // Auto-select contact/lead for new email actions when form triggers exist
    if (action.type === 'send_email' && hasFormTrigger && !initialSettings.recipient) {
      initialSettings.recipient = 'contact';
    }
    
    setSettings(initialSettings);
  }, [action, hasFormTrigger]);

  const handleSave = () => {
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
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                value={settings.message || ""}
                onChange={(e) => updateSetting("message", e.target.value)}
                placeholder="Enter notification message"
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
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        <Button variant="outline" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
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
      <div className="border-t p-6 flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-[#46a1a0] hover:bg-[#3a8a89]">
          Save Configuration
        </Button>
      </div>
    </div>
  );
}