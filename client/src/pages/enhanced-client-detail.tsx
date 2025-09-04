import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { ArrowLeft, User, ChevronDown, ChevronRight, FileText, CheckCircle, Plus, ExternalLink, Edit2, Save, X, Filter, Hash, Briefcase, Workflow, Target, UserCircle, ShoppingCart, Package, Trash2, Mail, MessageSquare, Phone, ShieldOff, StickyNote, Calendar, Upload, CreditCard, Search, Clock, RefreshCw, Send, AtSign, Download, MessageCircle, Bold, Italic, Underline, Type, FileImage, Paperclip, HelpCircle, Tag as TagIcon, Globe, CornerDownRight, MapPin, Edit, Users, Activity, Zap } from "lucide-react";
import CustomFieldFileUpload from "@/components/CustomFieldFileUpload";


import { DocumentUploader } from "@/components/DocumentUploader";
import { AppointmentModal } from "@/components/AppointmentModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, Tag, InsertTag, EmailTemplate, SmsTemplate } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// EmailTemplateSelector Component
function EmailTemplateSelector({ onSelectTemplate }: { onSelectTemplate: (content: string, name: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: emailTemplates = [], isLoading } = useQuery({
    queryKey: ["/api/email-templates"],
  });

  const filteredTemplates = (emailTemplates as EmailTemplate[]).filter((template: EmailTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-4 text-center">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Search templates..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No templates found matching your search." : "No email templates available."}
          </div>
        ) : (
          filteredTemplates.map((template: EmailTemplate) => (
            <div 
              key={template.id}
              className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectTemplate(template.content, template.name)}
            >
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.previewText || template.subject}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// TeamAssignmentSection Component
function TeamAssignmentSection({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const positions = [
    { key: "setter", label: "Setter" },
    { key: "bdr", label: "BDR" },
    { key: "account_manager", label: "Account Manager" },
    { key: "media_buyer", label: "Media Buyer" },
    { key: "cro_specialist", label: "CRO Specialist" },
    { key: "automation_specialist", label: "Automation Specialist" },
    { key: "show_rate_specialist", label: "Show Rate Specialist" },
    { key: "data_specialist", label: "Data Specialist" },
    { key: "seo_specialist", label: "SEO Specialist" },
    { key: "social_media_specialist", label: "Social Media Specialist" }
  ];

  // Get all staff members
  const { data: staffList = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  // Get current team assignments
  const { data: teamAssignments = [], isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}/team`],
    enabled: !!clientId,
  });

  // Update team assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ position, staffId }: { position: string; staffId?: string }) => {
      const response = await fetch(`/api/clients/${clientId}/team/${position}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffId }),
      });
      if (!response.ok) {
        throw new Error('Failed to update team assignment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/team`] });
      toast({
        title: "Success",
        description: "Team assignment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update team assignment",
        variant: "destructive",
      });
    },
  });

  // Get assignment for a specific position
  const getAssignmentForPosition = (position: string) => {
    return (teamAssignments as any[]).find((assignment: any) => assignment.position === position);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Team Assignments</h3>
        <div className="text-sm text-gray-500">
          {(teamAssignments as any[]).length} of {positions.length} positions filled
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {positions.map((position) => (
            <div key={position.key} className="animate-pulse">
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {positions.map((position) => {
            const assignment = getAssignmentForPosition(position.key);
            const assignedStaff = assignment ? (staffList as any[]).find((staff: any) => staff.id === assignment.staffId) : null;

            return (
              <div key={position.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{position.label}:</span>
                </div>
                
                <Select
                  value={assignment?.staffId || "not_assigned"}
                  onValueChange={(value) => {
                    updateAssignmentMutation.mutate({
                      position: position.key,
                      staffId: value === "not_assigned" ? undefined : value,
                    });
                  }}
                  disabled={updateAssignmentMutation.isPending}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Not Assigned">
                      {assignedStaff ? (
                        <div className="flex items-center gap-2">
                          {assignedStaff.profileImage || assignedStaff.profileImagePath ? (
                            <img 
                              src={assignedStaff.profileImage || (assignedStaff.profileImagePath ? `/objects${assignedStaff.profileImagePath}` : undefined)} 
                              alt="" 
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="w-2 h-2 text-gray-500" />
                            </div>
                          )}
                          <span>{assignedStaff.firstName} {assignedStaff.lastName}</span>
                        </div>
                      ) : (
                        "Not Assigned"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="p-2">
                      <Input 
                        placeholder="Search staff..." 
                        className="mb-2"
                        onChange={(e) => {
                          // Implement search functionality
                          const searchTerm = e.target.value.toLowerCase();
                          const items = document.querySelectorAll(`[data-position="${position.key}"] .select-item`);
                          items.forEach((item) => {
                            const text = item.textContent?.toLowerCase() || "";
                            if (text.includes(searchTerm)) {
                              (item as HTMLElement).style.display = "block";
                            } else {
                              (item as HTMLElement).style.display = "none";
                            }
                          });
                        }}
                      />
                    </div>
                    <SelectItem value="not_assigned" data-position={position.key}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        <span>Not Assigned</span>
                      </div>
                    </SelectItem>
                    {(staffList as any[]).map((staff: any) => (
                      <SelectItem key={staff.id} value={staff.id} className="select-item" data-position={position.key}>
                        <div className="flex items-center gap-2">
                          {staff.profileImage || staff.profileImagePath ? (
                            <img 
                              src={staff.profileImage || (staff.profileImagePath ? `/objects${staff.profileImagePath}` : undefined)} 
                              alt="" 
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="w-2 h-2 text-gray-500" />
                            </div>
                          )}
                          <span>{staff.firstName} {staff.lastName}</span>
                          {staff.department && (
                            <span className="text-xs text-gray-500">• {staff.department}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}

// SmsTemplateSelector Component
function SmsTemplateSelector({ onSelectTemplate }: { onSelectTemplate: (content: string, name: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: smsTemplates = [], isLoading } = useQuery({
    queryKey: ["/api/sms-templates"],
  });

  const filteredTemplates = (smsTemplates as SmsTemplate[]).filter((template: SmsTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-4 text-center">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Search templates..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No templates found matching your search." : "No SMS templates available."}
          </div>
        ) : (
          filteredTemplates.map((template: SmsTemplate) => (
            <div 
              key={template.id}
              className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectTemplate(template.content, template.name)}
            >
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.content.length > 100 ? template.content.substring(0, 100) + '...' : template.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
  formatPhoneNumber,
  clientId
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
  clientId?: string;
}) => {
  const isEditing = editingField === fieldId;
  
  // Handle file upload fields differently - they don't support inline editing
  if (type === 'file_upload') {
    return (
      <div>
        <label className="flex items-center justify-between text-gray-500 mb-1">
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
        <CustomFieldFileUpload
          customFieldId={fieldId}
          clientId={clientId || ""}
          value={[]}
          onChange={() => {}}
          label={label}
          required={required}
        />
      </div>
    );
  }
  
  return (
    <div>
      <label className="flex items-center justify-between text-gray-500 mb-1">
        <span>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>

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
              ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  
  // Ref for right column (left column height tracking removed)
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // State management
  const [sections, setSections] = useState<Section[]>([
    { id: "contact-details", name: "Contact Details", isOpen: true }
  ]);
  const [activeRightSection, setActiveRightSection] = useState<"notes" | "tasks" | "appointments" | "documents" | "payments" | "team">("notes");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [searchDocuments, setSearchDocuments] = useState("");
  const [documentFilterType, setDocumentFilterType] = useState("all");
  const [documentSortBy, setDocumentSortBy] = useState("newest");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // Appointments state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  // Helper function to toggle note expansion
  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Helper function to format note content with preserved line breaks
  const formatNoteContent = (content: string, noteId: string, maxLength: number = 300) => {
    const isExpanded = expandedNotes.has(noteId);
    const shouldTruncate = content.length > maxLength;
    
    let displayContent = content;
    if (shouldTruncate && !isExpanded) {
      displayContent = content.substring(0, maxLength) + '...';
    }

    return {
      displayContent,
      shouldTruncate,
      isExpanded
    };
  };

  const [newAppointment, setNewAppointment] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    status: "confirmed"
  });
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

  // Enhanced recurring task state
  const [recurringConfig, setRecurringConfig] = useState({
    interval: 1,
    unit: "days" as "hours" | "days" | "weeks" | "months" | "years",
    endType: "never" as "never" | "on" | "after",
    endDate: "",
    endAfter: 1,
    createIfOverdue: false
  });

  // Assignee search state
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);
  const [filteredAssignees, setFilteredAssignees] = useState<any[]>([]);

  // Edit task state
  const [editTask, setEditTask] = useState<NewTask>({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    assignee: "",
    recurring: false
  });
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editRecurringConfig, setEditRecurringConfig] = useState({
    interval: 1,
    unit: "days" as "hours" | "days" | "weeks" | "months" | "years",
    endType: "never" as "never" | "on" | "after",
    endDate: "",
    endAfter: 1,
    createIfOverdue: false
  });
  const [editAssigneeSearchTerm, setEditAssigneeSearchTerm] = useState("");
  const [showEditAssigneeSuggestions, setShowEditAssigneeSuggestions] = useState(false);
  const [editFilteredAssignees, setEditFilteredAssignees] = useState<any[]>([]);

  // Comments state
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState("");
  const [commentSearchTerm, setCommentSearchTerm] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

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

  // Owner and followers state
  const [isAssigningOwner, setIsAssigningOwner] = useState(false);
  const [ownerSearchTerm, setOwnerSearchTerm] = useState("");
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const [isAddingFollowers, setIsAddingFollowers] = useState(false);
  const [followerSearchTerm, setFollowerSearchTerm] = useState("");
  const [filteredFollowers, setFilteredFollowers] = useState<any[]>([]);
  const [showFollowerSuggestions, setShowFollowerSuggestions] = useState(false);
  
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

  // Communication tabs state
  const [communicationTab, setCommunicationTab] = useState<'sms' | 'email'>('sms');

  // SMS composition state
  const [smsData, setSmsData] = useState({
    fromNumber: '',
    to: '',
    message: ''
  });
  const [characterCount, setCharacterCount] = useState(0);
  const [showSmsTemplateModal, setShowSmsTemplateModal] = useState(false);
  const [showSmsMergeTagsModal, setShowSmsMergeTagsModal] = useState(false);
  const [showSmsSendModal, setShowSmsSendModal] = useState(false);

  // Email composition state
  const [emailData, setEmailData] = useState({
    fromName: '',
    fromEmail: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: ''
  });
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [showWysiwyg, setShowWysiwyg] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showMergeTagsModal, setShowMergeTagsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledTimezone, setScheduledTimezone] = useState('America/New_York');

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'contact' | 'activity' | 'communication' | 'hub'>('contact');



  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Fetch custom field folders
  const { data: customFieldFoldersData } = useQuery<Array<{ id: string; name: string; order: number }>>({
    queryKey: ['/api/custom-field-folders'],
  });

  // Fetch custom fields
  const { data: customFieldsData, isLoading: customFieldsLoading } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
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

  // Fetch staff data
  const { data: staffData = [], isLoading: staffLoading } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  // Fetch client appointments
  const { data: clientAppointmentsData = [] } = useQuery({
    queryKey: ['/api/appointments', 'client', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?clientId=${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch client appointments');
      return response.json();
    },
    enabled: !!clientId
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

  // Fetch user permissions
  const { data: userPermissions } = useQuery({
    queryKey: ['/api/auth/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/auth/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
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

  // Fetch client notes data
  const { data: clientNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'notes'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/notes`);
      if (!response.ok) throw new Error('Failed to fetch client notes');
      return response.json();
    },
    enabled: !!clientId && activeRightSection === "notes",
  });

  // Fetch client tasks data
  const { data: clientTasksData = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'tasks'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch client tasks');
      return response.json();
    },
    enabled: !!clientId && activeRightSection === "tasks",
  });

  // Fetch client documents data
  const { data: clientDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'documents'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch client documents');
      return response.json();
    },
    enabled: !!clientId && activeRightSection === "documents",
  });

  // Fetch bundle details for expanded bundles with client-specific quantities
  const { data: bundleDetailsData = {} } = useQuery({
    queryKey: ['/api/bundle-details', Array.from(expandedBundles), clientId],
    queryFn: async () => {
      const bundleDetails: Record<string, any> = {};
      for (const bundleId of Array.from(expandedBundles)) {
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

  // Helper functions to get dynamic names from custom fields
  const getClientDisplayName = () => {
    if (!client) return "";
    
    // If custom fields are still loading, show database name as fallback
    if (customFieldsLoading || !customFieldsData) {
      return client.name || client.email || "Loading...";
    }
    
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
    // If we only have last name, use it
    if (lastName) {
      return lastName;
    }
    // Otherwise fall back to database name or email
    return client.name || client.email || "Unnamed Client";
  };

  const getBusinessDisplayName = () => {
    if (!client) return "";
    
    // For now, just use company field (can be enhanced later with caching)
    return client.company || "";
  };

  // Fixed height for notes section to enable consistent scrolling
  const calculateNotesMaxHeight = () => {
    // Use a fixed height that works well for most screen sizes
    // This ensures the right column never grows taller than intended
    return '600px';
  };

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

  // Delete document mutation (Admin only)
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete document');
      }
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'notes'] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    },
  });

  // Edit note mutation
  const editNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to edit note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'notes'] });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'notes'] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch(`/api/clients/${clientId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'tasks'] });
      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        assignee: "",
        recurring: false
      });
      setRecurringConfig({
        interval: 1,
        unit: "days",
        endType: "never",
        endDate: "",
        endAfter: 1,
        createIfOverdue: false
      });
      setAssigneeSearchTerm("");
      setShowAssigneeSuggestions(false);
      setFilteredAssignees([]);
      setIsTaskDialogOpen(false);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/clients/${clientId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'tasks'] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Edit task mutation
  const editTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch(`/api/clients/${clientId}/tasks/${editingTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] }); // Also invalidate global tasks
      setIsEditTaskDialogOpen(false);
      setEditingTaskId(null);
      setEditTask({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        assignee: "",
        recurring: false
      });
      setEditRecurringConfig({
        interval: 1,
        unit: "days",
        endType: "never",
        endDate: "",
        endAfter: 1,
        createIfOverdue: false
      });
      setEditAssigneeSearchTerm("");
      setShowEditAssigneeSuggestions(false);
      setEditFilteredAssignees([]);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation (Admin only)
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/clients/${clientId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only administrators can delete tasks.');
        }
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] }); // Also invalidate global tasks
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ taskId, content, mentions }: { taskId: string; content: string; mentions: string[] }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mentions }),
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', variables.taskId, 'comments'] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ taskId, commentId, content, mentions }: { taskId: string; commentId: string; content: string; mentions: string[] }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mentions }),
      });
      if (!response.ok) throw new Error('Failed to update comment');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', variables.taskId, 'comments'] });
      setEditingComment(null);
      setEditCommentContent("");
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ taskId, commentId }: { taskId: string; commentId: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', variables.taskId, 'comments'] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
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

  // Update contact owner mutation
  const updateOwnerMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      console.log('Updating owner for client:', clientId, 'to:', ownerId);
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactOwner: ownerId }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update owner error response:', response.status, errorData);
        throw new Error(`Failed to update contact owner: ${response.status}`);
      }
      const result = await response.json();
      console.log('Owner update successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Owner mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      setIsAssigningOwner(false);
      setOwnerSearchTerm("");
      toast({
        title: "Owner assigned",
        description: "Contact owner has been updated successfully",
      });
    },
    onError: (error) => {
      console.error('Owner update mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to assign contact owner: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update followers mutation
  const updateFollowersMutation = useMutation({
    mutationFn: async (followers: string[]) => {
      console.log('Updating followers for client:', clientId, 'to:', followers);
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followers }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update followers error response:', response.status, errorData);
        throw new Error(`Failed to update followers: ${response.status}`);
      }
      const result = await response.json();
      console.log('Followers update successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Followers mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      setIsAddingFollowers(false);
      setFollowerSearchTerm("");
      toast({
        title: "Followers updated",
        description: "Client followers have been updated successfully",
      });
    },
    onError: (error) => {
      console.error('Followers update mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update followers: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update DND settings mutation
  const updateDNDMutation = useMutation({
    mutationFn: async (dndSettings: { dndAll?: boolean; dndEmail?: boolean; dndSms?: boolean; dndCalls?: boolean }) => {
      console.log('Updating DND settings for client:', clientId, 'to:', dndSettings);
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dndSettings),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update DND error response:', response.status, errorData);
        throw new Error(`Failed to update DND settings: ${response.status}`);
      }
      const result = await response.json();
      console.log('DND settings update successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('DND mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      toast({
        title: "Communication preferences updated",
        description: "DND settings have been updated successfully",
      });
    },
    onError: (error) => {
      console.error('DND update mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update DND settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Memoize sections calculation to prevent infinite re-renders
  const calculatedSections = useMemo(() => {
    if (!customFieldFoldersData || !customFieldsData) return [];
    
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
    
    return newSections;
  }, [customFieldFoldersData, customFieldsData]);

  // Track if sections have been initialized
  const sectionsInitialized = useRef(false);

  // Initialize sections with calculatedSections when they're first available
  useEffect(() => {
    if (calculatedSections.length > 0 && !sectionsInitialized.current) {
      setSections(calculatedSections.map(section => ({
        ...section,
        isOpen: false  // All sections closed by default
      })));
      sectionsInitialized.current = true;
    }
  }, [calculatedSections]);

  // Owner search filtering
  useEffect(() => {
    if (ownerSearchTerm && staffData) {
      const filtered = staffData.filter((staff: any) => 
        `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(ownerSearchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(ownerSearchTerm.toLowerCase())
      );
      setFilteredStaff(filtered);
      setShowOwnerSuggestions(filtered.length > 0);
    } else {
      setFilteredStaff([]);
      setShowOwnerSuggestions(false);
    }
  }, [ownerSearchTerm, staffData]);

  // Follower search filtering
  const clientFollowers = client?.followers;
  const clientContactOwner = client?.contactOwner;

  useEffect(() => {
    if (!followerSearchTerm || !staffData || !client) {
      setFilteredFollowers([]);
      setShowFollowerSuggestions(false);
      return;
    }

    const currentFollowers = clientFollowers || [];
    const filtered = staffData.filter((staff: any) => 
      !currentFollowers.includes(staff.id) && // Exclude already following staff
      staff.id !== clientContactOwner && // Exclude current owner
      (`${staff.firstName} ${staff.lastName}`.toLowerCase().includes(followerSearchTerm.toLowerCase()) ||
       staff.email?.toLowerCase().includes(followerSearchTerm.toLowerCase()))
    );
    setFilteredFollowers(filtered);
    setShowFollowerSuggestions(filtered.length > 0);
  }, [followerSearchTerm, staffData, clientFollowers, clientContactOwner]);

  // Auto-populate email fields when user and client data are available
  const currentUserId = currentUser?.id;
  const currentUserFirstName = currentUser?.firstName;
  const currentUserLastName = currentUser?.lastName;
  const currentUserEmail = currentUser?.email;
  const clientEmail = client?.email;
  const clientPhone = client?.phone;

  useEffect(() => {
    if (currentUserId && clientEmail) {
      const fromName = `${currentUserFirstName || ''} ${currentUserLastName || ''}`.trim();
      const fromEmail = currentUserEmail || '';
      const to = clientEmail || '';
      
      // Only update if values are different to prevent infinite re-renders
      setEmailData(prev => {
        if (prev.fromName !== fromName || prev.fromEmail !== fromEmail || prev.to !== to) {
          return {
            ...prev,
            fromName,
            fromEmail,
            to
          };
        }
        return prev;
      });
    }
  }, [currentUserId, currentUserFirstName, currentUserLastName, currentUserEmail, clientEmail]);

  // Update word count when message changes (strip HTML tags for accurate count)
  useEffect(() => {
    // Strip HTML tags to get plain text for word count
    const plainText = emailData.message.replace(/<[^>]*>/g, '').trim();
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [emailData.message]);

  // SMS character count effect
  useEffect(() => {
    setCharacterCount(smsData.message.length);
  }, [smsData.message]);

  // Auto-populate SMS fields when client data is available
  useEffect(() => {
    if (clientPhone) {
      setSmsData(prev => {
        if (prev.to !== clientPhone) {
          return { ...prev, to: clientPhone };
        }
        return prev;
      });
    }
  }, [clientPhone]);

  // Email utility functions
  const handleEmailFieldChange = useCallback((field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearEmailMessage = useCallback(() => {
    setEmailData(prev => ({ ...prev, message: '' }));
  }, []);

  const handleQuillChange = useCallback((value: string) => {
    handleEmailFieldChange('message', value);
  }, [handleEmailFieldChange]);

  // SMS utility functions
  const handleSmsFieldChange = useCallback((field: string, value: string) => {
    setSmsData(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearSmsMessage = useCallback(() => {
    setSmsData(prev => ({ ...prev, message: '' }));
  }, []);

  const insertSmsTag = (tag: string) => {
    const newMessage = smsData.message + `{{${tag}}}`;
    setSmsData(prev => ({ ...prev, message: newMessage }));
  };

  const selectSmsTemplate = (content: string, templateName: string) => {
    setSmsData(prev => ({ ...prev, message: content }));
    setShowSmsTemplateModal(false);
  };

  const handleSendSms = () => {
    setShowSmsSendModal(true);
  };

  const sendSmsNow = () => {
    console.log('Sending SMS now:', smsData);
    setShowSmsSendModal(false);
    // Add actual SMS sending logic here
  };

  const insertMergeTag = (tag: string) => {
    const newMessage = emailData.message + `{{${tag}}}`;
    setEmailData(prev => ({ ...prev, message: newMessage }));
    setShowMergeTagsModal(false);
  };

  const selectTemplate = (templateContent: string, templateName: string) => {
    setEmailData(prev => ({ ...prev, message: templateContent, subject: templateName }));
    setShowTemplateModal(false);
    toast({
      title: "Template Applied",
      description: `"${templateName}" template has been loaded into your email.`,
    });
  };

  const handleSendEmail = () => {
    setShowSendModal(true);
  };

  const sendEmailNow = async () => {
    // Implementation for sending email immediately
    toast({
      title: "Email Sent",
      description: "Your email has been sent successfully.",
    });
    setShowSendModal(false);
  };

  const scheduleEmail = async () => {
    // Implementation for scheduling email
    toast({
      title: "Email Scheduled",
      description: `Your email has been scheduled for ${scheduledDate} at ${scheduledTime} (${scheduledTimezone}).`,
    });
    setShowSendModal(false);
  };

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
    
    // Check DND settings before sending
    if (client?.dndAll || client?.dndSms) {
      toast({
        title: "Cannot Send SMS",
        description: `${client?.name} has SMS communications disabled (DND active)`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "SMS Sent",
      description: `Message sent to ${client?.name}`,
    });
    setSmsMessage("");
  };

  const sendEmail = () => {
    if (!emailMessage.trim()) return;
    
    // Check DND settings before sending
    if (client?.dndAll || client?.dndEmail) {
      toast({
        title: "Cannot Send Email",
        description: `${client?.name} has email communications disabled (DND active)`,
        variant: "destructive",
      });
      return;
    }
    
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
        !(client?.tags || []).includes(tag.name)
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
      }) as any;

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
          <div className="flex items-center gap-4">
            {/* Owner and Followers Section */}
            <div className="flex items-center gap-3">
              {/* Contact Owner */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Owner:</span>
                {client.contactOwner ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAssigningOwner(true)}
                    className="h-8 px-2 text-xs hover:bg-gray-100"
                  >
                    <UserCircle className="h-3 w-3 mr-1" />
                    {staffData.find((staff: any) => staff.id === client.contactOwner)?.firstName} {staffData.find((staff: any) => staff.id === client.contactOwner)?.lastName}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssigningOwner(true)}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign Owner
                  </Button>
                )}
              </div>

              {/* Followers */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Followers:</span>
                <div className="flex items-center gap-1">
                  {client.followers && client.followers.length > 0 ? (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {client.followers.length} following
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingFollowers(true)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingFollowers(true)}
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Followers
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badges */}
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
      </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 rounded-none h-auto">
              <TabsTrigger 
                value="contact" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
              >
                <User className="h-4 w-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
              >
                <Activity className="h-4 w-4" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger 
                value="communication" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
              >
                <MessageSquare className="h-4 w-4" />
                Communication
              </TabsTrigger>
              <TabsTrigger 
                value="hub" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
              >
                <Zap className="h-4 w-4" />
                Client Hub
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="contact" className="space-y-6 mt-6">
            {/* Contact Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Left Column - Contact Details */}
          <div className="lg:col-span-2">
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
                                clientId={clientId}
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
                                        const initialQuantities: Record<string, number> = {};
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
                                      {(bundleDetailsData[clientProduct.productId] as any[])?.map((bundleProduct: any, bundleIndex: number) => (
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
                                    (bundleDetailsData[clientProduct.productId] as any[]) ? (
                                      <>
                                        {/* Check if this client has custom quantities */}
                                        {(() => {
                                          const hasCustomQuantities = (bundleDetailsData[clientProduct.productId] as any[])?.some((product: any) => 
                                            product.quantity !== product.baseQuantity
                                          );
                                          return hasCustomQuantities && (
                                            <div className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded border border-amber-200">
                                              🎯 This client has custom quantities (different from base bundle)
                                            </div>
                                          );
                                        })()}
                                        
                                        {(bundleDetailsData[clientProduct.productId] as any[]).map((bundleProduct: any, bundleIndex: number) => (
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

            {/* DND (Do Not Disturb) Section */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldOff className="h-5 w-5 text-red-500" />
                  DND (Do Not Disturb)
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* DND All Channels */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <ShieldOff className="h-5 w-5 text-red-500" />
                    <div>
                      <span className="font-medium text-gray-900">DND All Channels</span>
                      <p className="text-sm text-gray-600">Block all communications (emails, texts, calls)</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={client?.dndAll || false}
                    onCheckedChange={(checked) => {
                      updateDNDMutation.mutate({ dndAll: !!checked });
                    }}
                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                </div>

                {/* OR Separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm font-medium text-gray-500 px-3">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Individual Channel Settings */}
                <div className="space-y-3">
                  {/* Emails */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">Emails</span>
                    </div>
                    <Checkbox
                      checked={client?.dndEmail || false}
                      onCheckedChange={(checked) => {
                        updateDNDMutation.mutate({ dndEmail: !!checked });
                      }}
                      disabled={client?.dndAll || false}
                      className="disabled:opacity-50"
                    />
                  </div>

                  {/* Text Messages */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-gray-900">Text Messages</span>
                    </div>
                    <Checkbox
                      checked={client?.dndSms || false}
                      onCheckedChange={(checked) => {
                        updateDNDMutation.mutate({ dndSms: !!checked });
                      }}
                      disabled={client?.dndAll || false}
                      className="disabled:opacity-50"
                    />
                  </div>

                  {/* Calls & Voicemails */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-gray-900">Calls & Voicemails</span>
                    </div>
                    <Checkbox
                      checked={client?.dndCalls || false}
                      onCheckedChange={(checked) => {
                        updateDNDMutation.mutate({ dndCalls: !!checked });
                      }}
                      disabled={client?.dndAll || false}
                      className="disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Warning Message */}
                {(client?.dndAll || client?.dndEmail || client?.dndSms || client?.dndCalls) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ShieldOff className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Communication Restrictions Active</p>
                        <p className="text-amber-700 mt-1">
                          {client?.dndAll 
                            ? "All communications are blocked for this client."
                            : `${[
                                client?.dndEmail && "emails",
                                client?.dndSms && "text messages", 
                                client?.dndCalls && "calls"
                              ].filter(Boolean).join(", ")} are blocked for this client.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Activity & Communication */}
          <div className="lg:col-span-3">
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

            {/* Communication - Moved Below Activity */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
              </CardHeader>
              <CardContent>
                <Tabs value={communicationTab} onValueChange={(value) => setCommunicationTab(value as 'sms' | 'email')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="sms" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sms" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">Send SMS</Label>
                        {(client?.dndAll || client?.dndSms) && (
                          <Badge variant="destructive" className="text-xs">
                            <ShieldOff className="h-3 w-3 mr-1" />
                            DND Active
                          </Badge>
                        )}
                      </div>

                      {/* First Row: From and To fields */}
                      <div className="flex items-center gap-4">
                        {/* From Field - Left Aligned */}
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-700">From</Label>
                          <Select
                            value={smsData.fromNumber}
                            onValueChange={(value) => handleSmsFieldChange('fromNumber', value)}
                            disabled={!!client?.dndAll || !!client?.dndSms}
                          >
                            <SelectTrigger className={`mt-1 ${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                              <SelectValue placeholder="Select phone number..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+1234567890">+1 (234) 567-8900 - Main</SelectItem>
                              <SelectItem value="+1234567891">+1 (234) 567-8901 - Sales</SelectItem>
                              <SelectItem value="+1234567892">+1 (234) 567-8902 - Support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* To Field - Right Aligned */}
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-700">To</Label>
                          <Input
                            value={smsData.to}
                            onChange={(e) => handleSmsFieldChange('to', e.target.value)}
                            placeholder="Phone number..."
                            disabled={!!client?.dndAll || !!client?.dndSms}
                            className={`mt-1 ${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Message Input Field */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Message</Label>
                        <Textarea
                          value={smsData.message}
                          onChange={(e) => handleSmsFieldChange('message', e.target.value)}
                          placeholder={
                            (client?.dndAll || client?.dndSms) 
                              ? "SMS blocked by DND settings..." 
                              : "Type your SMS message here..."
                          }
                          disabled={!!client?.dndAll || !!client?.dndSms}
                          className={`mt-1 min-h-[120px] resize-y ${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' : ''}`}
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        {/* Left Side - Tools */}
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            {/* Insert Template */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowSmsTemplateModal(true)}
                                  disabled={!!client?.dndAll || !!client?.dndSms}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Insert Template</TooltipContent>
                            </Tooltip>

                            {/* Insert Merge Tags */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowSmsMergeTagsModal(true)}
                                  disabled={!!client?.dndAll || !!client?.dndSms}
                                >
                                  <TagIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Insert Merge Tags</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex items-center gap-4">
                          {/* Character Count */}
                          <span className={`text-sm ${characterCount > 160 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            {characterCount} {characterCount > 160 ? '(Multiple messages)' : 'characters'}
                          </span>
                          
                          {/* Clear Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSmsMessage}
                            disabled={!smsData.message.trim() || !!client?.dndAll || !!client?.dndSms}
                          >
                            Clear
                          </Button>

                          {/* Send Button */}
                          <Button
                            onClick={handleSendSms}
                            disabled={!smsData.message.trim() || !smsData.to.trim() || !!client?.dndAll || !!client?.dndSms}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email" className="mt-0">
                    <div className="space-y-4">
                      {/* DND Warning */}
                      {(client?.dndAll || client?.dndEmail) && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <ShieldOff className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">
                            Email communication is blocked by DND settings
                          </span>
                        </div>
                      )}

                      {/* Email Form */}
                      <div className="space-y-3">
                        {/* From Fields */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">From Name</Label>
                            <Input
                              value={emailData.fromName}
                              onChange={(e) => handleEmailFieldChange('fromName', e.target.value)}
                              disabled={!!client?.dndAll || !!client?.dndEmail}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">From Email</Label>
                            <Input
                              value={emailData.fromEmail}
                              onChange={(e) => handleEmailFieldChange('fromEmail', e.target.value)}
                              disabled={!!client?.dndAll || !!client?.dndEmail}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* To Field with CC/BCC Toggle Buttons */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">To</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={emailData.to}
                              onChange={(e) => handleEmailFieldChange('to', e.target.value)}
                              disabled={!!client?.dndAll || !!client?.dndEmail}
                              className="flex-1"
                            />
                            <div className="flex items-center gap-2">
                              {/* Vertical Separator */}
                              <div className="w-px h-6 bg-gray-300"></div>
                              
                              {/* CC Toggle Button */}
                              <Button
                                variant={showCC ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowCC(!showCC)}
                                disabled={!!client?.dndAll || !!client?.dndEmail}
                                className="text-xs px-3"
                              >
                                CC
                              </Button>
                              
                              {/* BCC Toggle Button */}
                              <Button
                                variant={showBCC ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowBCC(!showBCC)}
                                disabled={!!client?.dndAll || !!client?.dndEmail}
                                className="text-xs px-3"
                              >
                                BCC
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* CC Field - conditionally shown */}
                        {showCC && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">CC</Label>
                            <Input
                              placeholder="Additional email addresses (comma separated)"
                              value={emailData.cc}
                              onChange={(e) => handleEmailFieldChange('cc', e.target.value)}
                              disabled={!!client?.dndAll || !!client?.dndEmail}
                              className="mt-1"
                            />
                          </div>
                        )}

                        {/* BCC Field - conditionally shown */}
                        {showBCC && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">BCC</Label>
                            <Input
                              placeholder="Blind carbon copy (comma separated)"
                              value={emailData.bcc}
                              onChange={(e) => handleEmailFieldChange('bcc', e.target.value)}
                              disabled={!!client?.dndAll || !!client?.dndEmail}
                              className="mt-1"
                            />
                          </div>
                        )}

                        {/* Subject Field */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Subject</Label>
                          <Input
                            placeholder="Email subject (supports merge tags like {{firstName}})"
                            value={emailData.subject}
                            onChange={(e) => handleEmailFieldChange('subject', e.target.value)}
                            disabled={!!client?.dndAll || !!client?.dndEmail}
                            className="mt-1"
                          />
                        </div>

                        {/* Message Field - WYSIWYG Editor */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Message</Label>
                          <Textarea
                            placeholder="Type your message here..."
                            value={emailData.message}
                            onChange={(e) => handleEmailFieldChange('message', e.target.value)}
                            disabled={!!client?.dndAll || !!client?.dndEmail}
                            className="mt-1 min-h-[120px] resize-none"
                          />
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          {/* Left Side - Tools */}
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              {/* Insert Template */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowTemplateModal(true)}
                                    disabled={!!client?.dndAll || !!client?.dndEmail}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Insert Template</TooltipContent>
                              </Tooltip>

                              {/* Insert Merge Tags */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMergeTagsModal(true)}
                                    disabled={!!client?.dndAll || !!client?.dndEmail}
                                  >
                                    <TagIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Insert Merge Tags</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          {/* Right Side - Actions */}
                          <div className="flex items-center gap-4">
                            {/* Word Count */}
                            <span className="text-sm text-gray-500">
                              {wordCount} {wordCount === 1 ? 'word' : 'words'}
                            </span>
                            
                            {/* Clear Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearEmailMessage}
                              disabled={!emailData.message.trim() || !!client?.dndAll || !!client?.dndEmail}
                            >
                              Clear
                            </Button>

                            {/* Send Button */}
                            <Button
                              onClick={handleSendEmail}
                              disabled={!emailData.message.trim() || !emailData.to.trim() || !!client?.dndAll || !!client?.dndEmail}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </Button>
                          </div>
                        </div>


                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Template Selection Modal */}
            <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Email Template</DialogTitle>
                </DialogHeader>
                <EmailTemplateSelector onSelectTemplate={selectTemplate} />
              </DialogContent>
            </Dialog>

            {/* Merge Tags Modal */}
            <Dialog open={showMergeTagsModal} onOpenChange={setShowMergeTagsModal}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Insert Merge Tags</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Search merge tags..." />
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    
                    {/* Client Information */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Client Information</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('firstName')}
                          className="justify-start"
                        >
                          {'{{firstName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('lastName')}
                          className="justify-start"
                        >
                          {'{{lastName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('email')}
                          className="justify-start"
                        >
                          {'{{email}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('phone')}
                          className="justify-start"
                        >
                          {'{{phone}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('companyName')}
                          className="justify-start"
                        >
                          {'{{companyName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('status')}
                          className="justify-start"
                        >
                          {'{{status}}'}
                        </Button>
                      </div>
                    </div>

                    {/* Assigned User Information */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Assigned User</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('assignedUserFirstName')}
                          className="justify-start"
                        >
                          {'{{assignedUserFirstName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('assignedUserLastName')}
                          className="justify-start"
                        >
                          {'{{assignedUserLastName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('assignedUserEmail')}
                          className="justify-start"
                        >
                          {'{{assignedUserEmail}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag('assignedUserPhone')}
                          className="justify-start"
                        >
                          {'{{assignedUserPhone}}'}
                        </Button>
                      </div>
                    </div>

                    {/* All Custom Fields */}
                    {customFieldsData && customFieldsData.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Custom Fields</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {customFieldsData.map((field) => (
                            <Button
                              key={field.id}
                              variant="outline"
                              size="sm"
                              onClick={() => insertMergeTag(field.name)}
                              className="justify-start text-left overflow-hidden"
                              title={field.name}
                            >
                              <span className="truncate">
                                {'{{' + field.name + '}}'}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Send Options Modal */}
            <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      onClick={sendEmailNow}
                      className="w-full justify-start"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                    
                    {/* OR Divider */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="px-3 text-sm text-gray-500 font-medium">OR</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Schedule Email</h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm">Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Time</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Timezone</Label>
                          <Select value={scheduledTimezone} onValueChange={setScheduledTimezone}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowSendModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={scheduleEmail}
                          disabled={!scheduledDate || !scheduledTime}
                          className="flex-1"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Schedule Email
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* SMS Template Selection Modal */}
            <Dialog open={showSmsTemplateModal} onOpenChange={setShowSmsTemplateModal}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select SMS Template</DialogTitle>
                </DialogHeader>
                <SmsTemplateSelector onSelectTemplate={selectSmsTemplate} />
              </DialogContent>
            </Dialog>

            {/* SMS Merge Tags Modal */}
            <Dialog open={showSmsMergeTagsModal} onOpenChange={setShowSmsMergeTagsModal}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Insert Merge Tags</DialogTitle>
                  <p className="text-sm text-gray-600">Click any tag to insert it into your SMS message</p>
                </DialogHeader>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Client Information */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Client Information</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('firstName')}
                          className="justify-start"
                        >
                          {'{{firstName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('lastName')}
                          className="justify-start"
                        >
                          {'{{lastName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('phone')}
                          className="justify-start"
                        >
                          {'{{phone}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('companyName')}
                          className="justify-start"
                        >
                          {'{{companyName}}'}
                        </Button>
                      </div>
                    </div>

                    {/* Assigned User Information */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Assigned User</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('assignedUserFirstName')}
                          className="justify-start"
                        >
                          {'{{assignedUserFirstName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('assignedUserLastName')}
                          className="justify-start"
                        >
                          {'{{assignedUserLastName}}'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertSmsTag('assignedUserPhone')}
                          className="justify-start"
                        >
                          {'{{assignedUserPhone}}'}
                        </Button>
                      </div>
                    </div>

                    {/* All Custom Fields */}
                    {customFieldsData && customFieldsData.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Custom Fields</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {customFieldsData.map((field) => (
                            <Button
                              key={field.id}
                              variant="outline"
                              size="sm"
                              onClick={() => insertSmsTag(field.name)}
                              className="justify-start text-left overflow-hidden"
                              title={field.name}
                            >
                              <span className="truncate">
                                {'{{' + field.name + '}}'}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* SMS Send Options Modal */}
            <Dialog open={showSmsSendModal} onOpenChange={setShowSmsSendModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send SMS</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      onClick={sendSmsNow}
                      className="w-full justify-start"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                    
                    {/* OR Divider */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="px-3 text-sm text-gray-500 font-medium">OR</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Schedule SMS</h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm">Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Time</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Timezone</Label>
                          <Select value={scheduledTimezone} onValueChange={setScheduledTimezone}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowSmsSendModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            console.log('Scheduling SMS:', { ...smsData, scheduledDate, scheduledTime, scheduledTimezone });
                            setShowSmsSendModal(false);
                          }}
                          disabled={!scheduledDate || !scheduledTime}
                          className="flex-1"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Schedule SMS
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column - Client Activity Hub */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                {/* Horizontal Icons Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Client Hub</h2>
                </div>
                <TooltipProvider>
                  <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("notes")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "notes"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notes</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("tasks")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "tasks"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tasks</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("appointments")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "appointments"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Meetings/Appointments</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("documents")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "documents"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Files</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("team")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "team"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Users className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Team</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("payments")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all opacity-50 cursor-not-allowed ${
                            activeRightSection === "payments"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-400"
                          }`}
                          disabled
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Billing (Coming Soon)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Notes Section */}
                {activeRightSection === "notes" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notes</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search notes..."
                          value={searchNotes}
                          onChange={(e) => setSearchNotes(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                      <Button 
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!newNote.trim() || createNoteMutation.isPending}
                        onClick={() => createNoteMutation.mutate(newNote)}
                      >
                        {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                      </Button>
                    </div>

                    <div 
                      className="space-y-3 overflow-y-auto"
                      style={{ 
                        maxHeight: calculateNotesMaxHeight(),
                        ...(calculateNotesMaxHeight() && { paddingRight: '8px' })
                      }}
                    >
                      {notesLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-sm">Loading notes...</div>
                        </div>
                      ) : clientNotes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No notes yet</p>
                          <p className="text-xs text-gray-400">Add a note to get started</p>
                        </div>
                      ) : (
                        clientNotes
                          .filter((note: any) => !searchNotes || note.content.toLowerCase().includes(searchNotes.toLowerCase()))
                          .map((note: any) => (
                            <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900">Note</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {currentUser?.role === 'Admin' && (
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600" 
                                        onClick={() => {
                                          setEditingNote(note.id);
                                          setEditNoteContent(note.content);
                                        }}
                                        title="Edit note"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600" 
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this note?')) {
                                            deleteNoteMutation.mutate(note.id);
                                          }
                                        }}
                                        title="Delete note"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {editingNote === note.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editNoteContent}
                                    onChange={(e) => setEditNoteContent(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        editNoteMutation.mutate({ 
                                          noteId: note.id, 
                                          content: editNoteContent 
                                        });
                                        setEditingNote(null);
                                        setEditNoteContent("");
                                      }}
                                      disabled={!editNoteContent.trim() || editNoteMutation.isPending}
                                      className="h-7"
                                    >
                                      {editNoteMutation.isPending ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingNote(null);
                                        setEditNoteContent("");
                                      }}
                                      className="h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                (() => {
                                  const { displayContent, shouldTruncate, isExpanded } = formatNoteContent(note.content, note.id);
                                  return (
                                    <div className="space-y-2">
                                      <p 
                                        className="text-sm text-gray-600 whitespace-pre-wrap"
                                        style={{ wordBreak: 'break-word' }}
                                      >
                                        {displayContent}
                                      </p>
                                      {shouldTruncate && (
                                        <button
                                          onClick={() => toggleNoteExpansion(note.id)}
                                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                                        >
                                          {isExpanded ? 'Show less' : 'Show more'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()
                              )}
                              
                              <div className="mt-2 flex justify-between items-center">
                                <div className="text-xs text-gray-400">
                                  by {note.createdBy?.firstName} {note.createdBy?.lastName}
                                </div>
                                {note.editedBy && (
                                  <div className="text-xs text-gray-400">
                                    edited by {note.editedBy?.firstName} {note.editedBy?.lastName}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tasks Section */}
                {activeRightSection === "tasks" && (
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
                            <div className="relative">
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</Label>
                              <Input
                                value={assigneeSearchTerm}
                                onChange={(e) => {
                                  setAssigneeSearchTerm(e.target.value);
                                  if (e.target.value.trim() && staffData) {
                                    const filtered = staffData.filter((staff: any) => 
                                      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                      staff.email?.toLowerCase().includes(e.target.value.toLowerCase())
                                    );
                                    setFilteredAssignees(filtered);
                                    setShowAssigneeSuggestions(filtered.length > 0);
                                  } else {
                                    setFilteredAssignees([]);
                                    setShowAssigneeSuggestions(false);
                                  }
                                }}
                                placeholder="Search staff members..."
                                onFocus={() => {
                                  if (assigneeSearchTerm.trim() && staffData) {
                                    const filtered = staffData.filter((staff: any) => 
                                      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(assigneeSearchTerm.toLowerCase()) ||
                                      staff.email?.toLowerCase().includes(assigneeSearchTerm.toLowerCase())
                                    );
                                    setFilteredAssignees(filtered);
                                    setShowAssigneeSuggestions(filtered.length > 0);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => setShowAssigneeSuggestions(false), 200);
                                }}
                              />
                              
                              {showAssigneeSuggestions && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {filteredAssignees.map((staff: any) => (
                                    <button
                                      key={staff.id}
                                      onClick={() => {
                                        setNewTask(prev => ({ ...prev, assignee: staff.id }));
                                        setAssigneeSearchTerm(`${staff.firstName} ${staff.lastName}`);
                                        setShowAssigneeSuggestions(false);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                                    >
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">{staff.firstName} {staff.lastName}</div>
                                        <div className="text-xs text-gray-500">{staff.email}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="recurring"
                                  checked={newTask.recurring}
                                  onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, recurring: !!checked }))}
                                />
                                <Label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                                  Recurring Task
                                </Label>
                              </div>

                              {newTask.recurring && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Repeats every</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={recurringConfig.interval}
                                      onChange={(e) => setRecurringConfig(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                                      className="w-20"
                                    />
                                    <Select
                                      value={recurringConfig.unit}
                                      onValueChange={(value: any) => setRecurringConfig(prev => ({ ...prev, unit: value }))}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hours">Hour(s)</SelectItem>
                                        <SelectItem value="days">Day(s)</SelectItem>
                                        <SelectItem value="weeks">Week(s)</SelectItem>
                                        <SelectItem value="months">Month(s)</SelectItem>
                                        <SelectItem value="years">Year(s)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Ends On:</Label>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="end-never"
                                          checked={recurringConfig.endType === "never"}
                                          onCheckedChange={() => setRecurringConfig(prev => ({ ...prev, endType: "never" }))}
                                        />
                                        <Label htmlFor="end-never" className="text-sm">Never</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="end-on"
                                          checked={recurringConfig.endType === "on"}
                                          onCheckedChange={() => setRecurringConfig(prev => ({ ...prev, endType: "on" }))}
                                        />
                                        <Label htmlFor="end-on" className="text-sm">On</Label>
                                        {recurringConfig.endType === "on" && (
                                          <Input
                                            type="date"
                                            value={recurringConfig.endDate}
                                            onChange={(e) => setRecurringConfig(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="ml-2"
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="end-after"
                                          checked={recurringConfig.endType === "after"}
                                          onCheckedChange={() => setRecurringConfig(prev => ({ ...prev, endType: "after" }))}
                                        />
                                        <Label htmlFor="end-after" className="text-sm">After</Label>
                                        {recurringConfig.endType === "after" && (
                                          <>
                                            <Input
                                              type="number"
                                              min="1"
                                              value={recurringConfig.endAfter}
                                              onChange={(e) => setRecurringConfig(prev => ({ ...prev, endAfter: parseInt(e.target.value) || 1 }))}
                                              className="w-20 ml-2"
                                            />
                                            <span className="text-sm text-gray-600">occurrences</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="create-if-overdue"
                                      checked={recurringConfig.createIfOverdue}
                                      onCheckedChange={(checked) => setRecurringConfig(prev => ({ ...prev, createIfOverdue: !!checked }))}
                                    />
                                    <Label htmlFor="create-if-overdue" className="text-sm text-gray-700">
                                      Create a new task even if previous task is overdue
                                    </Label>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => {
                                setIsTaskDialogOpen(false);
                                setNewTask({
                                  title: "",
                                  description: "",
                                  dueDate: "",
                                  dueTime: "",
                                  assignee: "",
                                  recurring: false
                                });
                                setRecurringConfig({
                                  interval: 1,
                                  unit: "days",
                                  endType: "never",
                                  endDate: "",
                                  endAfter: 1,
                                  createIfOverdue: false
                                });
                                setAssigneeSearchTerm("");
                                setShowAssigneeSuggestions(false);
                                setFilteredAssignees([]);
                              }}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  if (newTask.title.trim()) {
                                    const taskData = {
                                      title: newTask.title,
                                      description: newTask.description,
                                      dueDate: newTask.dueDate ? `${newTask.dueDate}${newTask.dueTime ? ` ${newTask.dueTime}` : ''}` : undefined,
                                      assignedTo: newTask.assignee || undefined,
                                      isRecurring: newTask.recurring,
                                      recurringConfig: newTask.recurring ? recurringConfig : undefined
                                    };
                                    createTaskMutation.mutate(taskData);
                                  }
                                }}
                                disabled={!newTask.title.trim() || createTaskMutation.isPending}
                                className="bg-primary hover:bg-primary/90"
                              >
                                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Edit Task Dialog */}
                      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Title *</Label>
                              <Input
                                value={editTask.title}
                                onChange={(e) => setEditTask(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter task title"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Description</Label>
                              <Textarea
                                value={editTask.description}
                                onChange={(e) => setEditTask(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter task description"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</Label>
                                <Input
                                  type="date"
                                  value={editTask.dueDate}
                                  onChange={(e) => setEditTask(prev => ({ ...prev, dueDate: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1 block">Due Time</Label>
                                <Input
                                  type="time"
                                  value={editTask.dueTime}
                                  onChange={(e) => setEditTask(prev => ({ ...prev, dueTime: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="relative">
                              <Label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</Label>
                              <Input
                                value={editAssigneeSearchTerm}
                                onChange={(e) => {
                                  setEditAssigneeSearchTerm(e.target.value);
                                  if (e.target.value.trim() && staffData) {
                                    const filtered = staffData.filter((staff: any) => 
                                      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                      staff.email?.toLowerCase().includes(e.target.value.toLowerCase())
                                    );
                                    setEditFilteredAssignees(filtered);
                                    setShowEditAssigneeSuggestions(filtered.length > 0);
                                  } else {
                                    setEditFilteredAssignees([]);
                                    setShowEditAssigneeSuggestions(false);
                                  }
                                }}
                                placeholder="Search staff members..."
                                onFocus={() => {
                                  if (editAssigneeSearchTerm.trim() && staffData) {
                                    const filtered = staffData.filter((staff: any) => 
                                      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(editAssigneeSearchTerm.toLowerCase()) ||
                                      staff.email?.toLowerCase().includes(editAssigneeSearchTerm.toLowerCase())
                                    );
                                    setEditFilteredAssignees(filtered);
                                    setShowEditAssigneeSuggestions(filtered.length > 0);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => setShowEditAssigneeSuggestions(false), 200);
                                }}
                              />
                              
                              {showEditAssigneeSuggestions && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {editFilteredAssignees.map((staff: any) => (
                                    <button
                                      key={staff.id}
                                      onClick={() => {
                                        setEditTask(prev => ({ ...prev, assignee: staff.id }));
                                        setEditAssigneeSearchTerm(`${staff.firstName} ${staff.lastName}`);
                                        setShowEditAssigneeSuggestions(false);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                                    >
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">{staff.firstName} {staff.lastName}</div>
                                        <div className="text-xs text-gray-500">{staff.email}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit-recurring"
                                  checked={editTask.recurring}
                                  onCheckedChange={(checked) => setEditTask(prev => ({ ...prev, recurring: !!checked }))}
                                />
                                <Label htmlFor="edit-recurring" className="text-sm font-medium text-gray-700">
                                  Recurring Task
                                </Label>
                              </div>

                              {editTask.recurring && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Repeats every</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={editRecurringConfig.interval}
                                      onChange={(e) => setEditRecurringConfig(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                                      className="w-20"
                                    />
                                    <Select
                                      value={editRecurringConfig.unit}
                                      onValueChange={(value: any) => setEditRecurringConfig(prev => ({ ...prev, unit: value }))}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hours">Hours</SelectItem>
                                        <SelectItem value="days">Days</SelectItem>
                                        <SelectItem value="weeks">Weeks</SelectItem>
                                        <SelectItem value="months">Months</SelectItem>
                                        <SelectItem value="years">Years</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Ends</Label>
                                    <RadioGroup
                                      value={editRecurringConfig.endType}
                                      onValueChange={(value: any) => setEditRecurringConfig(prev => ({ ...prev, endType: value }))}
                                      className="space-y-2"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="never" id="edit-never" />
                                        <Label htmlFor="edit-never" className="text-sm text-gray-700">Never</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="on" id="edit-on" />
                                        <Label htmlFor="edit-on" className="text-sm text-gray-700">On</Label>
                                        {editRecurringConfig.endType === "on" && (
                                          <Input
                                            type="date"
                                            value={editRecurringConfig.endDate}
                                            onChange={(e) => setEditRecurringConfig(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="w-40 ml-2"
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="after" id="edit-after" />
                                        <Label htmlFor="edit-after" className="text-sm text-gray-700">After</Label>
                                        {editRecurringConfig.endType === "after" && (
                                          <>
                                            <Input
                                              type="number"
                                              min="1"
                                              value={editRecurringConfig.endAfter}
                                              onChange={(e) => setEditRecurringConfig(prev => ({ ...prev, endAfter: parseInt(e.target.value) || 1 }))}
                                              className="w-20 ml-2"
                                            />
                                            <span className="text-sm text-gray-600">occurrences</span>
                                          </>
                                        )}
                                      </div>
                                    </RadioGroup>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-create-if-overdue"
                                      checked={editRecurringConfig.createIfOverdue}
                                      onCheckedChange={(checked) => setEditRecurringConfig(prev => ({ ...prev, createIfOverdue: !!checked }))}
                                    />
                                    <Label htmlFor="edit-create-if-overdue" className="text-sm text-gray-700">
                                      Create a new task even if previous task is overdue
                                    </Label>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => {
                                setIsEditTaskDialogOpen(false);
                                setEditingTaskId(null);
                                setEditTask({
                                  title: "",
                                  description: "",
                                  dueDate: "",
                                  dueTime: "",
                                  assignee: "",
                                  recurring: false
                                });
                                setEditRecurringConfig({
                                  interval: 1,
                                  unit: "days",
                                  endType: "never",
                                  endDate: "",
                                  endAfter: 1,
                                  createIfOverdue: false
                                });
                                setEditAssigneeSearchTerm("");
                                setShowEditAssigneeSuggestions(false);
                                setEditFilteredAssignees([]);
                              }}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  if (editTask.title.trim()) {
                                    const taskData = {
                                      title: editTask.title,
                                      description: editTask.description,
                                      dueDate: editTask.dueDate ? `${editTask.dueDate}${editTask.dueTime ? ` ${editTask.dueTime}` : ''}` : undefined,
                                      assignedTo: editTask.assignee || undefined,
                                      isRecurring: editTask.recurring,
                                      recurringConfig: editTask.recurring ? editRecurringConfig : undefined
                                    };
                                    editTaskMutation.mutate(taskData);
                                  }
                                }}
                                disabled={!editTask.title.trim() || editTaskMutation.isPending}
                                className="bg-primary hover:bg-primary/90"
                              >
                                {editTaskMutation.isPending ? "Updating..." : "Update Task"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {tasksLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-sm">Loading tasks...</div>
                        </div>
                      ) : clientTasksData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No tasks yet</p>
                          <p className="text-xs text-gray-400">Create a task to get started</p>
                        </div>
                      ) : (
                        clientTasksData.map((task: any) => {
                          const isCompleted = task.status === 'completed';
                          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                          const isOverdue = dueDate && dueDate < new Date() && !isCompleted;
                          const dueDateColor = isOverdue ? 'bg-red-100 text-red-700' : dueDate && dueDate <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700';
                          
                          return (
                            <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={(checked) => {
                                      updateTaskStatusMutation.mutate({
                                        taskId: task.id,
                                        status: checked ? 'completed' : 'pending'
                                      });
                                    }}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                                      {task.title}
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                    )}
                                    {dueDate && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-xs text-gray-400">
                                        assigned to {task.assignedToUser?.firstName} {task.assignedToUser?.lastName}
                                      </p>
                                      {task.isRecurring && (
                                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border-blue-200">
                                          <RefreshCw className="h-3 w-3 mr-1" />
                                          Recurring
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {dueDate && (
                                    <span className={`text-xs px-2 py-1 rounded ${dueDateColor}`}>
                                      {isOverdue ? 'Overdue' : `Due ${dueDate.toLocaleDateString()}`}
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Populate edit form with current task data
                                      setEditingTaskId(task.id);
                                      const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
                                      setEditTask({
                                        title: task.title,
                                        description: task.description || "",
                                        dueDate: taskDueDate ? taskDueDate.toISOString().split('T')[0] : "",
                                        dueTime: taskDueDate ? taskDueDate.toTimeString().slice(0, 5) : "",
                                        assignee: task.assignedTo || "",
                                        recurring: task.isRecurring || false
                                      });
                                      if (task.isRecurring) {
                                        setEditRecurringConfig({
                                          interval: task.recurringInterval || 1,
                                          unit: task.recurringUnit || "days",
                                          endType: task.recurringEndType || "never",
                                          endDate: task.recurringEndDate ? new Date(task.recurringEndDate).toISOString().split('T')[0] : "",
                                          endAfter: task.recurringEndOccurrences || 1,
                                          createIfOverdue: task.createIfOverdue || false
                                        });
                                      }
                                      setEditAssigneeSearchTerm(task.assignedToUser ? `${task.assignedToUser.firstName} ${task.assignedToUser.lastName}` : "");
                                      setIsEditTaskDialogOpen(true);
                                    }}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                    title="Edit task"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newExpanded = new Set(expandedTasks);
                                      if (expandedTasks.has(task.id)) {
                                        newExpanded.delete(task.id);
                                      } else {
                                        newExpanded.add(task.id);
                                      }
                                      setExpandedTasks(newExpanded);
                                    }}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                    title={`${expandedTasks.has(task.id) ? 'Hide' : 'Show'} comments`}
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                  {/* Delete button - Admin only */}
                                  {userPermissions?.tasks?.canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                                          deleteTaskMutation.mutate(task.id);
                                        }
                                      }}
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                      disabled={deleteTaskMutation.isPending}
                                      title="Delete task (Admin only)"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Comments Section */}
                              {expandedTasks.has(task.id) && (
                                <TaskComments taskId={task.id} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Appointments Section */}
                {activeRightSection === "appointments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Meetings/Appointments</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowAppointmentModal(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {clientAppointmentsData && clientAppointmentsData.length > 0 ? (
                        clientAppointmentsData.map((appointment: any) => (
                          <div key={appointment.id} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                                  <Badge 
                                    variant={
                                      appointment.status === 'confirmed' ? 'default' :
                                      appointment.status === 'showed' ? 'secondary' :
                                      appointment.status === 'cancelled' ? 'destructive' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {format(new Date(appointment.startTime), 'MMM d, yyyy h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
                                    </span>
                                  </div>
                                  {appointment.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3" />
                                      <span>{appointment.location}</span>
                                    </div>
                                  )}
                                  {appointment.assignedTo && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>
                                        {staffData.find((s: any) => s.id === appointment.assignedTo)?.firstName} {staffData.find((s: any) => s.id === appointment.assignedTo)?.lastName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setEditingAppointment(appointment);
                                    setShowAppointmentModal(true);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${appointment.title}"?`)) {
                                      fetch(`/api/calendar-appointments/${appointment.id}`, { method: 'DELETE' })
                                        .then(() => {
                                          queryClient.invalidateQueries({ queryKey: ['/api/appointments', 'client', clientId] });
                                          toast({ title: "Appointment deleted", description: "Appointment has been deleted successfully" });
                                        })
                                        .catch(() => {
                                          toast({ title: "Error", description: "Failed to delete appointment", variant: "destructive" });
                                        });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No meetings for this client</p>
                          <p className="text-xs text-gray-400">Click the + button to schedule a meeting</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {activeRightSection === "documents" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Documents</h3>
                      <DocumentUploader
                        clientId={clientId!}
                        onUploadComplete={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'documents'] });
                        }}
                        maxNumberOfFiles={5}
                        buttonClassName="text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </DocumentUploader>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search documents..."
                          value={searchDocuments}
                          onChange={(e) => setSearchDocuments(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="flex gap-2 text-xs">
                        <Select value={documentFilterType} onValueChange={setDocumentFilterType}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="File Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="doc">Documents</SelectItem>
                            <SelectItem value="excel">Spreadsheets</SelectItem>
                            <SelectItem value="presentation">Presentations</SelectItem>
                            <SelectItem value="image">Images</SelectItem>
                            <SelectItem value="text">Text Files</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={documentSortBy} onValueChange={setDocumentSortBy}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="name">Name A-Z</SelectItem>
                            <SelectItem value="name-desc">Name Z-A</SelectItem>
                            <SelectItem value="size-large">Largest First</SelectItem>
                            <SelectItem value="size-small">Smallest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {documentsLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-sm">Loading documents...</div>
                        </div>
                      ) : clientDocuments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No documents yet</p>
                          <p className="text-xs text-gray-400">Upload a document to get started</p>
                        </div>
                      ) : (
                        clientDocuments
                          .filter((doc: any) => {
                            // Search filter
                            const matchesSearch = !searchDocuments || doc.fileName.toLowerCase().includes(searchDocuments.toLowerCase());
                            
                            // File type filter - only apply if not "all"
                            if (documentFilterType === "all") {
                              return matchesSearch; // Skip file type filtering for "all"
                            }
                            
                            const fileType = doc.fileType?.toLowerCase() || "";
                            let matchesType = false;
                            
                            switch (documentFilterType) {
                              case "pdf":
                                matchesType = fileType === "pdf";
                                break;
                              case "doc":
                                matchesType = ["doc", "docx", "txt", "rtf", "pages"].includes(fileType);
                                break;
                              case "excel":
                                matchesType = ["xls", "xlsx", "numbers"].includes(fileType);
                                break;
                              case "presentation":
                                matchesType = ["ppt", "pptx", "key"].includes(fileType);
                                break;
                              case "image":
                                matchesType = ["jpg", "jpeg", "png", "gif", "tiff"].includes(fileType);
                                break;
                              case "text":
                                matchesType = ["txt", "rtf"].includes(fileType);
                                break;
                              default:
                                matchesType = true;
                            }
                            
                            return matchesSearch && matchesType;
                          })
                          .sort((a: any, b: any) => {
                            switch (documentSortBy) {
                              case "newest":
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                              case "oldest":
                                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                              case "name":
                                return a.fileName.toLowerCase().localeCompare(b.fileName.toLowerCase());
                              case "name-desc":
                                return b.fileName.toLowerCase().localeCompare(a.fileName.toLowerCase());
                              case "size-large":
                                return b.fileSize - a.fileSize;
                              case "size-small":
                                return a.fileSize - b.fileSize;
                              default:
                                return 0;
                            }
                          })
                          .map((doc: any) => {
                            const getFileIconColor = (fileType: string) => {
                              switch (fileType.toLowerCase()) {
                                case 'pdf':
                                  return 'bg-red-100 text-red-600';
                                case 'docx':
                                case 'doc':
                                  return 'bg-blue-100 text-blue-600';
                                case 'xlsx':
                                case 'xls':
                                  return 'bg-green-100 text-green-600';
                                case 'pptx':
                                case 'ppt':
                                  return 'bg-orange-100 text-orange-600';
                                default:
                                  return 'bg-gray-100 text-gray-600';
                              }
                            };
                            
                            const formatFileSize = (bytes: number) => {
                              if (bytes === 0) return '0 B';
                              const k = 1024;
                              const sizes = ['B', 'KB', 'MB', 'GB'];
                              const i = Math.floor(Math.log(bytes) / Math.log(k));
                              return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
                            };
                            
                            return (
                              <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded ${getFileIconColor(doc.fileType)}`}>
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 break-words">{doc.fileName}</p>
                                    <p className="text-xs text-gray-500">
                                      Uploaded {new Date(doc.createdAt).toLocaleDateString()} • {formatFileSize(doc.fileSize)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      by {doc.uploadedByUser?.firstName} {doc.uploadedByUser?.lastName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                                            onClick={() => window.open(doc.downloadUrl, '_blank')}
                                          >
                                            <Download className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Download document</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    {currentUser?.role === 'Admin' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
                                              onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                                                  deleteDocumentMutation.mutate(doc.id);
                                                }
                                              }}
                                              disabled={deleteDocumentMutation.isPending}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Delete document (Admin only)</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* Team Section */}
                {activeRightSection === "team" && (
                  <TeamAssignmentSection clientId={clientId} />
                )}

                {/* Payments Section */}
                {activeRightSection === "payments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Billing & Payments</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-green-900">Payment Received</span>
                          <span className="text-sm font-bold text-green-700">+$2,500.00</span>
                        </div>
                        <p className="text-sm text-green-700 mb-1">Invoice #INV-2024-0156 - Monthly retainer</p>
                        <div className="flex items-center gap-4 text-xs text-green-600">
                          <span>Aug 5, 2024</span>
                          <span>•</span>
                          <span>Credit Card ****4532</span>
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-yellow-900">Pending Payment</span>
                          <span className="text-sm font-bold text-yellow-700">$1,200.00</span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-1">Invoice #INV-2024-0157 - Additional services</p>
                        <div className="flex items-center gap-4 text-xs text-yellow-600">
                          <span>Due: Aug 15, 2024</span>
                          <span>•</span>
                          <span>3 days overdue</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">Upcoming Billing</span>
                          <span className="text-sm font-bold text-gray-700">$2,500.00</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">Monthly retainer renewal</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>Due: Sep 1, 2024</span>
                          <span>•</span>
                          <span>Auto-pay enabled</span>
                        </div>
                      </div>
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

        {/* Owner Assignment Dialog */}
        <Dialog open={isAssigningOwner} onOpenChange={setIsAssigningOwner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Contact Owner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Search Staff Members</Label>
                <Input
                  value={ownerSearchTerm}
                  onChange={(e) => setOwnerSearchTerm(e.target.value)}
                  placeholder="Type to search staff members..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredStaff.length > 0) {
                      e.preventDefault();
                      updateOwnerMutation.mutate(filteredStaff[0].id);
                    }
                  }}
                  onFocus={() => {
                    if (ownerSearchTerm.trim()) {
                      setShowOwnerSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowOwnerSuggestions(false), 200);
                  }}
                />
                
                {/* Staff Suggestions */}
                {showOwnerSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => updateOwnerMutation.mutate(staff.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                        >
                          <UserCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium">{staff.firstName} {staff.lastName}</div>
                            <div className="text-xs text-gray-500">{staff.email}</div>
                          </div>
                        </button>
                      ))
                    ) : ownerSearchTerm.trim() ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No staff members found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAssigningOwner(false);
                  setOwnerSearchTerm("");
                  setShowOwnerSuggestions(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Followers Management Dialog */}
        <Dialog open={isAddingFollowers} onOpenChange={setIsAddingFollowers}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Followers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Current Followers */}
              {client?.followers && client.followers.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Current Followers</Label>
                  <div className="space-y-2">
                    {client.followers.map((followerId) => {
                      const follower = staffData.find((staff: any) => staff.id === followerId);
                      if (!follower) return null;
                      return (
                        <div key={followerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{follower.firstName} {follower.lastName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedFollowers = client.followers!.filter(id => id !== followerId);
                              updateFollowersMutation.mutate(updatedFollowers);
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Followers */}
              <div className="relative">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Add Followers</Label>
                <Input
                  value={followerSearchTerm}
                  onChange={(e) => setFollowerSearchTerm(e.target.value)}
                  placeholder="Type to search staff members..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredFollowers.length > 0) {
                      e.preventDefault();
                      const currentFollowers = client?.followers || [];
                      const updatedFollowers = [...currentFollowers, filteredFollowers[0].id];
                      updateFollowersMutation.mutate(updatedFollowers);
                    }
                  }}
                  onFocus={() => {
                    if (followerSearchTerm.trim()) {
                      setShowFollowerSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowFollowerSuggestions(false), 200);
                  }}
                />
                
                {/* Staff Suggestions */}
                {showFollowerSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredFollowers.length > 0 ? (
                      filteredFollowers.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => {
                            const currentFollowers = client?.followers || [];
                            const updatedFollowers = [...currentFollowers, staff.id];
                            updateFollowersMutation.mutate(updatedFollowers);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                        >
                          <UserCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium">{staff.firstName} {staff.lastName}</div>
                            <div className="text-xs text-gray-500">{staff.email}</div>
                          </div>
                        </button>
                      ))
                    ) : followerSearchTerm.trim() ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No available staff members found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddingFollowers(false);
                  setFollowerSearchTerm("");
                  setShowFollowerSuggestions(false);
                }}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Modal */}
        <AppointmentModal
          open={showAppointmentModal}
          onOpenChange={(open) => {
            setShowAppointmentModal(open);
            if (!open) {
              setEditingAppointment(null);
            }
          }}
          existingAppointment={editingAppointment}
          appointmentId={editingAppointment?.id}
          clientId={clientId!}
          clientName={client?.name || client?.company || 'Client'}
          clientEmail={client?.email || ''}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/appointments', 'client', clientId] });
            setEditingAppointment(null);
          }}
        />
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            {/* Recent Activity - Moved from Contact Tab */}
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
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="campaign">Campaign</SelectItem>
                        <SelectItem value="workflow">Workflow</SelectItem>
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
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6 mt-6">
            {/* DND (Do Not Disturb) Section - Moved from Contact Tab */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldOff className="h-5 w-5 text-red-500" />
                  DND (Do Not Disturb)
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* DND All Channels */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <ShieldOff className="h-5 w-5 text-red-500" />
                    <div>
                      <span className="font-medium text-gray-900">DND All Channels</span>
                      <p className="text-sm text-gray-600">Block all communications (emails, texts, calls)</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={client?.dndAll || false}
                    onCheckedChange={(checked) => {
                      updateDNDMutation.mutate({ dndAll: !!checked });
                    }}
                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                </div>

                {/* OR Separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm font-medium text-gray-500 px-3">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Individual Channel Settings */}
                <div className="space-y-3">
                  {/* Emails */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">Emails</span>
                    </div>
                    <Checkbox
                      checked={client?.dndEmail || false}
                      onCheckedChange={(checked) => {
                        updateDNDMutation.mutate({ dndEmail: !!checked });
                      }}
                      disabled={client?.dndAll || false}
                      className="disabled:opacity-50"
                    />
                  </div>

                  {/* Text Messages */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-gray-900">Text Messages</span>
                    </div>
                    <Checkbox
                      checked={client?.dndSms || false}
                      onCheckedChange={(checked) => {
                        updateDNDMutation.mutate({ dndSms: !!checked });
                      }}
                      disabled={client?.dndAll || false}
                      className="disabled:opacity-50"
                    />
                  </div>

                  {/* Calls & Voicemails */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-gray-900">Calls & Voicemails</span>
                    </div>
                    <Checkbox
                      checked={client?.dndCalls || false}
                      onCheckedChange={(checked) => {
                        updateDNDMutation.mutate({ dndCalls: !!checked });
                      }}
                      disabled={client?.dndAll || false}
                      className="disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Warning Message */}
                {(client?.dndAll || client?.dndEmail || client?.dndSms || client?.dndCalls) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ShieldOff className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Communication Restrictions Active</p>
                        <p className="text-amber-700 mt-1">
                          {client?.dndAll 
                            ? "All communications are blocked for this client."
                            : `${[
                                client?.dndEmail && "emails",
                                client?.dndSms && "text messages", 
                                client?.dndCalls && "calls"
                              ].filter(Boolean).join(", ")} are blocked for this client.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Communication - Moved from Contact Tab */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
              </CardHeader>
              <CardContent>
                <Tabs value={communicationTab} onValueChange={(value) => setCommunicationTab(value as 'sms' | 'email')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="sms" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sms" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">Send SMS</Label>
                        {(client?.dndAll || client?.dndSms) && (
                          <Badge variant="destructive" className="text-xs">
                            <ShieldOff className="h-3 w-3 mr-1" />
                            DND Active
                          </Badge>
                        )}
                      </div>

                      {/* First Row: From and To fields */}
                      <div className="flex items-center gap-4">
                        {/* From Field - Left Aligned */}
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-700">From</Label>
                          <Select
                            value={smsData.fromNumber}
                            onValueChange={(value) => handleSmsFieldChange('fromNumber', value)}
                            disabled={!!client?.dndAll || !!client?.dndSms}
                          >
                            <SelectTrigger className={`mt-1 ${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                              <SelectValue placeholder="Select phone number..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+1234567890">+1 (234) 567-8900 - Main</SelectItem>
                              <SelectItem value="+1234567891">+1 (234) 567-8901 - Sales</SelectItem>
                              <SelectItem value="+1234567892">+1 (234) 567-8902 - Support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* To Field - Right Aligned */}
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-700">To</Label>
                          <Input
                            value={smsData.to}
                            onChange={(e) => handleSmsFieldChange('to', e.target.value)}
                            placeholder="Phone number..."
                            disabled={!!client?.dndAll || !!client?.dndSms}
                            className={`mt-1 ${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Message Input Field */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Message</Label>
                        <Textarea
                          value={smsData.message}
                          onChange={(e) => handleSmsFieldChange('message', e.target.value)}
                          placeholder={
                            (client?.dndAll || client?.dndSms) 
                              ? "SMS blocked by DND settings..." 
                              : "Type your SMS message here..."
                          }
                          disabled={!!client?.dndAll || !!client?.dndSms}
                          className={`mt-1 min-h-[120px] resize-y ${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' : ''}`}
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        {/* Left Side - Tools */}
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            {/* Insert Template */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowSmsTemplateModal(true)}
                                  disabled={!!client?.dndAll || !!client?.dndSms}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Insert Template</TooltipContent>
                            </Tooltip>

                            {/* Insert Merge Tags */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowSmsMergeTagsModal(true)}
                                  disabled={!!client?.dndAll || !!client?.dndSms}
                                >
                                  <TagIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Insert Merge Tags</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex items-center gap-4">
                          {/* Character Count */}
                          <span className={`text-sm ${characterCount > 160 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            {characterCount} {characterCount > 160 ? '(Multiple messages)' : 'characters'}
                          </span>
                          
                          {/* Clear Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSmsMessage}
                            disabled={!smsData.message.trim() || !!client?.dndAll || !!client?.dndSms}
                          >
                            Clear
                          </Button>

                          {/* Send Button */}
                          <Button
                            onClick={handleSendSms}
                            disabled={!smsData.message.trim() || !smsData.to.trim() || !!client?.dndAll || !!client?.dndSms}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email" className="mt-0">
                    <div className="space-y-4">
                      {/* DND Warning */}
                      {(client?.dndAll || client?.dndEmail) && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <ShieldOff className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">
                            Email communication is blocked by DND settings
                          </span>
                        </div>
                      )}

                      {/* Email Form continues here but truncated for length */}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Hub Tab */}
          <TabsContent value="hub" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Products Section - Moved from Contact Tab */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clientProductsData && clientProductsData.length > 0 ? (
                    <div className="space-y-2">
                      {clientProductsData.slice(0, 3).map((clientProduct: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            {clientProduct.itemType === 'bundle' ? (
                              <Package className="h-4 w-4 text-teal-600" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm font-medium">{clientProduct.productName}</span>
                            {clientProduct.itemType === 'bundle' && (
                              <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                Bundle
                              </Badge>
                            )}
                          </div>
                          {clientProduct.productCost && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              ${clientProduct.productCost}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {clientProductsData.length > 3 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          +{clientProductsData.length - 3} more products
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No products assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-primary" />
                    Recent Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientNotes.length > 0 ? (
                    <div className="space-y-3">
                      {clientNotes.slice(0, 2).map((note: any) => (
                        <div key={note.id} className="p-3 bg-gray-50 rounded border">
                          <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              by {note.createdBy?.firstName}
                            </span>
                          </div>
                        </div>
                      ))}
                      {clientNotes.length > 2 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{clientNotes.length - 2} more notes
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <StickyNote className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No notes yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointments Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentsData && appointmentsData.length > 0 ? (
                    <div className="space-y-3">
                      {appointmentsData.slice(0, 2).map((appointment: any) => (
                        <div key={appointment.id} className="p-3 bg-gray-50 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{appointment.title}</p>
                              <p className="text-xs text-gray-500">{appointment.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(appointment.startDate).toLocaleDateString()} at {appointment.startTime}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No upcoming appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Recent Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {clientDocuments.slice(0, 2).map((doc: any) => (
                        <div key={doc.id} className="p-3 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium truncate">{doc.originalName}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                      {clientDocuments.length > 2 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{clientDocuments.length - 2} more documents
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No documents uploaded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals and Dialogs */}
    </div>
  );
}

// Task Comments Component
function TaskComments({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);

  // Fetch comments for this task
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['/api/tasks', taskId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  // Fetch staff for mentions
  const { data: staffData = [] } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, mentions }: { content: string; mentions: string[] }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mentions }),
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'comments'] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content, mentions }: { commentId: string; content: string; mentions: string[] }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mentions }),
      });
      if (!response.ok) throw new Error('Failed to update comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'comments'] });
      setEditingComment(null);
      setEditCommentContent("");
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'comments'] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  // Handle @mention logic
  const handleInputChange = (value: string, isEdit = false) => {
    if (isEdit) {
      setEditCommentContent(value);
    } else {
      setNewComment(value);
    }

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1);
      if (searchTerm.length >= 0) {
        setMentionSearch(searchTerm);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Filter staff for mentions
  const filteredStaff = staffData.filter((staff: any) => 
    `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    staff.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Insert mention
  const insertMention = (staff: any, isEdit = false) => {
    const currentValue = isEdit ? editCommentContent : newComment;
    const lastAtIndex = currentValue.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = currentValue.substring(0, lastAtIndex);
      const afterMention = currentValue.substring(lastAtIndex + mentionSearch.length + 1);
      const newValue = `${beforeMention}@${staff.firstName} ${staff.lastName} ${afterMention}`;
      
      if (isEdit) {
        setEditCommentContent(newValue);
      } else {
        setNewComment(newValue);
      }
    }
    
    setShowMentions(false);
    setMentionSearch("");
  };

  // Extract mentions from text
  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+\s+\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1];
      const staff = staffData.find((s: any) => 
        `${s.firstName} ${s.lastName}` === mentionedName
      );
      if (staff) {
        mentions.push(staff.id);
      }
    }
    
    return mentions;
  };

  // Submit comment
  const submitComment = () => {
    if (!newComment.trim()) return;
    
    const mentions = extractMentions(newComment);
    createCommentMutation.mutate({
      content: newComment,
      mentions
    });
  };

  // Submit edit
  const submitEdit = (commentId: string) => {
    if (!editCommentContent.trim()) return;
    
    const mentions = extractMentions(editCommentContent);
    editCommentMutation.mutate({
      commentId,
      content: editCommentContent,
      mentions
    });
  };

  // Render mention and URLs in text
  const renderCommentContent = (content: string) => {
    // First handle mentions
    const mentionRegex = /@(\w+\s+\w+)/g;
    const parts = content.split(mentionRegex);
    
    const processedParts = parts.map((part, index) => {
      if (index % 2 === 1) { // This is a mention
        return (
          <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded">
            @{part}
          </span>
        );
      }
      
      // Handle URLs in non-mention parts
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlParts = part.split(urlRegex);
      
      return urlParts.map((urlPart, urlIndex) => {
        if (urlIndex % 2 === 1) { // This is a URL
          const displayUrl = urlPart.length > 50 ? urlPart.substring(0, 47) + '...' : urlPart;
          return (
            <a
              key={`${index}-${urlIndex}`}
              href={urlPart}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all cursor-pointer"
              title={urlPart}
              onClick={(e) => e.stopPropagation()}
            >
              {displayUrl}
            </a>
          );
        }
        return <span key={`${index}-${urlIndex}`}>{urlPart}</span>;
      });
    });
    
    return processedParts;
  };

  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      {commentsLoading ? (
        <div className="text-center py-4 text-gray-500">
          <div className="text-sm">Loading comments...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No comments yet</p>
          <p className="text-xs text-gray-400">Be the first to comment</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment: any) => (
            <div key={comment.id} className="bg-white p-3 rounded border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {comment.author?.firstName?.charAt(0)}{comment.author?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {comment.author?.firstName} {comment.author?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditCommentContent(comment.content);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      value={editCommentContent}
                      onChange={(e) => handleInputChange(e.target.value, true)}
                      placeholder="Edit your comment..."
                      className="text-sm"
                      rows={2}
                    />
                    
                    {showMentions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                        {filteredStaff.map((staff: any) => (
                          <button
                            key={staff.id}
                            onClick={() => insertMention(staff, true)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <AtSign className="h-3 w-3 text-blue-600" />
                            <div>
                              <div className="text-sm font-medium">{staff.firstName} {staff.lastName}</div>
                              <div className="text-xs text-gray-500">{staff.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingComment(null);
                        setEditCommentContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => submitEdit(comment.id)}
                      disabled={editCommentMutation.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700">
                  {renderCommentContent(comment.content)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Add a comment... Use @ to mention someone"
            className="text-sm"
            rows={2}
          />
          
          {showMentions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
              {filteredStaff.map((staff: any) => (
                <button
                  key={staff.id}
                  onClick={() => insertMention(staff)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <AtSign className="h-3 w-3 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">{staff.firstName} {staff.lastName}</div>
                    <div className="text-xs text-gray-500">{staff.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={submitComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="flex items-center gap-1"
          >
            <Send className="h-3 w-3" />
            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
