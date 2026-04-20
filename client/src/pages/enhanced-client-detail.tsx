import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, User, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, FileText, CheckCircle, Plus, ExternalLink, Edit2, Save, X, Filter, Hash, Briefcase, Workflow, Target, UserCircle, ShoppingCart, Package, Trash2, Mail, MessageSquare, Phone, PhoneOff, MailX, ShieldOff, StickyNote, Calendar, Upload, CreditCard, Search, Clock, RefreshCw, Send, AtSign, Download, MessageCircle, Bold, Italic, Underline, Type, FileImage, Paperclip, HelpCircle, Tag as TagIcon, Globe, CornerDownRight, MapPin, Edit, Users, Activity, Zap, Archive, ShoppingBag, TrendingUp, Monitor, FileX, PenTool, Palette, Heart, Star, Coffee, Lightbulb, Rocket, Contact, Settings, Loader2, AlertCircle, Pencil, ClipboardList, Repeat, Layers, ClipboardCheck, Copy, Link2, Reply, UserPlus } from "lucide-react";
import CustomFieldFileUpload from "@/components/CustomFieldFileUpload";
import ContactCardField from "@/components/contact-card-field";

import { DocumentUploader } from "@/components/DocumentUploader";
import { AppointmentModal } from "@/components/AppointmentModal";
import { ProductSearchResults } from "@/components/ProductSearchResults";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CallButton } from "@/components/voip/call-button";
import { useVoip } from "@/hooks/use-voip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Client, Tag, InsertTag, EmailTemplate, SmsTemplate, ClientHealthScore } from "@shared/schema";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/use-has-permission";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn, getCurrentWeekRange } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import ClientHealthModal from "@/components/client-health-modal";
import type { HealthStatusResult } from "@shared/utils/healthAnalysis";
import DOMPurify from "dompurify";
import RoadmapComments from "@/components/roadmap-comments";
import { convertTextToHtml } from "@/components/rich-text-editor";
import { Map } from "lucide-react";
import ClientBillingTab from "@/components/client-billing-tab";

// MergeTagSelector Component for Email and SMS
function MergeTagSelector({ searchValue, onSearchChange, onSelectTag, customFields }: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectTag: (tag: string) => void;
  customFields: any[];
}) {
  // Basic merge tags
  const basicMergeTags = [
    { tag: '{{first_name}}', description: 'Client First Name' },
    { tag: '{{last_name}}', description: 'Client Last Name' },
    { tag: '{{full_name}}', description: 'Client Full Name' },
    { tag: '{{email}}', description: 'Client Email' },
    { tag: '{{phone}}', description: 'Client Phone' },
    { tag: '{{company}}', description: 'Client Company' },
    { tag: '{{user_first_name}}', description: 'User First Name' },
    { tag: '{{user_last_name}}', description: 'User Last Name' },
    { tag: '{{user_full_name}}', description: 'User Full Name' },
    { tag: '{{user_email}}', description: 'User Email' },
    { tag: '{{user_phone}}', description: 'User Phone' },
    { tag: '{{today_date}}', description: 'Today\'s Date' },
    { tag: '{{current_time}}', description: 'Current Time' }
  ];

  // Convert custom fields to merge tags
  const customFieldMergeTags = (customFields || []).map((field: any) => {
    // Generate a safe key from the field name
    const fieldKey = field.name ? field.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'unknown_field';
    return {
      tag: `{{${fieldKey}}}`,
      description: field.name || 'Custom Field'
    };
  });

  // Combine all merge tags
  const allMergeTags = [...basicMergeTags, ...customFieldMergeTags];

  // Filter merge tags based on search
  const filteredMergeTags = allMergeTags.filter(mergeTag =>
    mergeTag.tag.toLowerCase().includes(searchValue.toLowerCase()) ||
    mergeTag.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search merge tags..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          data-testid="input-merge-tag-search"
        />
      </div>

      {/* Merge Tags List */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        <div className="text-sm font-medium text-gray-700">
          Available Tags ({filteredMergeTags.length}):
        </div>
        {filteredMergeTags.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            No merge tags found matching "{searchValue}"
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredMergeTags.map((mergeTag, index) => (
              <button
                key={`${mergeTag.tag}-${index}`}
                className="text-left p-3 border rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => onSelectTag(mergeTag.tag)}
                data-testid={`merge-tag-${mergeTag.tag.replace(/[{}]/g, '')}`}
              >
                <div className="font-mono text-sm text-primary">{mergeTag.tag}</div>
                <div className="text-xs text-gray-600">{mergeTag.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// EmailTemplateSelector Component
function EmailTemplateSelector({ onSelectTemplate }: { onSelectTemplate: (content: string, name: string, previewText?: string) => void }) {
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
              onClick={() => onSelectTemplate(template.content, template.name, template.previewText)}
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

  // Get configurable team positions
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/team-positions"],
  });

  // Get all staff members
  const { data: staffList = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  // Get current team assignments
  const { data: teamAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}/team`],
    enabled: !!clientId,
  });

  // Create team assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async ({ positionId, staffId }: { positionId: string; staffId: string }) => {
      return apiRequest('POST', `/api/clients/${clientId}/team`, { position: positionId, staffId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/team`] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-positions"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Team assignment created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team assignment",
        variant: "destructive",
      });
    },
  });

  // Delete team assignment mutation  
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest('DELETE', `/api/client-team-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/team`] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-positions"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Team assignment removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to remove team assignment",
        variant: "destructive",
      });
    },
  });

  // Get assignment for a specific position
  const getAssignmentForPosition = (positionId: string) => {
    return (teamAssignments as any[]).find((assignment: any) => assignment.position?.id === positionId);
  };

  // Count how many positions have at least one staff assignment
  const filledPositionsCount = useMemo(() => {
    return positions.filter((position: any) => {
      const assignment = (teamAssignments as any[]).find(
        (a: any) => (a.position?.id === position.id || a.position === position.key) && a.staffId
      );
      return !!assignment;
    }).length;
  }, [positions, teamAssignments]);

  const isLoading = positionsLoading || assignmentsLoading;

  return (
    <div className="space-y-4" data-testid="team-assignments-section">
      <div className="flex items-center justify-between" data-testid="team-assignments-header">
        <h3 className="font-semibold text-gray-900">Team Assignments</h3>
        <div className="text-sm text-gray-500" data-testid="assignments-count">
          {filledPositionsCount} of {positions.length} positions filled
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
        <div className="space-y-3 max-h-[600px] overflow-y-auto" data-testid="team-positions-list">
          {positions.map((position: any) => {
            const assignment = getAssignmentForPosition(position.id);
            const assignedStaff = assignment ? (staffList as any[]).find((staff: any) => staff.id === assignment.staffId) : null;

            return (
              <div 
                key={position.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                data-testid={`team-position-${position.key}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <span className="font-medium text-gray-900" data-testid={`position-label-${position.key}`}>{position.label}:</span>
                    {position.description && (
                      <p className="text-sm text-gray-500">{position.description}</p>
                    )}
                  </div>
                </div>
                
                <Select
                  value={assignment?.staffId || "not_assigned"}
                  onValueChange={(value) => {
                    if (value === "not_assigned") {
                      if (assignment) {
                        deleteAssignmentMutation.mutate(assignment.id);
                      }
                    } else {
                      if (assignment) {
                        // Update existing assignment - delete and recreate
                        deleteAssignmentMutation.mutate(assignment.id);
                      }
                      createAssignmentMutation.mutate({
                        positionId: position.id,
                        staffId: value,
                      });
                    }
                  }}
                  disabled={createAssignmentMutation.isPending || deleteAssignmentMutation.isPending}
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Not Assigned">
                      {assignedStaff ? (
                        <div className="flex items-center gap-2">
                          {assignedStaff.profileImagePath ? (
                            <img 
                              src={`/objects${assignedStaff.profileImagePath}`} 
                              alt="" 
                              className="w-4 h-4 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                          {staff.profileImagePath ? (
                            <img 
                              src={`/objects${staff.profileImagePath}`} 
                              alt="" 
                              className="w-4 h-4 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

// SmsMergeTagsSelector Component
function SmsMergeTagsSelector({ searchTerm, onSelectTag }: { searchTerm: string; onSelectTag: (tag: string) => void }) {
  // Fetch custom fields
  const { data: customFields = [], isLoading } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
  });

  // Built-in merge tags (standard system fields)
  const builtInTags = [
    { name: 'First Name', key: 'first_name', category: 'client' },
    { name: 'Last Name', key: 'last_name', category: 'client' },
    { name: 'Full Name', key: 'full_name', category: 'client' },
    { name: 'Company', key: 'company', category: 'client' },
    { name: 'Phone', key: 'phone', category: 'client' },
    { name: 'Email', key: 'email', category: 'client' },
    { name: 'City', key: 'city', category: 'client' },
    { name: 'State', key: 'state', category: 'client' },
    { name: 'Today Date', key: 'today_date', category: 'system' },
    { name: 'Current Time', key: 'current_time', category: 'system' }
  ];

  // User/Staff merge tags
  const userTags = [
    { name: 'User First Name', key: 'user_first_name', category: 'user' },
    { name: 'User Last Name', key: 'user_last_name', category: 'user' },
    { name: 'User Full Name', key: 'user_full_name', category: 'user' },
    { name: 'User Email', key: 'user_email', category: 'user' },
    { name: 'User Phone', key: 'user_phone', category: 'user' }
  ];

  // Generate merge tag key from custom field name
  const generateMergeKey = (fieldName: string) => {
    return fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  // Combine built-in tags, user tags, and custom fields
  const allTags = [
    ...builtInTags,
    ...userTags,
    ...customFields.map((field: CustomField) => ({
      name: field.name,
      key: generateMergeKey(field.name),
      isCustom: true,
      category: 'custom',
      type: field.type
    }))
  ];

  // Filter tags based on search term
  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-4 text-center">Loading merge tags...</div>;
  }

  return (
    <div className="space-y-2">
      {filteredTags.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          {searchTerm ? "No merge tags found matching your search." : "No merge tags available."}
        </div>
      ) : (
        <>
          {/* Client Fields Section */}
          {filteredTags.some(tag => tag.category === 'client') && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 px-2">Client Fields</h4>
              {filteredTags.filter(tag => tag.category === 'client').map((tag) => (
                <Button
                  key={tag.key}
                  variant="outline"
                  className="w-full justify-start text-left mb-1"
                  onClick={() => onSelectTag(tag.key)}
                  data-testid={`button-sms-tag-${tag.key}`}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  <span className="font-mono text-sm">{`{{${tag.key}}}`}</span>
                  <span className="ml-2 text-gray-500">({tag.name})</span>
                </Button>
              ))}
            </div>
          )}

          {/* User Fields Section */}
          {filteredTags.some(tag => tag.category === 'user') && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 px-2">User Fields</h4>
              {filteredTags.filter(tag => tag.category === 'user').map((tag) => (
                <Button
                  key={tag.key}
                  variant="outline"
                  className="w-full justify-start text-left mb-1"
                  onClick={() => onSelectTag(tag.key)}
                  data-testid={`button-sms-tag-${tag.key}`}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  <span className="font-mono text-sm">{`{{${tag.key}}}`}</span>
                  <span className="ml-2 text-gray-500">({tag.name})</span>
                </Button>
              ))}
            </div>
          )}

          {/* System Fields Section */}
          {filteredTags.some(tag => tag.category === 'system') && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 px-2">System Fields</h4>
              {filteredTags.filter(tag => tag.category === 'system').map((tag) => (
                <Button
                  key={tag.key}
                  variant="outline"
                  className="w-full justify-start text-left mb-1"
                  onClick={() => onSelectTag(tag.key)}
                  data-testid={`button-sms-tag-${tag.key}`}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  <span className="font-mono text-sm">{`{{${tag.key}}}`}</span>
                  <span className="ml-2 text-gray-500">({tag.name})</span>
                </Button>
              ))}
            </div>
          )}

          {/* Custom Fields Section */}
          {filteredTags.some(tag => tag.category === 'custom') && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 px-2">Custom Fields</h4>
              {filteredTags.filter(tag => tag.category === 'custom').map((tag) => (
                <Button
                  key={tag.key}
                  variant="outline"
                  className="w-full justify-start text-left mb-1"
                  onClick={() => onSelectTag(tag.key)}
                  data-testid={`button-sms-tag-${tag.key}`}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  <span className="font-mono text-sm">{`{{${tag.key}}}`}</span>
                  <span className="ml-2 text-gray-500">({tag.name})</span>
                  {tag.type && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {tag.type}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// WorkflowSelectionModal Component
function WorkflowSelectionModal({ 
  isOpen, 
  onClose, 
  clientId, 
  onWorkflowSelected 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  clientId: string; 
  onWorkflowSelected: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['/api/workflows/active'],
    enabled: isOpen,
  });

  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter((workflow: any) =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle workflow selection and trigger
  const handleSelectWorkflow = async (workflowId: string, workflowName: string) => {
    try {
      await apiRequest('POST', `/api/workflows/${workflowId}/trigger`, { clientId });
      
      toast({
        title: "Workflow Started",
        variant: "default",
        description: `${workflowName} has been triggered for this client.`,
      });

      // Refresh workflow executions
      await queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/workflow-executions`] });
      
      onWorkflowSelected();
      onClose();
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast({
        title: "Error",
        description: "Failed to start workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Workflow</DialogTitle>
          <DialogDescription>
            Select a workflow to manually trigger for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-workflow-search"
            />
          </div>

          {/* Workflows List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading workflows...</div>
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  {searchTerm ? 'No workflows match your search.' : 'No active workflows found.'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWorkflows.map((workflow: any) => (
                  <div
                    key={workflow.id}
                    onClick={() => handleSelectWorkflow(workflow.id, workflow.name)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    data-testid={`workflow-option-${workflow.id}`}
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                      {workflow.description && (
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      )}
                      {workflow.category && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {workflow.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-workflow-modal-cancel"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ClientWorkflowsSection Component
function ClientWorkflowsSection({ clientId, actionsExpanded, setActionsExpanded }: { 
  clientId: string;
  actionsExpanded: { workflows: boolean };
  setActionsExpanded: (updater: (prev: any) => any) => void;
}) {
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  const { data: workflowExecutions, isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}/workflow-executions`],
    enabled: !!clientId,
  });

  return (
    <div className="pb-2">
      <div
        onClick={() => setActionsExpanded(prev => ({ ...prev, workflows: !prev.workflows }))}
        className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer"
      >
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          Automation
        </h4>
        {actionsExpanded.workflows ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
      {actionsExpanded.workflows && (
        <div className="mt-3 space-y-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading workflows...</div>
          ) : (
            <>
              {/* Active Workflows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700">Active</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsWorkflowModalOpen(true)}
                    data-testid="button-add-workflow"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-1">
                  {workflowExecutions?.active?.length > 0 ? (
                    workflowExecutions.active.map((execution: any) => (
                      <div key={execution.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-blue-800 font-medium">{execution.workflowName}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active workflows</p>
                  )}
                </div>
              </div>

              {/* Past Workflows */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Past</h5>
                <div className="space-y-1">
                  {workflowExecutions?.past?.length > 0 ? (
                    workflowExecutions.past.map((execution: any) => (
                      <div key={execution.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          execution.status === 'completed' ? 'bg-green-500' : 
                          execution.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-700">{execution.workflowName}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No completed workflows</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Workflow Selection Modal */}
      <WorkflowSelectionModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        clientId={clientId}
        onWorkflowSelected={() => {
          // Refresh workflow executions will be handled by the modal
        }}
      />
    </div>
  );
}

// RoadmapTabContent Component - Monthly roadmap entries for clients
function RoadmapTabContent({ client, queryClient, currentUser }: { client: Client; queryClient: any; currentUser: any }) {
  const { toast } = useToast();
  const { canDeleteRoadmapEntries } = useRolePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);

  // Fetch roadmap entries for this client
  const { data: roadmapEntriesData, isLoading } = useQuery<any[]>({
    queryKey: [`/api/clients/${client.id}/roadmap-entries`],
  });
  const roadmapEntries = Array.isArray(roadmapEntriesData) ? roadmapEntriesData : [];

  // Create new roadmap entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: { year: number; month: number; content?: string }) => {
      const response = await fetch(`/api/clients/${client.id}/roadmap-entries`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create roadmap entry');
      }
      return response.json();
    },
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/roadmap-entries`] });
      setIsAddDialogOpen(false);
      setExpandedEntryId(newEntry.id);
      toast({ title: "Success", description: "Monthly roadmap created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update roadmap entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, content }: { entryId: string; content: string }) => {
      const response = await fetch(`/api/clients/${client.id}/roadmap-entries/${entryId}`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update roadmap entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/roadmap-entries`] });
      setSavingEntryId(null);
      toast({ title: "Success", description: "Roadmap saved successfully" });
    },
    onError: () => {
      setSavingEntryId(null);
      toast({ title: "Error", description: "Failed to save roadmap", variant: "destructive" });
    }
  });

  // Delete roadmap entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/clients/${client.id}/roadmap-entries/${entryId}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete roadmap entry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/roadmap-entries`] });
      toast({ title: "Success", description: "Roadmap entry deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete roadmap entry", variant: "destructive" });
    }
  });

  const handleAddEntry = () => {
    createEntryMutation.mutate({ year: selectedYear, month: selectedMonth, content: '' });
  };

  const handleSaveContent = (entryId: string) => {
    const content = editingContent[entryId];
    if (content !== undefined) {
      setSavingEntryId(entryId);
      updateEntryMutation.mutate({ entryId, content });
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Check if a month/year already has an entry
  const existingEntries = new Set(roadmapEntries.map((e: any) => `${e.year}-${e.month}`));
  const canAddSelectedMonth = !existingEntries.has(`${selectedYear}-${selectedMonth}`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Monthly Roadmaps</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="btn-add-monthly-roadmap">
              <Plus className="h-4 w-4 mr-2" />
              Add Monthly Roadmap
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Monthly Roadmap</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger data-testid="select-roadmap-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger data-testid="select-roadmap-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!canAddSelectedMonth && (
                <p className="text-sm text-destructive">A roadmap for {getMonthName(selectedMonth)} {selectedYear} already exists.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleAddEntry} 
                disabled={!canAddSelectedMonth || createEntryMutation.isPending}
                data-testid="btn-confirm-add-roadmap"
              >
                {createEntryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Roadmap
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {roadmapEntries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Roadmaps Yet</h3>
            <p className="text-muted-foreground mb-4">Create a monthly roadmap to track strategic plans and milestones for this client.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="btn-add-first-roadmap">
              <Plus className="h-4 w-4 mr-2" />
              Add First Roadmap
            </Button>
          </CardContent>
        </Card>
      )}

      {/* List of Monthly Roadmap Entries */}
      {roadmapEntries.map((entry: any) => (
        <Card key={entry.id} className="overflow-hidden">
          <Collapsible open={expandedEntryId === entry.id} onOpenChange={(open) => setExpandedEntryId(open ? entry.id : null)}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">
                        {getMonthName(entry.month)} {entry.year}
                      </CardTitle>
                      {entry.author && (
                        <p className="text-sm text-muted-foreground">
                          Created by {entry.author.firstName} {entry.author.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    {expandedEntryId === entry.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <div className="flex justify-end gap-2 mb-2">
                  <Button 
                    onClick={() => handleSaveContent(entry.id)} 
                    disabled={savingEntryId === entry.id}
                    size="sm"
                    data-testid={`btn-save-roadmap-${entry.id}`}
                  >
                    {savingEntryId === entry.id ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" />Save</>
                    )}
                  </Button>
                  {canDeleteRoadmapEntries && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" data-testid={`btn-delete-roadmap-${entry.id}`}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Roadmap Entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the roadmap for {getMonthName(entry.month)} {entry.year} and all associated comments. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEntryMutation.mutate(entry.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </div>
                <RichTextEditor
                  content={editingContent[entry.id] ?? convertTextToHtml(entry.content || '')}
                  onChange={(content) => setEditingContent(prev => ({ ...prev, [entry.id]: content }))}
                  placeholder={`Document the roadmap for ${getMonthName(entry.month)} ${entry.year}...`}
                  className="min-h-[300px]"
                />
                
                {/* Comments Section for this entry */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="flex items-center gap-2 font-medium mb-4">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Discussion
                  </h4>
                  <RoadmapComments clientId={client.id} roadmapEntryId={entry.id} />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}

// ClientHealthTabContent Component
function ClientHealthTabContent({ clientId }: { clientId: string }) {
  console.log("ClientHealthTabContent rendering with clientId:", clientId);
  
  // Early return if no clientId
  if (!clientId) {
    console.log("No clientId provided to ClientHealthTabContent");
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No client ID provided</p>
      </div>
    );
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<any>(null);
  const [deletingScoreId, setDeletingScoreId] = useState<string | null>(null);

  const deleteHealthScoreMutation = useMutation({
    mutationFn: async (scoreId: string) => {
      return await apiRequest("DELETE", `/api/health-scores/${scoreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "health-scores"] });
      toast({
        title: "Health Score Deleted",
        variant: "default",
        description: "The health score has been removed.",
      });
      setDeletingScoreId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete health score.",
        variant: "destructive",
      });
      setDeletingScoreId(null);
    },
  });

  // Filter state management
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });
  const [healthStatusFilters, setHealthStatusFilters] = useState<{
    Green: boolean;
    Yellow: boolean;
    Red: boolean;
  }>({ Green: true, Yellow: true, Red: true });

  // Pagination state management
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Calculate date range based on current filter (pure derivation to prevent infinite re-renders)
  const currentDateRange = useMemo(() => {
    const now = new Date();
    switch (dateRangeFilter) {
      case "this_week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { from: startOfWeek, to: endOfWeek };
      case "last_week":
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return { from: lastWeekStart, to: lastWeekEnd };
      case "this_month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { from: startOfMonth, to: endOfMonth };
      case "last_3_months":
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        threeMonthsAgo.setDate(1);
        threeMonthsAgo.setHours(0, 0, 0, 0);
        return { from: threeMonthsAgo, to: now };
      case "custom":
        return customDateRange;
      default:
        return { from: null, to: null };
    }
  }, [dateRangeFilter, customDateRange]);

  // Clear filters function
  const clearFilters = useCallback(() => {
    setDateRangeFilter("all");
    setCustomDateRange({ from: null, to: null });
    setHealthStatusFilters({ Green: true, Yellow: true, Red: true });
  }, []);

  // Get current week range for checking if score exists (memoized to prevent infinite loops)
  const weekRange = useMemo(() => getCurrentWeekRange(), []);
  const weekStart = weekRange.weekStart.toISOString().split('T')[0];
  const weekEnd = weekRange.weekEnd.toISOString().split('T')[0];
  const displayRange = weekRange.displayRange;

  // Fetch health scores for this client
  const { data: healthScores = [], isLoading, error } = useQuery({
    queryKey: ["/api/clients", clientId, "health-scores"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/health-scores`);
      if (!response.ok) {
        throw new Error('Failed to fetch health scores');
      }
      return response.json();
    },
    enabled: !!clientId,
  });

  // Apply filters to health scores
  const filteredHealthScores = useMemo(() => {
    if (!Array.isArray(healthScores)) return [];

    let filtered = healthScores as ClientHealthScore[];

    // Apply date range filter
    if (dateRangeFilter !== "all") {
      if (currentDateRange.from || currentDateRange.to) {
        filtered = filtered.filter((score) => {
          const scoreDate = new Date(score.weekStartDate);
          if (currentDateRange.from && scoreDate < currentDateRange.from) return false;
          if (currentDateRange.to && scoreDate > currentDateRange.to) return false;
          return true;
        });
      }
    }

    // Apply health status filter
    const activeStatuses = Object.entries(healthStatusFilters)
      .filter(([_, active]) => active)
      .map(([status]) => status);
    
    if (activeStatuses.length < 3) { // If not all statuses are selected
      filtered = filtered.filter((score) => 
        activeStatuses.includes(score.healthIndicator)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
    );
  }, [healthScores, dateRangeFilter, currentDateRange, healthStatusFilters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredHealthScores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHealthScores = filteredHealthScores.slice(startIndex, endIndex);
  const totalItems = filteredHealthScores.length;
  const showingStart = totalItems > 0 ? startIndex + 1 : 0;
  const showingEnd = Math.min(endIndex, totalItems);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRangeFilter, currentDateRange, healthStatusFilters]);

  // Check if current week score exists
  const currentWeekScore = Array.isArray(healthScores) 
    ? (healthScores as ClientHealthScore[]).find(score => 
        score.weekStartDate === weekStart && score.weekEndDate === weekEnd
      )
    : undefined;

  // Helper function to get health indicator styling
  const getHealthIndicatorStyling = useCallback((healthIndicator: string) => {
    switch (healthIndicator) {
      case 'Green':
        return {
          badge: 'bg-green-100 text-green-800 border-green-200',
          dot: 'bg-green-500',
          text: 'text-green-700'
        };
      case 'Yellow':
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          dot: 'bg-yellow-500',
          text: 'text-yellow-700'
        };
      case 'Red':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-red-500',
          text: 'text-red-700'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          dot: 'bg-gray-500',
          text: 'text-gray-700'
        };
    }
  }, []);

  // Helper function to get metric styling based on value
  const getMetricStyling = useCallback((metric: string, value: string) => {
    if (metric === 'goals') {
      switch (value) {
        case 'Above': return 'text-green-600 bg-green-50';
        case 'On Track': return 'text-primary bg-primary/10';
        case 'Below': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    if (metric === 'fulfillment') {
      switch (value) {
        case 'Early': return 'text-green-600 bg-green-50';
        case 'On Time': return 'text-primary bg-primary/10';
        case 'Behind': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    if (metric === 'relationship') {
      switch (value) {
        case 'Engaged': return 'text-green-600 bg-green-50';
        case 'Passive': return 'text-yellow-600 bg-yellow-50';
        case 'Disengaged': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    if (metric === 'clientActions') {
      switch (value) {
        case 'Early': return 'text-green-600 bg-green-50';
        case 'Up to Date': return 'text-primary bg-primary/10';
        case 'Late': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    if (metric === 'paymentStatus') {
      switch (value) {
        case 'Current': return 'text-green-600 bg-green-50';
        case 'Past Due': return 'text-yellow-600 bg-yellow-50';
        case 'HOLD': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    return 'text-gray-600 bg-gray-50';
  }, []);

  // Handle successful health score submission
  const handleHealthScoreSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "health-scores"] });
    setIsHealthModalOpen(false);
    toast({
      title: "Health Score Recorded",
      variant: "default",
      description: `Weekly health score for ${weekRange.displayRange} has been saved successfully.`,
    });
  }, [queryClient, clientId, weekRange, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-red-600">
          <p>Error loading health scores: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Client Health Scores</h3>
        <Button 
          onClick={() => {
            setEditingScore(null);
            setIsHealthModalOpen(true);
          }}
          data-testid="button-add-health-score"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Health Score
        </Button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Filters</h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Range Filter */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</Label>
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Range Picker */}
            {dateRangeFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">From</Label>
                  <Input
                    type="date"
                    value={customDateRange.from ? customDateRange.from.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomDateRange(prev => ({ 
                      ...prev, 
                      from: e.target.value ? new Date(e.target.value) : null 
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">To</Label>
                  <Input
                    type="date"
                    value={customDateRange.to ? customDateRange.to.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomDateRange(prev => ({ 
                      ...prev, 
                      to: e.target.value ? new Date(e.target.value) : null 
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Health Status Filter */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Health Status</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-green"
                  checked={healthStatusFilters.Green}
                  onCheckedChange={(checked) => 
                    setHealthStatusFilters(prev => ({ ...prev, Green: !!checked }))
                  }
                />
                <Label htmlFor="filter-green" className="text-sm text-green-600">Green</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-yellow"
                  checked={healthStatusFilters.Yellow}
                  onCheckedChange={(checked) => 
                    setHealthStatusFilters(prev => ({ ...prev, Yellow: !!checked }))
                  }
                />
                <Label htmlFor="filter-yellow" className="text-sm text-yellow-600">Yellow</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-red"
                  checked={healthStatusFilters.Red}
                  onCheckedChange={(checked) => 
                    setHealthStatusFilters(prev => ({ ...prev, Red: !!checked }))
                  }
                />
                <Label htmlFor="filter-red" className="text-sm text-red-600">Red</Label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="text-sm text-gray-600 mt-4">
          Showing {showingStart}-{showingEnd} of {totalItems} records
        </div>
      </div>

      {/* Health Score Cards */}
      {paginatedHealthScores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No health scores recorded yet</p>
          <p className="text-gray-400 text-xs mt-1">Start tracking client health by adding a weekly score</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedHealthScores.map((score) => {
            const styling = getHealthIndicatorStyling(score.healthIndicator);
            return (
              <div key={score.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${styling.dot}`}></div>
                    <h4 className="font-medium text-gray-900">
                      Week of {new Date(score.weekStartDate).toLocaleDateString()}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styling.badge}`}>
                      {score.healthIndicator}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingScore(score);
                        setIsHealthModalOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => setDeletingScoreId(score.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                {/* Weekly Recap */}
                {score.weeklyRecap && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Weekly Recap</h5>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{score.weeklyRecap}</p>
                  </div>
                )}

                {/* Opportunities */}
                {score.opportunities && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Opportunities</h5>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{score.opportunities}</p>
                  </div>
                )}

                {/* Solutions */}
                {score.solutions && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Solutions</h5>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{score.solutions}</p>
                  </div>
                )}

                {/* Health Metrics */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Health Metrics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Goals</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricStyling('goals', score.goals)}`}>
                        {score.goals}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Fulfillment</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricStyling('fulfillment', score.fulfillment)}`}>
                        {score.fulfillment}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Relationship</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricStyling('relationship', score.relationship)}`}>
                        {score.relationship}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Client Actions</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricStyling('clientActions', score.clientActions)}`}>
                        {score.clientActions}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Payment Status</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricStyling('paymentStatus', (score as any).paymentStatus || 'Current')}`}>
                        {(score as any).paymentStatus || 'Current'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {showingStart} to {showingEnd} of {totalItems} health scores
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingScoreId} onOpenChange={(open) => !open && setDeletingScoreId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Health Score</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this health score? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingScoreId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteHealthScoreMutation.isPending}
              onClick={() => {
                if (deletingScoreId) {
                  deleteHealthScoreMutation.mutate(deletingScoreId);
                }
              }}
            >
              {deleteHealthScoreMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Score Modal */}
      <ClientHealthModal
        clientId={clientId}
        isOpen={isHealthModalOpen}
        onClose={() => {
          setIsHealthModalOpen(false);
          setEditingScore(null);
        }}
        onSuccess={handleHealthScoreSuccess}
        existingScore={editingScore}
      />
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

// Contact Card Editable Field Component
const ContactCardEditableField = ({
  fieldId,
  label,
  value,
  required,
  updateFieldMutation
}: {
  fieldId: string;
  label: string;
  value: any;
  required?: boolean;
  updateFieldMutation: any;
}) => {
  const [localContactValue, setLocalContactValue] = useState<any[]>(
    Array.isArray(value) ? value : []
  );
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleContactChange = (newValue: any[]) => {
    setLocalContactValue(newValue);
    setHasChanges(true);
  };
  
  const saveContactCard = async () => {
    try {
      await updateFieldMutation.mutateAsync({
        fieldId,
        value: localContactValue,
        isCustomField: true
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save contact card:', error);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-gray-500 dark:text-gray-400">
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
        {hasChanges && (
          <Button
            size="sm"
            onClick={saveContactCard}
            disabled={updateFieldMutation.isPending}
            className="h-7 bg-[#00C9C6] hover:bg-[#00C9C6]/90"
          >
            {updateFieldMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
        )}
      </div>
      <ContactCardField
        value={localContactValue}
        onChange={handleContactChange}
        fieldName={label}
        maxContacts={10}
      />
    </div>
  );
};

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
  placeholderText,
  tooltipText,
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
  placeholderText?: string | null;
  tooltipText?: string | null;
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
  
  // Handle contact_card fields - they need the ContactCardField component
  if (type === 'contact_card') {
    return (
      <ContactCardEditableField
        fieldId={fieldId}
        label={label}
        value={value}
        required={required}
        updateFieldMutation={updateFieldMutation}
      />
    );
  }
  
  return (
    <div>
      <label className="flex items-center justify-between text-gray-500 mb-1">
        <span className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltipText && (
            <span className="inline-flex items-center" title={tooltipText}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-400 cursor-help">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </span>

      </label>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          {type === 'dropdown' && options ? (
            <Select value={fieldEditValue} onValueChange={setFieldEditValue}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder={placeholderText || "Select..."} />
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
                    <SelectValue placeholder={placeholderText || "Add option..."} />
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
                      <Badge key={`${fieldId}-${value}-${index}`} variant="secondary" className="text-xs flex items-center gap-1">
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
              placeholder={placeholderText || "Enter value"}
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
          ) : type === 'date' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !fieldEditValue && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {fieldEditValue ? format(parseISO(fieldEditValue), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarUI
                  mode="single"
                  selected={fieldEditValue ? parseISO(fieldEditValue) : undefined}
                  onSelect={(date) => date && setFieldEditValue(format(date, "yyyy-MM-dd"))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              type={type === 'currency' ? 'number' : type}
              step={type === 'currency' ? '0.01' : undefined}
              placeholder={placeholderText || (type === 'currency' ? '0.00' : 'Enter value')}
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
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 group-hover:border-primary/50 p-2 rounded-md transition-colors">
              <a href={`mailto:${value}`} className={`${className} hover:underline flex-1`} onClick={(e) => e.stopPropagation()}>
                {value}
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(fieldId, value);
                }}
                title="Edit email"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          ) : type === 'phone' && value ? (
            <p className={`${className} border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 group-hover:border-primary/50 p-2 rounded-md transition-colors`}>
              {formatPhoneNumber(value)}
            </p>
          ) : type === 'url' && value ? (
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 group-hover:border-primary/50 p-2 rounded-md transition-colors">
              <a href={value} target="_blank" rel="noopener noreferrer" className={`${className} hover:underline flex-1 break-all`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
                {value.length > 60 ? `${value.substring(0, 60)}...` : value}
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-primary flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(fieldId, value);
                }}
                title="Edit URL"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          ) : type === 'currency' && value ? (
            <p className={`${className} border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 group-hover:border-primary/50 p-2 rounded-md transition-colors`}>
              ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ) : type === 'multiline' && value ? (
            <div className={`${className} border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 group-hover:border-primary/50 p-2 rounded-md whitespace-pre-wrap transition-colors`}>
              {Array.isArray(value) ? value.join(', ') : (value || "Not specified")}
            </div>
          ) : (type === 'dropdown_multiple' || type === 'checkbox') ? (
            <div className={`${className} border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 group-hover:border-primary/50 p-2 rounded-md transition-colors`}>
              {value ? (
                (Array.isArray(value) ? value : String(value).split(',')).map((item: string, index: number) => {
                  const trimmedItem = String(item).trim();
                  return trimmedItem ? (
                    <Badge key={`${trimmedItem}-${index}`} variant="secondary" className="mr-1 mb-1 text-xs">
                      {trimmedItem}
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-gray-500">Not specified</span>
              )}
            </div>
          ) : type === 'radio' && value ? (
            <p className={`${className} border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 group-hover:border-primary/50 p-2 rounded-md transition-colors`}>
              <Badge variant="outline" className="text-xs">{value}</Badge>
            </p>
          ) : (
            <p className={`${className} border border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 group-hover:border-primary/50 p-2 rounded-md transition-colors`}>
              {Array.isArray(value) ? value.join(', ') : (value || "Not specified")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

function GenerateTasksDialog({ clientId, open, onOpenChange }: { clientId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [generationType, setGenerationType] = useState<'onboarding' | 'recurring' | 'both'>('onboarding');
  const [skipExisting, setSkipExisting] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: preview, isLoading } = useQuery<any>({
    queryKey: [`/api/clients/${clientId}/generate-tasks-preview`, skipExisting ? 'skip' : 'all'],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/generate-tasks-preview?skipExisting=${skipExisting}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (preview?.items) {
      setSelectedItems(new Set(preview.items.map((i: any) => `${i.itemType}-${i.itemId}`)));
    }
  }, [preview]);

  const getSelectedPreviewItems = () => {
    if (!preview?.items) return [];
    return preview.items.filter((i: any) => selectedItems.has(`${i.itemType}-${i.itemId}`));
  };

  const getTotalTasks = () => {
    const items = getSelectedPreviewItems();
    let total = 0;
    for (const item of items) {
      if (generationType === 'onboarding' || generationType === 'both') total += item.onboardingTemplates;
      if (generationType === 'recurring' || generationType === 'both') total += item.recurringTemplates;
    }
    return total;
  };

  const toggleItem = (key: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleGenerate = async () => {
    const items = getSelectedPreviewItems().map((i: any) => ({ itemType: i.itemType, itemId: i.itemId }));
    if (items.length === 0) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedItems: items, generationType, skipExisting }),
        credentials: 'include',
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onOpenChange(false);
      if (result.errors?.length > 0 && result.totalTasksCreated > 0) {
        toast({ title: `Created ${result.totalTasksCreated} tasks (${result.onboardingTasks} onboarding, ${result.recurringTasks} recurring) with some warnings`, variant: "destructive" });
      } else if (result.totalTasksCreated === 0) {
        toast({ title: "No new tasks were generated. Templates may have already been processed." });
      } else {
        toast({ title: `Created ${result.totalTasksCreated} tasks (${result.onboardingTasks} onboarding, ${result.recurringTasks} recurring)` });
      }
    } catch (e: any) {
      toast({ title: "Failed to generate tasks", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const itemTypeIcon = (type: string) => {
    if (type === 'product') return <Package className="h-4 w-4 text-primary" />;
    if (type === 'bundle') return <Layers className="h-4 w-4 text-blue-500" />;
    return <Archive className="h-4 w-4 text-purple-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Tasks from Mapping</DialogTitle>
          <DialogDescription>
            Select which products to generate tasks for and choose the generation type.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : !preview?.items || preview.items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p>No products assigned to this client.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {preview.items.map((item: any) => {
                const key = `${item.itemType}-${item.itemId}`;
                const hasTemplates = item.onboardingTemplates > 0 || item.recurringTemplates > 0;
                return (
                  <div key={key} className={cn("flex items-center gap-3 p-3 rounded-lg border", hasTemplates ? "border-gray-200 dark:border-gray-700" : "border-gray-100 dark:border-gray-800 opacity-60")}>
                    <Checkbox
                      checked={selectedItems.has(key)}
                      onCheckedChange={() => toggleItem(key)}
                      disabled={!hasTemplates}
                      className="rounded-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {itemTypeIcon(item.itemType)}
                        <span className="font-medium text-sm truncate">{item.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">{item.itemType}</Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>{item.onboardingTemplates} onboarding</span>
                        <span>{item.recurringTemplates} recurring</span>
                        {skipExisting && (item.totalOnboarding > item.onboardingTemplates || item.totalRecurring > item.recurringTemplates) && (
                          <span className="text-yellow-600 dark:text-yellow-400">({item.totalOnboarding - item.onboardingTemplates + item.totalRecurring - item.recurringTemplates} already generated)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label className="text-sm font-medium">Generation Type</Label>
                <RadioGroup value={generationType} onValueChange={(v) => setGenerationType(v as any)} className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="onboarding" id="gen-onboarding" />
                    <Label htmlFor="gen-onboarding" className="text-sm font-normal cursor-pointer">Generate Onboarding Tasks</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="recurring" id="gen-recurring" />
                    <Label htmlFor="gen-recurring" className="text-sm font-normal cursor-pointer">Generate Recurring Tasks (Next Cycle)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="both" id="gen-both" />
                    <Label htmlFor="gen-both" className="text-sm font-normal cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={skipExisting}
                  onCheckedChange={(checked) => setSkipExisting(!!checked)}
                  className="rounded-sm"
                  id="skip-existing"
                />
                <Label htmlFor="skip-existing" className="text-sm font-normal cursor-pointer">Skip already generated (avoid duplicates)</Label>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total tasks to generate</span>
                <span className="text-lg font-bold text-primary">{getTotalTasks()}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || getTotalTasks() === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {isGenerating ? 'Generating...' : 'Generate Tasks'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskGenerationHistory({ clientId }: { clientId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: history, isLoading } = useQuery<any[]>({
    queryKey: [`/api/clients/${clientId}/task-generations`],
    enabled: expanded,
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Task Generation History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {history && <Badge variant="outline" className="text-xs">{history.length} generation{history.length !== 1 ? 's' : ''}</Badge>}
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No task generations recorded for this client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((group: any) => {
                const groupKey = group.key || `${group.generationType}-${group.cycleNumber}-${group.generatedAt}`;
                const isGroupExpanded = expandedGroups.has(groupKey);
                return (
                  <div key={groupKey} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <div className="flex items-center gap-3">
                        {isGroupExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {group.generatedAt ? format(new Date(group.generatedAt), "MMM d, yyyy h:mm a") : 'Unknown date'}
                            </span>
                            <Badge className={group.generationType === 'onboarding' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}>
                              {group.generationType === 'onboarding' ? 'Onboarding' : 'Recurring'}
                            </Badge>
                            {group.cycleNumber && (
                              <Badge variant="outline" className="text-xs">Cycle #{group.cycleNumber}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{group.items?.length || 0} template{group.items?.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">{group.totalTasks} task{group.totalTasks !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                    {isGroupExpanded && group.items && (
                      <div className="border-t">
                        {group.items.map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="p-3 border-b last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.sourceType === 'product' ? <Package className="h-3.5 w-3.5 text-primary" /> :
                                 item.sourceType === 'bundle' ? <Layers className="h-3.5 w-3.5 text-blue-500" /> :
                                 <Archive className="h-3.5 w-3.5 text-purple-500" />}
                                <span className="text-sm">{item.sourceName}</span>
                                <span className="text-xs text-gray-400">→</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{item.templateName}</span>
                              </div>
                              <span className="text-xs text-gray-500">{item.taskCount} task{item.taskCount !== 1 ? 's' : ''}</span>
                            </div>
                            {item.taskIds && item.taskIds.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.taskIds.map((taskId: string, tIdx: number) => (
                                  <Link key={tIdx} href={`/tasks?taskId=${taskId}`}>
                                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 transition-colors">
                                      Task #{tIdx + 1}
                                    </Badge>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function RecurringTasksSection({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'paused' | 'stopped' | null>(null);

  const { data: config, isLoading } = useQuery<any>({
    queryKey: [`/api/clients/${clientId}/recurring-config`],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/clients/${clientId}/recurring-config`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/recurring-config`] });
      toast({ title: "Recurring config updated" });
    },
    onError: () => {
      toast({ title: "Failed to update recurring config", variant: "destructive" });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'paused' || newStatus === 'stopped') {
      setConfirmAction(newStatus);
    } else {
      updateMutation.mutate({ status: newStatus });
    }
  };

  const confirmStatusChange = () => {
    if (confirmAction) {
      updateMutation.mutate({ status: confirmAction });
      setConfirmAction(null);
    }
  };

  const calculateNextGenDate = () => {
    if (!config?.cycleStartDate || config.status !== 'active') return null;
    const cycleStartMs = new Date(config.cycleStartDate).getTime();
    const cycleLengthMs = (config.cycleLengthDays || 30) * 24 * 60 * 60 * 1000;
    const lastGen = config.lastGeneratedCycle || 0;
    const nextCycleStart = new Date(cycleStartMs + lastGen * cycleLengthMs);
    const advanceDays = config.advanceGenerationDays || 3;
    const genDate = new Date(nextCycleStart.getTime() - advanceDays * 24 * 60 * 60 * 1000);
    return genDate;
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  const nextGenDate = calculateNextGenDate();
  const statusColor = config?.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
    config?.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Recurring Tasks</CardTitle>
            </div>
            {config && (
              <Badge className={statusColor}>
                {config.status === 'active' ? 'Active' : config.status === 'paused' ? 'Paused' : 'Stopped'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!config ? (
            <div className="text-center py-6">
              <Repeat className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 mb-4">No recurring task schedule configured for this client.</p>
              <Button
                onClick={() => updateMutation.mutate({ status: 'active', cycleLengthDays: 30, advanceGenerationDays: 3 })}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Set Up Recurring Tasks
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Select value={config.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="stopped">Stopped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cycle Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {config.cycleStartDate ? format(new Date(config.cycleStartDate), "MMM d, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={config.cycleStartDate ? new Date(config.cycleStartDate) : undefined}
                        onSelect={(date) => {
                          if (date) updateMutation.mutate({ cycleStartDate: date.toISOString() });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cycle Length (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={config.cycleLengthDays || 30}
                    key={`cycle-len-${config.cycleLengthDays}`}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0 && val !== config.cycleLengthDays) updateMutation.mutate({ cycleLengthDays: val });
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Advance Generation (days before cycle)</Label>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={config.advanceGenerationDays ?? 3}
                    key={`advance-gen-${config.advanceGenerationDays}`}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0 && val !== config.advanceGenerationDays) updateMutation.mutate({ advanceGenerationDays: val });
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Generated Cycle</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {config.lastGeneratedCycle ? `#${config.lastGeneratedCycle}` : "None yet"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Next Generation Date</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {config.status !== 'active' ? (
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">{config.status === 'paused' ? 'Paused' : 'Stopped'}</span>
                      ) : nextGenDate ? (
                        format(nextGenDate, "MMM d, yyyy")
                      ) : (
                        "Not calculated"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'paused' ? 'Pause Recurring Tasks?' : 'Stop Recurring Tasks?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'paused'
                ? 'Recurring task generation will be paused. Existing tasks won\'t be affected. Resume anytime.'
                : 'Recurring task generation will stop permanently. You\'ll need to manually restart it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={confirmAction === 'stopped' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}
            >
              {confirmAction === 'paused' ? 'Pause' : 'Stop'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ImportFromQuoteContent({ clientId, selectedQuoteId, setSelectedQuoteId, isImporting, setIsImporting, onSuccess }: {
  clientId: string;
  selectedQuoteId: string;
  setSelectedQuoteId: (id: string) => void;
  isImporting: boolean;
  setIsImporting: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();

  const { data: availableQuotes = [], isLoading: loadingQuotes } = useQuery<any[]>({
    queryKey: [`/api/clients/${clientId}/available-quotes`],
  });

  const handleImport = async () => {
    if (!selectedQuoteId) return;
    setIsImporting(true);
    try {
      const res = await apiRequest('POST', `/api/clients/${clientId}/import-from-quote`, {
        quoteId: selectedQuoteId,
      });
      const data = await res.json();
      toast({
        title: "Import Successful",
        description: data.message || `Imported ${data.transferredCount} items from quote.`,
        variant: "default",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import quote items.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loadingQuotes) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading quotes...</span>
      </div>
    );
  }

  if (availableQuotes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No quotes found for this client.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Quote</label>
        <select
          value={selectedQuoteId}
          onChange={(e) => setSelectedQuoteId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Choose a quote...</option>
          {availableQuotes.map((quote: any) => (
            <option key={quote.id} value={quote.id}>
              {quote.name} — ${Number(quote.clientBudget || 0).toLocaleString()}/mo — {quote.status}
              {quote.createdAt ? ` (${new Date(quote.createdAt).toLocaleDateString()})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedQuoteId && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-gray-600">
          This will import all products, bundles, and packages from the selected quote. Recurring bundles from packages will be added individually. Items already assigned to this client will be skipped.
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          onClick={handleImport}
          disabled={!selectedQuoteId || isImporting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Import Items
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ClientOnboardingHubSection({ client, clientId, isAdmin }: { client: any; clientId: string; isAdmin: boolean }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { data: onboardingStatus, isLoading } = useQuery<any>({
    queryKey: [`/api/clients/${clientId}/onboarding-status`],
    enabled: !!clientId,
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/clients/${clientId}/generate-onboarding-token`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/onboarding-status`] });
      toast({ title: "Onboarding link generated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to generate onboarding link", description: error.message, variant: "destructive" });
    },
  });

  const onboardingUrl = onboardingStatus?.onboardingUrl
    ? `${window.location.origin}${onboardingStatus.onboardingUrl}`
    : null;

  const handleCopy = () => {
    if (onboardingUrl) {
      navigator.clipboard.writeText(onboardingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading onboarding status...</span>
      </div>
    );
  }

  const hasToken = !!onboardingStatus?.hasToken;
  const isCompleted = !!onboardingStatus?.completed;
  const hasConfig = !!onboardingStatus?.formConfigured;
  const totalFields = onboardingStatus?.totalFields || 0;
  const filledFields = onboardingStatus?.filledFields || 0;
  const totalSteps = onboardingStatus?.totalSteps || 0;
  const currentStep = onboardingStatus?.currentStep || 0;
  const percentComplete = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Onboarding Form</h3>
      </div>

      {!hasConfig && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">No client onboarding form configured yet.</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Configure one in Settings &gt; Clients &gt; Client Onboarding Form to define the form fields.</p>
        </div>
      )}

      <div className="space-y-4">
        {isCompleted ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">Onboarding Complete</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 ml-7">
              This client has completed their onboarding form.
            </p>
          </div>
        ) : hasToken ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-300 text-sm">Onboarding Form Link</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={onboardingUrl || ''}
                  className="flex-1 text-xs bg-white dark:bg-gray-800 border rounded px-2 py-1.5 text-gray-600 dark:text-gray-300 font-mono"
                />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={onboardingUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            {hasConfig && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="text-sm font-semibold" style={{ color: percentComplete === 100 ? '#16a34a' : 'hsl(179, 100%, 39%)' }}>
                    {percentComplete}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentComplete}%`,
                      backgroundColor: percentComplete === 100 ? '#16a34a' : 'hsl(179, 100%, 39%)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{filledFields} of {totalFields} fields completed</span>
                  {totalSteps > 1 && (
                    <span>Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}</span>
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateTokenMutation.mutate()}
                disabled={generateTokenMutation.isPending}
                className="w-full"
              >
                {generateTokenMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Regenerate Onboarding Link
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No onboarding link generated for this client yet.
            </p>
            {isAdmin ? (
              <Button
                size="sm"
                onClick={() => generateTokenMutation.mutate()}
                disabled={generateTokenMutation.isPending}
                style={{ backgroundColor: 'hsl(179, 100%, 39%)' }}
                className="text-white hover:opacity-90"
              >
                {generateTokenMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Onboarding Link
              </Button>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Contact an admin to generate an onboarding link for this client.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnhancedClientDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract client ID from URL
  // Extract client ID from URL path (e.g., /clients/df3f4467-809f-4cf1-bd8f-08a895996b65)
  const pathSegments = window.location.pathname.split('/');
  const clientIndex = pathSegments.indexOf('clients');
  const clientId = clientIndex !== -1 && clientIndex + 1 < pathSegments.length 
    ? pathSegments[clientIndex + 1] 
    : pathSegments[pathSegments.length - 1];
  
  // Ref for right column (left column height tracking removed)
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const emailComposeRef = useRef<HTMLDivElement>(null);

  // State management
  const [sections, setSections] = useState<Section[]>([
    { id: "contact-details", name: "Contact Details", isOpen: true }
  ]);
  const [activeRightSection, setActiveRightSection] = useState<"notes">("notes");
  const [activeHubSection, setActiveHubSection] = useState<"notes" | "tasks" | "appointments" | "documents" | "team" | "meetings" | "health" | "onboarding">("notes");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>("all");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>("all");
  const [taskSortBy, setTaskSortBy] = useState<string>("dueDate");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [searchDocuments, setSearchDocuments] = useState("");
  const [smsMergeTagsSearch, setSmsMergeTagsSearch] = useState("");
  
  // Modal state variables
  const [smsTemplatesOpen, setSmsTemplatesOpen] = useState(false);
  const [smsMergeTagsOpen, setSmsMergeTagsOpen] = useState(false);
  const [emailTemplatesOpen, setEmailTemplatesOpen] = useState(false);
  const [emailMergeTagsOpen, setEmailMergeTagsOpen] = useState(false);
  const [showLogActivityModal, setShowLogActivityModal] = useState(false);
  
  // Manual activity logging state
  const [logActivityType, setLogActivityType] = useState("general");
  const [logActivityDescription, setLogActivityDescription] = useState("");
  
  // Communication form state
  const [smsData, setSmsData] = useState({ fromNumber: "", message: "" });
  const [emailData, setEmailData] = useState({ fromName: "", fromEmail: "", to: "", cc: "", bcc: "", subject: "", previewText: "", message: "" });
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  
  // Selected contact for communication (index into availableContacts array, 0 = primary client)
  const [selectedContactIndex, setSelectedContactIndex] = useState(0);
  
  // Selected contacts for SMS multi-select (array of contact indices)
  const [selectedSmsContactIndices, setSelectedSmsContactIndices] = useState<number[]>([0]);
  
  // Additional SMS recipients (manual numbers or staff)
  const [additionalSmsNumbers, setAdditionalSmsNumbers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [manualSmsNumber, setManualSmsNumber] = useState("");
  const [showStaffSmsPicker, setShowStaffSmsPicker] = useState(false);
  const [staffSmsSearch, setStaffSmsSearch] = useState("");
  
  // Selected contacts for Email multi-select (array of contact indices)
  const [selectedEmailContactIndices, setSelectedEmailContactIndices] = useState<number[]>([0]);
  
  // Handler functions for communication forms
  const handleSmsFieldChange = (field: string, value: string) => {
    setSmsData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailFieldChange = useCallback((field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  }, []);

  // SMS sending functionality
  const sendSmsMutation = useMutation({
    mutationFn: async (smsPayload: { fromNumber: string; to: string; message: string; clientId: string }) => {
      return await apiRequest("POST", "/api/integrations/twilio/send", smsPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/audit-logs/entity/contact', clientId],
        exact: false
      });
    },
  });

  // Helper function to format phone number for Twilio
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's 10 digits, assume US number and add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it's 11 digits starting with 1, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it already starts with +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Otherwise, assume US and add +1
    return `+1${cleaned}`;
  };

  const handleSendSms = () => {
    const selectedContacts = selectedSmsContactIndices
      .map(index => availableContacts[index])
      .filter(contact => contact?.phone);
    
    const allRecipients = [
      ...selectedContacts.map(c => ({ name: c.name, phone: c.phone! })),
      ...additionalSmsNumbers.map(n => ({ name: n.name, phone: n.phone })),
    ];
    
    // Deduplicate by normalized phone number
    const seen = new Set<string>();
    const uniqueRecipients = allRecipients.filter(r => {
      const normalized = formatPhoneNumber(r.phone);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
    
    if (!smsData.fromNumber || !smsData.message.trim() || uniqueRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: uniqueRecipients.length === 0 
          ? "Please select at least one contact or add a phone number"
          : "Please fill in all required fields"
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    
    const sendPromises = uniqueRecipients.map(recipient => {
      const formattedToNumber = formatPhoneNumber(recipient.phone);
      return sendSmsMutation.mutateAsync({
        fromNumber: smsData.fromNumber,
        to: formattedToNumber,
        message: smsData.message,
        clientId: client?.id
      }).then(() => {
        successCount++;
      }).catch(() => {
        errorCount++;
      });
    });
    
    Promise.all(sendPromises).then(() => {
      if (successCount > 0) {
        toast({
          title: "SMS Sent",
          variant: "default",
          description: successCount === 1 
            ? "Your message has been sent successfully."
            : `Your message has been sent to ${successCount} recipient(s).`,
        });
        setShowSmsSendModal(false);
        setSmsData(prev => ({ ...prev, message: '' }));
        setAdditionalSmsNumbers([]);
      }
      if (errorCount > 0) {
        toast({
          variant: "destructive",
          title: "Partial Failure",
          description: `Failed to send SMS to ${errorCount} recipient(s).`
        });
      }
    });
  };

  const [documentFilterType, setDocumentFilterType] = useState("all");
  const [documentSortBy, setDocumentSortBy] = useState("newest");
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [deletingAppointment, setDeletingAppointment] = useState<any>(null);
  const [deletingNote, setDeletingNote] = useState<any>(null);
  
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
  const [onboardingStartDateOpen, setOnboardingStartDateOpen] = useState(false);
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
  
  // Activity filtering and pagination
  const [activityFilter, setActivityFilter] = useState<'all' | 'general' | 'email' | 'call' | 'meeting' | 'task' | 'note' | 'campaign' | 'workflow'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Communication history state
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [communicationSearch, setCommunicationSearch] = useState('');
  const deferredCommunicationSearch = useDeferredValue(communicationSearch);
  const [commCurrentPage, setCommCurrentPage] = useState(1);
  const commItemsPerPage = 10;
  const [commTypeFilter, setCommTypeFilter] = useState<'all' | 'sms' | 'email'>('all');
  const [commDirectionFilter, setCommDirectionFilter] = useState<'all' | 'outbound' | 'inbound'>('all');
  
  // Reset page when search changes (with proper dependency to avoid render loop)
  useEffect(() => {
    if (commCurrentPage !== 1) {
      setCommCurrentPage(1);
    }
  }, [deferredCommunicationSearch]);
  
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
  const [hubExpandedBundles, setHubExpandedBundles] = useState<Set<string>>(new Set());
  const [editingBundleQuantities, setEditingBundleQuantities] = useState<string | null>(null);
  const [hubEditingBundleQuantities, setHubEditingBundleQuantities] = useState<string | null>(null);
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showImportQuoteModal, setShowImportQuoteModal] = useState(false);
  const [showGenerateTasksModal, setShowGenerateTasksModal] = useState(false);
  const [selectedImportQuoteId, setSelectedImportQuoteId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

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
    workflows: false
  });
  

  // Communication tabs state
  const [communicationTab, setCommunicationTab] = useState<'sms' | 'email' | 'call'>('sms');

  // Client Brief state - 8 separate sections
  // Dynamic client brief sections from API - hybrid core + custom data
  const { data: briefSections = [], isLoading: isLoadingBriefSections } = useQuery({
    queryKey: [`/api/clients/${clientId}/brief`],
    enabled: !!clientId,
  });

  // Local state for editing content
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());

  // Icon mapping for dynamic brief sections - fallback to FileText for unknown icons
  const iconMap: Record<string, any> = {
    FileText, Target, TagIcon, Users, Package, Activity, Zap, Archive,
    Briefcase, Globe, Mail, Phone, MapPin, Calendar, Edit, Clock,
    ShoppingCart, CreditCard, Hash, CornerDownRight, User, UserCircle,
    Heart, Star, TrendingUp, ShoppingBag, Monitor, FileX, PenTool, Palette,
    Coffee, Lightbulb, Rocket, Contact, Settings
  };

  // Update client brief section mutation - now uses hybrid API
  const updateClientBriefSectionMutation = useMutation({
    mutationFn: async ({ sectionId, content }: { sectionId: string; content: string }) => {
      return apiRequest('PUT', `/api/clients/${clientId}/brief/${sectionId}`, { value: content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/brief`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Client brief section updated successfully",
      });
      setEditingSections(prev => {
        const next = new Set(prev);
        next.delete(variables.sectionId);
        return next;
      });
    },
    onError: (error: Error, variables) => {
      console.error('Client brief update error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to update section`,
        variant: "destructive",
      });
    },
  });

  // SMS composition state (removed duplicate)
  const [characterCount, setCharacterCount] = useState(0);
  const [showSmsTemplateModal, setShowSmsTemplateModal] = useState(false);
  const [showSmsMergeTagsModal, setShowSmsMergeTagsModal] = useState(false);

  const [showSmsSendModal, setShowSmsSendModal] = useState(false);
  const [smsModalMode, setSmsModalMode] = useState<'both' | 'schedule-only'>('both');
  const [showSmsChoiceModal, setShowSmsChoiceModal] = useState(false);
  const [showSmsScheduleModal, setShowSmsScheduleModal] = useState(false);
  
  // Email choice modal state - same pattern as SMS
  const [showEmailChoiceModal, setShowEmailChoiceModal] = useState(false);
  const [showEmailScheduleModal, setShowEmailScheduleModal] = useState(false);
  
  // Debug the SMS modal state changes
  useEffect(() => {
    console.log('🎯 SMS MODAL STATE CHANGED:', showSmsChoiceModal);
  }, [showSmsChoiceModal]);



  // Email composition state (removed duplicate)
  const [showWysiwyg, setShowWysiwyg] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showMergeTagsModal, setShowMergeTagsModal] = useState(false);

  // Fetch custom fields for merge tags
  const { data: customFields = [] } = useQuery({
    queryKey: ['/api/custom-fields'],
    enabled: showMergeTagsModal || showSmsChoiceModal // Only fetch when modals are open
  });
  const [showSendModal, setShowSendModal] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledTimezone, setScheduledTimezone] = useState('America/New_York');

  // Debug scheduling state
  useEffect(() => {
    console.log("🔄 SCHEDULING STATE DEBUG:", {
      scheduledDate,
      scheduledTime,
      scheduledTimezone,
      buttonDisabled: !scheduledDate || !scheduledTime
    });
  }, [scheduledDate, scheduledTime, scheduledTimezone]);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'contact' | 'hub' | 'health' | 'products' | 'billing' | 'communication' | 'activity'>('contact');



  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Fetch all clients for Next Client navigation
  const { data: allClientsResponse } = useQuery<{ clients: Client[], pagination: any }>({
    queryKey: ['/api/clients', { limit: 1000 }],
  });
  const allClients = allClientsResponse?.clients || [];

  // Find next client in the list (sorted by createdAt descending, matching the All Clients page default)
  const nextClient = useMemo(() => {
    if (!client || allClients.length === 0) return null;
    
    // Sort clients by createdAt descending (matching All Clients page default sort)
    const sortedClients = [...allClients].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate; // descending order
    });
    
    const currentIndex = sortedClients.findIndex(c => c.id === client.id);
    if (currentIndex === -1 || currentIndex === sortedClients.length - 1) return null;
    
    return sortedClients[currentIndex + 1];
  }, [client, allClients]);

  // Get client health status for highlighting
  const { data: healthStatus, isLoading: healthStatusLoading } = useQuery<HealthStatusResult>({
    queryKey: [`/api/clients/${clientId}/health-status`],
    enabled: !!clientId,
  });

  // Initialize brief sections from client data
  // Initialize editing content when brief sections load
  // If a section has no value but has a defaultTemplate, use the template as initial content
  useEffect(() => {
    if (briefSections.length > 0) {
      const contentMap: Record<string, string> = {};
      briefSections.forEach((section: any) => {
        const val = section.value;
        contentMap[section.id] = (val != null && val.trim() !== '') ? val : (section.defaultTemplate ?? "");
      });
      
      // Only update editingContent if it's actually different
      setEditingContent(prevContent => {
        const hasChanges = Object.keys(contentMap).some(key => 
          prevContent[key] !== contentMap[key]
        ) || Object.keys(prevContent).length !== Object.keys(contentMap).length;
        
        return hasChanges ? contentMap : prevContent;
      });
    }
  }, [briefSections]);

  // Fetch custom field folders
  const { data: customFieldFoldersData } = useQuery<Array<{ id: string; name: string; order: number }>>({
    queryKey: ['/api/custom-field-folders'],
  });

  // Fetch custom fields
  const { data: customFieldsData, isLoading: customFieldsLoading } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[]; placeholderText?: string | null; tooltipText?: string | null }>>({
    queryKey: ['/api/custom-fields'],
  });

  // Fetch Twilio phone numbers for SMS dropdown
  const { data: twilioResponse } = useQuery({
    queryKey: ["/api/integrations/twilio/numbers"],
  });
  const twilioNumbers = twilioResponse?.phoneNumbers || [];

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

  const { data: packagesData = [] } = useQuery<any[]>({
    queryKey: ['/api/product-packages'],
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
  const { data: clientAppointmentsData = [], isLoading: appointmentsLoading } = useQuery({
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
  
  // Use role-based permission hook for consistent permission checks
  const { isAdmin, isAdminOrManager, canDeleteRoadmapEntries, canManageClientNotes, canDeleteDocuments, canViewCosts, canManageDndSettings, canDeleteProducts } = useRolePermissions();

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch client notes data
  const { data: clientNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'notes'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/notes`);
      if (!response.ok) throw new Error('Failed to fetch client notes');
      return response.json();
    },
    enabled: !!clientId && (activeRightSection === "notes" || activeHubSection === "notes"),
  });

  // Fetch client tasks data
  const { data: clientTasksData = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'tasks'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch client tasks');
      return response.json();
    },
    enabled: !!clientId && activeHubSection === "tasks",
  });

  // Filter and sort client tasks
  const filteredAndSortedTasks = useMemo(() => {
    let tasks = [...clientTasksData];

    // Apply status filter
    if (taskStatusFilter !== "all") {
      tasks = tasks.filter((task: any) => task.status === taskStatusFilter);
    }

    // Apply priority filter
    if (taskPriorityFilter !== "all") {
      tasks = tasks.filter((task: any) => task.priority === taskPriorityFilter);
    }

    // Apply assignee filter
    if (taskAssigneeFilter !== "all") {
      tasks = tasks.filter((task: any) => task.assignedTo === taskAssigneeFilter);
    }

    // Apply show completed filter
    if (!showCompletedTasks) {
      tasks = tasks.filter((task: any) => task.status !== 'completed');
    }

    // Apply sorting
    tasks.sort((a: any, b: any) => {
      switch (taskSortBy) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "dueDateDesc":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return 0;
      }
    });

    return tasks;
  }, [clientTasksData, taskStatusFilter, taskPriorityFilter, taskAssigneeFilter, showCompletedTasks, taskSortBy]);

  // Fetch client documents data
  const { data: clientDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'documents'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch client documents');
      return response.json();
    },
    enabled: !!clientId && activeHubSection === "documents",
  });

  // Fetch PX meetings for this client
  const { data: clientMeetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['/api/px-meetings', 'client', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/px-meetings?clientId=${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch client meetings');
      return response.json();
    },
    enabled: !!clientId && activeHubSection === "meetings",
  });

  // Get all bundle IDs from client products
  const allClientBundleIds = useMemo(() => {
    if (!clientProductsData || !Array.isArray(clientProductsData)) return [];
    return clientProductsData
      .filter((item: any) => item && item.itemType === 'bundle')
      .map((item: any) => item.productId || item.id)
      .filter(Boolean);
  }, [clientProductsData]);

  // Fetch bundle details for ALL client bundles with client-specific quantities (not just expanded ones)
  const { data: bundleDetailsData = {} } = useQuery({
    queryKey: ['/api/bundle-details', 'all-client-bundles', allClientBundleIds, clientId],
    queryFn: async () => {
      const bundleDetails: Record<string, any> = {};
      for (const bundleId of allClientBundleIds) {
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
    enabled: allClientBundleIds.length > 0 && !!clientId && !!clientProductsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate total cost of all client products and bundles
  const { monthlyCost, oneTimeCost, totalProductsCost } = useMemo(() => {
    if (!clientProductsData || !Array.isArray(clientProductsData)) return { monthlyCost: 0, oneTimeCost: 0, totalProductsCost: 0 };
    
    let monthly = 0;
    let oneTime = 0;
    
    clientProductsData.forEach((product: any) => {
      let itemCost = 0;
      if (product.itemType === 'bundle') {
        const bundleDetails = bundleDetailsData[product.productId];
        if (bundleDetails && Array.isArray(bundleDetails)) {
          bundleDetails.forEach((item: any) => {
            const costValue = item.productCost || item.cost || item.price || item.productPrice || 0;
            const cost = typeof costValue === 'string' ? parseFloat(costValue) : Number(costValue);
            const validCost = isNaN(cost) ? 0 : cost;
            const quantity = parseInt(item.quantity || '1');
            itemCost += validCost * quantity;
          });
        }
        const bundleType = product.bundleCostType || 'recurring';
        if (bundleType === 'one_time') {
          oneTime += itemCost;
        } else {
          monthly += itemCost;
        }
      } else {
        const cost = parseFloat(product.cost || product.productCost || '0');
        itemCost = cost;
        const prodType = product.productType || 'recurring';
        if (prodType === 'one_time') {
          oneTime += itemCost;
        } else {
          monthly += itemCost;
        }
      }
    });
    
    return { monthlyCost: monthly, oneTimeCost: oneTime, totalProductsCost: monthly + oneTime };
  }, [clientProductsData, bundleDetailsData]);

  // Helper function to calculate individual bundle cost
  const calculateIndividualBundleCost = useCallback((bundleId: string) => {
    const bundleDetails = bundleDetailsData[bundleId];
    if (!bundleDetails || !Array.isArray(bundleDetails)) return 0;
    
    return bundleDetails.reduce((total, item: any) => {
      // Handle various formats of cost fields (string, number, null, undefined)
      // Try multiple possible field names: productCost, cost, price, productPrice
      const costValue = item.productCost || item.cost || item.price || item.productPrice || 0;
      const cost = typeof costValue === 'string' ? parseFloat(costValue) : Number(costValue);
      const validCost = isNaN(cost) ? 0 : cost;
      
      const quantity = parseInt(item.quantity || '1');
      return total + (validCost * quantity);
    }, 0);
  }, [bundleDetailsData]);

  // Helper functions to get dynamic names from custom fields - memoized to prevent infinite re-renders
  // Note: clientDisplayName returns the CLIENT (business) name, contactDisplayName returns the contact person's name
  const clientDisplayName = useMemo(() => {
    if (!client) return "";
    
    // If custom fields are still loading, show business name as fallback
    if (customFieldsLoading || !customFieldsData) {
      return client.company || client.name || client.email || "Loading...";
    }
    
    // Primary display should be the business name
    if (client.company) {
      return client.company;
    }
    
    // Fall back to contact name if no company
    return client.name || client.email || "Unnamed Client";
  }, [client, customFieldsData, customFieldsLoading]);

  // Contact person's name (for secondary display)
  const contactDisplayName = useMemo(() => {
    if (!client) return "";
    
    // Find First Name and Last Name fields by exact name match
    if (!customFieldsLoading && customFieldsData) {
      const firstNameField = customFieldsData.find(field => 
        field.name === 'First Name' || field.name === 'FirstName' || field.name === 'first name'
      );
      const lastNameField = customFieldsData.find(field => 
        field.name === 'Last Name' || field.name === 'LastName' || field.name === 'last name'
      );
      
      const customFieldValues = client.customFieldValues as Record<string, any> || {};
      const firstName = firstNameField ? customFieldValues[firstNameField.id] || "" : "";
      const lastName = lastNameField ? customFieldValues[lastNameField.id] || "" : "";
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      if (firstName) return firstName;
      if (lastName) return lastName;
    }
    
    return client.name || "";
  }, [client, customFieldsData, customFieldsLoading]);

  const businessDisplayName = useMemo(() => {
    if (!client) return "";
    
    // For now, just use company field (can be enhanced later with caching)
    return client.company || "";
  }, [client]);

  // Get phone number from custom fields (preferred) or fallback to client.phone
  const contactPhoneNumber = useMemo(() => {
    if (!client) return "";
    
    // Find Phone field by exact name match in custom fields
    if (!customFieldsLoading && customFieldsData) {
      const phoneField = customFieldsData.find(field => 
        field.name === 'Phone' || field.name === 'phone' || field.name === 'Mobile' || field.name === 'mobile'
      );
      
      const customFieldValues = client.customFieldValues as Record<string, any> || {};
      const phoneValue = phoneField ? customFieldValues[phoneField.id] || "" : "";
      
      if (phoneValue) {
        return phoneValue;
      }
    }
    
    // Fallback to client.phone if no custom field phone
    return client.phone || "";
  }, [client, customFieldsData, customFieldsLoading]);

  // Extract all available contacts from Contact Card custom fields + primary client
  const availableContacts = useMemo(() => {
    const contacts: Array<{
      id: string;
      name: string;
      position?: string;
      email?: string;
      phone?: string;
      isPrimary: boolean;
    }> = [];
    
    // Add primary client contact first
    contacts.push({
      id: 'primary',
      name: contactDisplayName || client?.name || client?.company || 'Primary Contact',
      position: 'Primary Contact',
      email: client?.email || '',
      phone: contactPhoneNumber || '',
      isPrimary: true
    });
    
    // Find all contact_card type custom fields and extract contacts
    if (!customFieldsLoading && customFieldsData && client) {
      const customFieldValues = client.customFieldValues as Record<string, any> || {};
      
      customFieldsData.forEach((field: any) => {
        if (field.type === 'contact_card') {
          const contactCardValue = customFieldValues[field.id];
          if (Array.isArray(contactCardValue)) {
            contactCardValue.forEach((contact: any) => {
              if (contact && (contact.name || contact.email || contact.phone)) {
                contacts.push({
                  id: contact.id || `${field.id}-${contacts.length}`,
                  name: contact.name || 'Unnamed Contact',
                  position: contact.position || '',
                  email: contact.email || '',
                  phone: contact.phone || '',
                  isPrimary: false
                });
              }
            });
          }
        }
      });
    }
    
    return contacts;
  }, [client, customFieldsData, customFieldsLoading, contactDisplayName, contactPhoneNumber]);

  // Reset selectedContactIndex when availableContacts changes to prevent out-of-range
  useEffect(() => {
    if (selectedContactIndex >= availableContacts.length && availableContacts.length > 0) {
      setSelectedContactIndex(0);
    }
  }, [availableContacts.length, selectedContactIndex]);

  // Get the currently selected contact for communication with proper fallback
  const selectedContact = useMemo(() => {
    if (availableContacts.length === 0) {
      // Provide a default fallback during loading
      return {
        id: 'primary',
        name: contactDisplayName || client?.name || client?.company || 'Primary Contact',
        position: 'Primary Contact',
        email: client?.email || '',
        phone: contactPhoneNumber || '',
        isPrimary: true
      };
    }
    return availableContacts[selectedContactIndex] || availableContacts[0];
  }, [availableContacts, selectedContactIndex, client, contactDisplayName, contactPhoneNumber]);

  // Helper function to replace merge tags in text with actual client data
  const replaceMergeTags = (text: string) => {
    if (!text || !client) return text;
    
    // Get first and last name from custom fields
    let firstName = "";
    let lastName = "";
    
    if (customFieldsData) {
      const firstNameField = customFieldsData.find((field: any) => 
        field.name === 'First Name' || field.name === 'FirstName' || field.name === 'first name'
      );
      const lastNameField = customFieldsData.find((field: any) => 
        field.name === 'Last Name' || field.name === 'LastName' || field.name === 'last name'
      );
      
      const customFieldValues = client.customFieldValues as Record<string, any> || {};
      firstName = firstNameField ? customFieldValues[firstNameField.id] || "" : "";
      lastName = lastNameField ? customFieldValues[lastNameField.id] || "" : "";
    }
    
    // Replace common merge tags
    return text
      .replace(/{{first_name}}/gi, firstName || client.name?.split(' ')[0] || "")
      .replace(/{{last_name}}/gi, lastName || client.name?.split(' ').slice(1).join(' ') || "")
      .replace(/{{full_name}}/gi, firstName && lastName ? `${firstName} ${lastName}` : client.name || "")
      .replace(/{{email}}/gi, client.email || "")
      .replace(/{{phone}}/gi, client.phone || "")
      .replace(/{{company}}/gi, client.company || "");
  };

  // Fixed height for notes section to enable consistent scrolling
  const calculateNotesMaxHeight = () => {
    // Use a fixed height that works well for most screen sizes
    // This ensures the right column never grows taller than intended
    return '600px';
  };

  // Handle DND setting changes with admin-only uncheck restriction
  const handleDNDChange = (setting: 'dndAll' | 'dndEmail' | 'dndSms' | 'dndCalls', checked: boolean) => {
    // If trying to uncheck (disable DND) and user is not admin, prevent the action
    if (!checked && !canManageDndSettings) {
      toast({
        title: "Access Denied",
        description: "Only Administrators can disable Do Not Disturb settings",
        variant: "destructive",
      });
      return;
    }
    
    // Allow the change
    updateDNDMutation.mutate({ [setting]: checked });
  };

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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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

  // Handle delete product function
  const handleDeleteProduct = (productId: string) => {
    if (!canDeleteProducts) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete products",
        variant: "destructive",
      });
      return;
    }
    
    deleteProductMutation.mutate(productId);
  };

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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Appointment deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment",
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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

  // Handle edit task function
  const handleEditTask = (task: any) => {
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
  };

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
      queryClient.invalidateQueries({ queryKey: ['/api/bundle-details', 'all-client-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
      setEditingBundleQuantities(null);
      setTempQuantities({});
      toast({
        title: "Bundle customized",
        variant: "default",
        description: canViewCosts 
          ? `Bundle quantities updated. New cost: $${data.newCost?.toFixed(2)}` 
          : "Bundle quantities updated successfully",
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

  // Save quantity changes function
  const saveQuantityChanges = (bundleId: string) => {
    updateBundleQuantitiesMutation.mutate({
      bundleId,
      customQuantities: tempQuantities
    });
  };

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
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      setIsAssigningOwner(false);
      setOwnerSearchTerm("");
      toast({
        title: "Owner assigned",
        variant: "default",
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
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      setIsAddingFollowers(false);
      setFollowerSearchTerm("");
      toast({
        title: "Followers updated",
        variant: "default",
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

  // Fetch audit logs for this client with pagination and filtering
  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['/api/audit-logs/entity/contact', clientId, currentPage, itemsPerPage, activityFilter, userFilter],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const filterParam = activityFilter !== 'all' ? `&filter=${encodeURIComponent(activityFilter)}` : '';
      const userParam = userFilter !== 'all' ? `&user=${encodeURIComponent(userFilter)}` : '';
      const timestampParam = `&t=${Date.now()}`;
      console.log('🔄 Making audit logs request with filter:', activityFilter, 'user:', userFilter);
      const response = await fetch(`/api/audit-logs/entity/contact/${clientId}?limit=${itemsPerPage}&offset=${offset}${filterParam}${userParam}${timestampParam}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      console.log('📊 Received audit logs data:', { count: data.logs?.length, filter: data.filter, user: data.user });
      return data;
    },
    enabled: !!clientId,
    staleTime: 0, // No caching for now
    cacheTime: 0, // Force fresh data
  });

  const auditLogs = auditLogsData?.logs || [];
  const totalActivities = auditLogsData?.total || 0;
  const hasMoreActivities = auditLogsData?.hasMore || false;
  const totalPages = Math.ceil(totalActivities / itemsPerPage);

  // Helper functions for communication history
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(messageId)) {
        newExpanded.delete(messageId);
      } else {
        newExpanded.add(messageId);
      }
      return newExpanded;
    });
  };

  // Memoized communications filtering to prevent re-render loops
  const communications = useMemo(() => {
    return auditLogs
      .filter(log => log.entityType === 'sms' || log.entityType === 'email' || log.entity_type === 'sms' || log.entity_type === 'email' || log.action === 'call')
      .filter(log => {
        if (commTypeFilter !== 'all') {
          const logType = log.entityType || log.entity_type;
          if (commTypeFilter === 'sms' && logType !== 'sms') return false;
          if (commTypeFilter === 'email' && logType !== 'email') return false;
        }
        if (commDirectionFilter !== 'all') {
          const isInbound = log.newValues?.direction === 'inbound';
          if (commDirectionFilter === 'inbound' && !isInbound) return false;
          if (commDirectionFilter === 'outbound' && isInbound) return false;
        }
        return true;
      })
      .filter(log => {
        if (!deferredCommunicationSearch.trim()) return true;
        const searchLower = deferredCommunicationSearch.toLowerCase();
        const messageContent = log.newValues?.message || log.details || '';
        const phoneNumber = log.newValues?.to || log.newValues?.from || '';
        const details = log.details || '';
        return messageContent.toLowerCase().includes(searchLower) || 
               phoneNumber.includes(searchLower) ||
               details.toLowerCase().includes(searchLower);
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, deferredCommunicationSearch, commTypeFilter, commDirectionFilter]);

  const threadedCommunications = useMemo(() => {
    const threads: Record<string, typeof communications> = {};
    const threadMeta: Record<string, { type: 'sms' | 'email'; participants: string[] }> = {};
    for (const msg of communications) {
      const logType = msg.entityType || msg.entity_type;
      let threadKey: string;
      let participants: string[];
      if (logType === 'sms' || msg.action === 'call') {
        const to = (msg.newValues?.to || '').trim();
        const from = (msg.newValues?.from || '').trim();
        const nums = [to, from].filter(Boolean).sort();
        if (nums.length === 0) {
          threadKey = `sms:__orphan__${msg.id}`;
          participants = ['Unknown'];
        } else {
          threadKey = `sms:${JSON.stringify(nums)}`;
          participants = nums;
        }
        threadMeta[threadKey] = { type: 'sms', participants };
      } else {
        const to = (msg.newValues?.to || msg.newValues?.recipientEmail || '').trim().toLowerCase();
        const from = (msg.newValues?.from || msg.newValues?.senderEmail || '').trim().toLowerCase();
        const addrs = [to, from].filter(Boolean).sort();
        if (addrs.length === 0) {
          threadKey = `email:__orphan__${msg.id}`;
          participants = ['Unknown'];
        } else {
          threadKey = `email:${JSON.stringify(addrs)}`;
          participants = addrs;
        }
        threadMeta[threadKey] = { type: 'email', participants };
      }
      if (!threads[threadKey]) threads[threadKey] = [];
      threads[threadKey].push(msg);
    }
    return Object.entries(threads).map(([key, msgs]) => ({
      threadKey: key,
      messages: msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      latestTimestamp: Math.max(...msgs.map(m => new Date(m.timestamp).getTime())),
      type: threadMeta[key].type,
      participants: threadMeta[key].participants,
      messageCount: msgs.length,
    })).sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [communications]);

  const toggleThread = (threadKey: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadKey)) next.delete(threadKey);
      else next.add(threadKey);
      return next;
    });
  };

  const totalCommunications = threadedCommunications.length;
  const totalCommPages = Math.ceil(totalCommunications / commItemsPerPage);
  const paginatedThreads = threadedCommunications.slice(
    (commCurrentPage - 1) * commItemsPerPage,
    commCurrentPage * commItemsPerPage
  );

  // Reset page when filter changes
  const handleFilterChange = (newFilter: typeof activityFilter) => {
    console.log('🔄 Filter changing from', activityFilter, 'to', newFilter);
    setActivityFilter(newFilter);
    setCurrentPage(1);
    // Force invalidate the cache
    queryClient.invalidateQueries({ 
      queryKey: ['/api/audit-logs/entity/contact', clientId]
    });
  };

  // Reset page when user filter changes
  const handleUserFilterChange = (newUserFilter: string) => {
    console.log('🔄 User filter changing from', userFilter, 'to', newUserFilter);
    setUserFilter(newUserFilter);
    setCurrentPage(1);
    // Force invalidate the cache
    queryClient.invalidateQueries({ 
      queryKey: ['/api/audit-logs/entity/contact', clientId]
    });
  };

  // Manual activity logging mutation
  const logActivityMutation = useMutation({
    mutationFn: async ({ activityType, description }: { activityType: string; description: string }) => {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      const activityDetails = activityType === 'general' 
        ? description 
        : `${activityType.charAt(0).toUpperCase() + activityType.slice(1)}: ${description}`;
      
      const payload = {
        entityType: 'contact',
        entityId: clientId,
        entityName: client?.firstName && client?.lastName 
          ? `${client.firstName} ${client.lastName}` 
          : client?.companyName || 'Unknown Client',
        action: 'manual_log',
        details: activityDetails,
        userId: currentUser.id
      };
      
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to log activity');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs/entity/contact', clientId] });
      setShowLogActivityModal(false);
      setLogActivityDescription('');
      setLogActivityType('general');
      toast({
        title: "Activity logged",
        variant: "default",
        description: "Manual activity has been logged successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to log activity: ${error.message}`,
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
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs/entity/contact', clientId] });
      toast({
        title: "Communication preferences updated",
        variant: "default",
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
      const newSections = calculatedSections.map(section => ({
        ...section,
        isOpen: false  // All sections closed by default
      }));
      
      // Replace the default sections with calculated ones from custom field folders
      setSections(newSections);
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
  useEffect(() => {
    if (!followerSearchTerm || !staffData || !client) {
      setFilteredFollowers([]);
      setShowFollowerSuggestions(false);
      return;
    }

    const currentFollowers = client.followers || [];
    const clientContactOwner = client.contactOwner;
    const filtered = staffData.filter((staff: any) => 
      !currentFollowers.includes(staff.id) && // Exclude already following staff
      staff.id !== clientContactOwner && // Exclude current owner
      (`${staff.firstName} ${staff.lastName}`.toLowerCase().includes(followerSearchTerm.toLowerCase()) ||
       staff.email?.toLowerCase().includes(followerSearchTerm.toLowerCase()))
    );
    setFilteredFollowers(filtered);
    setShowFollowerSuggestions(filtered.length > 0);
  }, [followerSearchTerm, staffData, client?.followers, client?.contactOwner]);

  // STABLE email auto-population using memoized values to prevent infinite loops
  const stableUserEmail = useMemo(() => currentUser?.email || '', [currentUser?.email]);
  const stableUserName = useMemo(() => {
    return `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();
  }, [currentUser?.firstName, currentUser?.lastName]);
  const stableClientEmail = useMemo(() => client?.email || '', [client?.email]);

  // Auto-populate email fields ONCE when stable values are available
  useEffect(() => {
    if (stableUserEmail && stableUserName) {
      setEmailData(prev => {
        const updates: any = {};
        
        // Only update if currently empty (don't override user input)
        if (!prev.fromName) updates.fromName = stableUserName;
        if (!prev.fromEmail) updates.fromEmail = stableUserEmail;
        if (!prev.to && stableClientEmail) updates.to = stableClientEmail;
        
        // Only update if there are actual changes
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [stableUserEmail, stableUserName, stableClientEmail]);

  // Track what's resetting the modal
  useEffect(() => {
    if (!showSendModal) {
      console.log('❌ MODAL RESET TO FALSE - Stack trace:');
      console.trace();
    }
  }, [showSendModal]);

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

  // NOTE: SMS phone number is displayed directly from client?.phone, no need to store in state

  // Email utility functions (removed duplicate)

  const clearEmailMessage = useCallback(() => {
    setEmailData(prev => ({ ...prev, message: '' }));
  }, []);

  const handleQuillChange = useCallback((value: string) => {
    handleEmailFieldChange('message', value);
  }, [handleEmailFieldChange]);

  // SMS utility functions (removed duplicate)

  const clearSmsMessage = useCallback(() => {
    setSmsData(prev => ({ ...prev, message: '' }));
  }, []);

  const insertSmsTag = (tag: string) => {
    const newMessage = smsData.message + `{{${tag}}}`;
    setSmsData(prev => ({ ...prev, message: newMessage }));
    setShowSmsMergeTagsModal(false);
  };

  const selectSmsTemplate = (content: string, templateName: string) => {
    setSmsData(prev => ({ ...prev, message: content }));
    setShowSmsTemplateModal(false);
  };

  // Removed duplicate handleSendSms function

  const insertMergeTag = (tag: string) => {
    const newMessage = emailData.message + `{{${tag}}}`;
    setEmailData(prev => ({ ...prev, message: newMessage }));
    setShowMergeTagsModal(false);
  };

  const selectTemplate = (templateContent: string, templateName: string, templatePreviewText?: string) => {
    setEmailData(prev => ({ 
      ...prev, 
      message: templateContent, 
      subject: templateName,
      previewText: templatePreviewText || ""
    }));
    setShowTemplateModal(false);
    toast({
      title: "Template Applied",
      variant: "default",
      description: `"${templateName}" template has been loaded into your email.`,
    });
  };

  const handleSendEmail = () => {
    console.log('🎯 SEND EMAIL BUTTON CLICKED - Sending directly...');
    // Bypass modal and send email directly for now
    sendEmailNow();
  };

  const sendEmailNow = async () => {
    console.log('🚀 SEND NOW BUTTON CLICKED - Starting email send process...');
    
    // Get all selected contacts with email addresses
    const selectedContacts = selectedEmailContactIndices
      .map(index => availableContacts[index])
      .filter(contact => contact?.email);
    
    // Fallback to single contact if no multi-select
    const recipients = selectedContacts.length > 0 
      ? selectedContacts 
      : [{ email: selectedContact?.email || client?.email, name: selectedContact?.name || client?.name }].filter(r => r.email);
    
    try {
      // Validate required fields
      if (!emailData.fromEmail || !emailData.subject.trim() || !emailData.message.trim() || recipients.length === 0) {
        toast({
          title: "Missing Information",
          description: recipients.length === 0 
            ? "Please select at least one contact with an email address."
            : "Please fill in all required fields: from email, subject, and message.",
          variant: "destructive",
        });
        return;
      }

      // Check DND settings before sending
      if (client?.dndAll || client?.dndEmail) {
        toast({
          title: "Cannot Send Email",
          description: `${client?.name} has email communications disabled (DND active)`,
          variant: "destructive",
        });
        return;
      }

      // Send email to all selected contacts
      let successCount = 0;
      let errorCount = 0;
      
      for (const recipient of recipients) {
        try {
          const response = await apiRequest('POST', '/api/communications/send-email', {
            to: recipient.email,
            subject: emailData.subject,
            previewText: emailData.previewText,
            message: emailData.message,
            fromEmail: emailData.fromEmail,
            fromName: emailData.fromName,
            clientId: client.id
          });
          await response.json();
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast({
          title: "Email Sent Successfully",
          variant: "default",
          description: successCount === 1 
            ? `Email sent to ${recipients[0]?.name} (${recipients[0]?.email})`
            : `Email sent to ${successCount} contacts.`,
        });
      
        // Clear the form after successful send
        setEmailData({
          fromEmail: emailData.fromEmail, // Keep from email
          fromName: emailData.fromName,   // Keep from name
          subject: "",                    // Clear subject
          previewText: "",                // Clear preview text
          message: ""                     // Clear message
        } as any);
      
        setShowSendModal(false);
      }
      
      if (errorCount > 0) {
        toast({
          variant: "destructive",
          title: "Partial Failure",
          description: `Failed to send email to ${errorCount} contact(s).`
        });
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending your email. Please try again or check your MailGun configuration.",
        variant: "destructive",
      });
    }
  };

  const scheduleEmail = async () => {
    console.log("🚀 scheduleEmail function called!");
    const recipientEmail = selectedContact?.email || client?.email;
    const recipientName = selectedContact?.name || client?.name;
    
    console.log("📊 Current state:", {
      emailData,
      scheduledDate,
      scheduledTime,
      scheduledTimezone,
      recipientEmail
    });
    
    try {
      // Validate required fields
      if (!emailData.fromEmail || !emailData.subject.trim() || !emailData.message.trim() || !recipientEmail || !scheduledDate || !scheduledTime) {
        console.log("❌ Validation failed - missing fields");
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields: from email, subject, message, date, and time.",
          variant: "destructive",
        });
        return;
      }

      // Check DND settings before scheduling
      if (client?.dndAll || client?.dndEmail) {
        toast({
          title: "Cannot Schedule Email",
          description: `${client?.name} has email communications disabled (DND active)`,
          variant: "destructive",
        });
        return;
      }

      // Create scheduled date/time
      const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      
      // Check if scheduled time is in the past
      if (scheduleDateTime <= now) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Scheduled time must be in the future."
        });
        return;
      }

      // Schedule email through API (fromUserId will be derived from authenticated session)
      const response = await apiRequest('POST', '/api/scheduled-emails', {
        clientId: client.id,
        toEmail: recipientEmail,
        subject: emailData.subject,
        previewText: emailData.previewText,
        content: emailData.message,
        plainTextContent: emailData.message, // For now, use same content for plain text
        scheduledFor: scheduleDateTime.toISOString(),
        timezone: scheduledTimezone || 'UTC',
        status: 'pending'
      });

      const result = await response.json();
      
      toast({
        title: "Email Scheduled Successfully",
        variant: "default",
        description: `Email scheduled for ${recipientName} on ${scheduledDate} at ${scheduledTime} (${scheduledTimezone})`,
      });
      
      // Clear the form after successful scheduling
      setEmailData({
        fromEmail: emailData.fromEmail, // Keep from email
        fromName: emailData.fromName,   // Keep from name
        subject: "",                    // Clear subject
        previewText: "",                // Clear preview text
        message: ""                     // Clear message
      });
      
      setShowSendModal(false);
      
    } catch (error) {
      console.error('Error scheduling email:', error);
      toast({
        title: "Failed to Schedule Email",
        description: "There was an error scheduling your email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scheduleSms = async () => {
    if (!smsData.fromNumber || !smsData.message.trim() || !contactPhoneNumber || !scheduledDate || !scheduledTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields including date and time"
      });
      return;
    }

    const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    
    // Check if scheduled time is in the past
    if (scheduleDateTime <= now) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Scheduled time must be in the future."
      });
      return;
    }

    // For now, show a message that scheduling will be added later
    // In a real implementation, you'd want to either:
    // 1. Use a job queue/scheduler service
    // 2. Store in database and have a cron job process scheduled messages
    toast({
      title: "SMS Scheduled",
      description: `SMS scheduling feature will be available soon. For now, please send immediately or use your phone's scheduled text feature.`,
      variant: "destructive"
    });
    setShowSmsSendModal(false);
  };

  // Removed duplicate formatPhoneNumber function - using the one with Twilio formatting above

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
      variant: "default",
      description: `Message sent to ${client?.name}`,
    });
    setSmsMessage("");
  };

  const handleReplyToEmail = (log: any) => {
    const originalSubject = log.newValues?.subject || '';
    const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
    const replyTo = log.newValues?.direction === 'inbound'
      ? (log.newValues?.from || '')
      : (log.newValues?.to || '');

    setEmailData(prev => ({
      ...prev,
      subject: replySubject,
      message: '',
    }));

    setCommunicationTab('email');
    setActiveTab('communication');

    setTimeout(() => {
      emailComposeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
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
      variant: "default",
      description: `Email sent to ${client?.company || client?.name}`,
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
        variant: "default",
        description: `"${tagName}" has been added to ${client.company || client.name}`,
      });

      // Refresh client data
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
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
        variant: "default",
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
        variant: "default",
        description: `"${productName}" has been added to ${client.company || client.name}`,
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
        variant: "default",
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
    onSuccess: async (data) => {
      // Update the cache with the returned data to ensure immediate UI update
      queryClient.setQueryData([`/api/clients/${clientId}`], data);
      
      // Also invalidate to ensure fresh data on next fetch
      await queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      
      // Invalidate the clients list so the table view shows updated data
      await queryClient.invalidateQueries({ queryKey: ['/api/clients'], exact: false });
      
      toast({
        title: "Field Updated",
        variant: "default",
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
    setFieldEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue || ""));
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
    <>
      <div className="space-y-6">
        {/* Back Button and Next Client Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setLocation("/clients")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </Button>
        {nextClient && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(`/clients/${nextClient.id}`)} 
            className="flex items-center space-x-2"
          >
            <span>Next Client</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 
                      className={`text-3xl font-bold tracking-tight transition-colors duration-200 ${
                        healthStatus?.shouldHighlight && healthStatus.highlightType === 'red'
                          ? 'bg-red-50 border border-red-200 text-red-900 px-3 py-1 rounded-lg'
                          : healthStatus?.shouldHighlight && healthStatus.highlightType === 'yellow'
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-900 px-3 py-1 rounded-lg'
                          : 'text-gray-900'
                      }`}
                      data-testid="client-name-header"
                    >
                      {clientDisplayName}
                    </h1>
                  </TooltipTrigger>
                  {healthStatus?.shouldHighlight && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="text-sm">
                        <p className="font-medium">Health Alert</p>
                        <p className="text-xs mt-1">{healthStatus.reason}</p>
                        {healthStatus.weeks.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="font-medium">Last 4 weeks:</p>
                            {healthStatus.weeks.map((week, index) => (
                              <div key={week.weekStart} className="flex justify-between items-center">
                                <span>Week {index + 1}:</span>
                                <span className={`font-medium ${
                                  week.healthIndicator === 'Green' 
                                    ? 'text-green-600' 
                                    : week.healthIndicator === 'Yellow' 
                                    ? 'text-yellow-600' 
                                    : 'text-red-600'
                                }`}>
                                  {week.healthIndicator}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {contactDisplayName && <p className="text-muted-foreground">{contactDisplayName}</p>}
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
              {isAdmin ? (
                <Select
                  value={client.status}
                  onValueChange={async (newStatus) => {
                    try {
                      await apiRequest('PUT', `/api/clients/${clientId}`, { status: newStatus });
                      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
                      toast({
                        title: "Status updated",
                        description: `Client status changed to ${newStatus}`,
                        variant: "default"
                      });
                    } catch (error) {
                      toast({
                        title: "Error updating status",
                        description: "Failed to update client status",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[120px] h-8 text-sm border-primary text-primary" data-testid="select-client-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-primary border-primary">
                  {client.status}
                </Badge>
              )}
              <Badge variant="outline">
                {client.contactType}
              </Badge>
            </div>
          </div>
        </div>
      </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-8 bg-transparent border-0 rounded-none h-auto p-0">
              <TabsTrigger 
                value="contact" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <User className="h-4 w-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger 
                value="hub" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <Zap className="h-4 w-4" />
                Client Hub
              </TabsTrigger>
              <TabsTrigger 
                value="roadmap" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
                data-testid="tab-roadmap"
              >
                <Map className="h-4 w-4" />
                Roadmap
              </TabsTrigger>
              <TabsTrigger 
                value="health" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <Activity className="h-4 w-4" />
                Client Health
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <ShoppingCart className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger 
                value="communication" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <MessageSquare className="h-4 w-4" />
                Communication
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="flex items-center gap-2 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 -mb-0.5"
              >
                <Clock className="h-4 w-4" />
                Recent Activity
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
                                placeholderText={field.placeholderText}
                                tooltipText={field.tooltipText}
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
                  <div
                    onClick={() => setActionsExpanded(prev => ({ ...prev, tags: !prev.tags }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer"
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
                  </div>
                  {actionsExpanded.tags && (
                    <div className="mt-3 space-y-2">
                      {client.tags && client.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {client.tags.map((tagName, index) => {
                            const tag = tagsData.find((t: Tag) => t.name === tagName);
                            return (
                              <Badge
                                key={`tag-${tagName}-${index}`}
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

                      {/* Tag Input */}
                      {isAddingTag && (
                        <div className="relative mt-2">
                          <Input
                            placeholder="Type tag name..."
                            value={newTagName}
                            onChange={(e) => handleTagInputChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTagName.trim()) {
                                e.preventDefault();
                                createNewTag();
                              } else if (e.key === 'Escape') {
                                setIsAddingTag(false);
                                setNewTagName('');
                                setShowSuggestions(false);
                              }
                            }}
                            autoFocus
                            className="text-sm"
                            data-testid="input-add-tag"
                          />
                          {showSuggestions && filteredTags.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                              {filteredTags.map((tag: Tag) => (
                                <div
                                  key={tag.id}
                                  onClick={() => selectExistingTag(tag.name)}
                                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex items-center gap-2"
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                                  />
                                  {tag.name}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsAddingTag(false);
                                setNewTagName('');
                                setShowSuggestions(false);
                              }}
                              data-testid="button-cancel-add-tag"
                            >
                              Cancel
                            </Button>
                            {newTagName.trim() && !filteredTags.some((t: Tag) => t.name.toLowerCase() === newTagName.toLowerCase()) && (
                              <Button
                                size="sm"
                                onClick={createNewTag}
                                data-testid="button-create-tag"
                              >
                                Create "{newTagName}"
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Workflows Accordion */}
                <ClientWorkflowsSection 
                  clientId={client.id}
                  actionsExpanded={actionsExpanded}
                  setActionsExpanded={setActionsExpanded}
                />
                
                
              </CardContent>
            </Card>

            {/* Onboarding Settings */}
            {isAdmin && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    Onboarding Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Onboarding Start Date</Label>
                    <Popover open={onboardingStartDateOpen} onOpenChange={setOnboardingStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !client.onboardingStartDate && "text-muted-foreground"
                          )}
                          data-testid="button-onboarding-start-date"
                        >
                          {client.onboardingStartDate ? (
                            format(new Date(client.onboardingStartDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarUI
                          mode="single"
                          selected={client.onboardingStartDate ? new Date(client.onboardingStartDate) : undefined}
                          onSelect={async (date) => {
                            setOnboardingStartDateOpen(false);
                            try {
                              const value = date ? date.toISOString() : null;
                              await apiRequest('PUT', `/api/clients/${clientId}`, { onboardingStartDate: value });
                              queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
                              toast({ title: value ? "Onboarding start date set" : "Onboarding start date cleared", variant: "default" });
                            } catch (error) {
                              toast({ title: "Failed to update onboarding start date", variant: "destructive" });
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">When onboarding tasks begin for this client</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Weeks Released</Label>
                    <Select
                      value={String(client.onboardingWeekReleased || 0)}
                      onValueChange={async (val) => {
                        try {
                          await apiRequest('PUT', `/api/clients/${clientId}`, { onboardingWeekReleased: parseInt(val) });
                          queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
                          toast({ title: `Onboarding weeks released: ${val}`, variant: "default" });
                        } catch (error) {
                          toast({ title: "Failed to update weeks released", variant: "destructive" });
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{i === 0 ? '0 (Not started)' : `${i} week${i > 1 ? 's' : ''}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">How many weeks of onboarding tasks are visible in the client portal</p>
                  </div>
                </CardContent>
              </Card>
            )}


          </div>

          {/* Middle Column - Client Brief & Communication */}
          <div className="lg:col-span-5 space-y-6">
            {/* Client Brief Sections - Dynamic from API */}
            {isLoadingBriefSections ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="text-gray-500">Loading client brief sections...</div>
                  </div>
                </CardContent>
              </Card>
            ) : briefSections.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No brief sections configured</h3>
                    <p className="text-gray-500">Contact your administrator to configure client brief sections.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Accordion type="multiple" className="w-full" data-testid="accordion-client-brief">
                    {briefSections
                      .filter((section: any) => section.isEnabled) // Only show enabled sections
                      .map((section: any) => {
                        const isEditing = editingSections.has(section.id);
                        const IconComponent = iconMap[section.icon] || FileText;
                        const currentContent = editingContent[section.id] ?? section.value ?? "";
                        
                        return (
                          <AccordionItem key={section.id} value={section.id} data-testid={`accordion-item-${section.key}`}>
                            <div className="flex items-center justify-between px-6">
                              <AccordionTrigger className="flex-1 hover:no-underline" data-testid={`accordion-trigger-${section.key}`}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                  <span className="text-lg font-semibold text-gray-900">{section.title}</span>
                                </div>
                              </AccordionTrigger>
                              <div className="flex items-center gap-2 ml-4">
                                {!isEditing ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEditingSections(prev => new Set([...prev, section.id]));
                                          }}
                                          data-testid={`button-edit-${section.key}`}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Edit</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingSections(prev => {
                                          const next = new Set(prev);
                                          next.delete(section.id);
                                          return next;
                                        });
                                        const resetVal = section.value;
                                        setEditingContent(prev => ({
                                          ...prev,
                                          [section.id]: (resetVal != null && resetVal.trim() !== '') ? resetVal : (section.defaultTemplate ?? "")
                                        }));
                                      }}
                                      data-testid={`button-cancel-${section.key}`}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updateClientBriefSectionMutation.mutate({
                                          sectionId: section.id,
                                          content: currentContent
                                        });
                                      }}
                                      disabled={updateClientBriefSectionMutation.isPending}
                                      data-testid={`button-save-${section.key}`}
                                    >
                                      <Save className="h-4 w-4 mr-2" />
                                      {updateClientBriefSectionMutation.isPending ? "Saving..." : "Save"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <AccordionContent className="px-6 pb-6">
                              {isEditing ? (
                                <div className="border rounded-md">
                                  <RichTextEditor
                                    content={currentContent}
                                    onChange={(content) => {
                                      setEditingContent(prev => ({
                                        ...prev,
                                        [section.id]: content
                                      }));
                                    }}
                                    placeholder={section.placeholder || `Add ${section.title.toLowerCase()} information...`}
                                    className="min-h-[200px]"
                                    data-testid={`editor-${section.key}`}
                                  />
                                </div>
                              ) : (
                                <div className="min-h-[120px]">
                                  {currentContent ? (
                                    <div 
                                      className="prose prose-sm max-w-none text-gray-700"
                                      dangerouslySetInnerHTML={{ __html: currentContent }}
                                      data-testid={`content-${section.key}`}
                                    />
                                  ) : (
                                    <p className="text-gray-500 italic" data-testid={`placeholder-${section.key}`}>
                                      No {section.title.toLowerCase()} added yet. Click Edit to add {section.title.toLowerCase()} information.
                                    </p>
                                  )}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                </CardContent>
              </Card>
            )}




            {/* Send Options Modal - Custom Modal */}
            {console.log("🔍 RENDER CHECK: showSendModal =", showSendModal)}
            {showSendModal && <div style={{
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'red', 
              zIndex: 9999
            }}>
              <h1 style={{color: 'white', fontSize: '48px', textAlign: 'center', paddingTop: '200px'}}>
                ORIGINAL MODAL IS WORKING!
              </h1>
              <button 
                onClick={() => setShowSendModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '10px 20px',
                  fontSize: '16px'
                }}
              >
                CLOSE
              </button>
            </div>}

            {/* TEST MODAL - Completely separate state */}
            {console.log("🔍 TEST RENDER CHECK: testModalVisible =", testModalVisible)}
            {testModalVisible && <div style={{
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'blue', 
              zIndex: 9998
            }}>
              <h1 style={{color: 'white', fontSize: '48px', textAlign: 'center', paddingTop: '200px'}}>
                TEST MODAL IS WORKING!
              </h1>
              <button 
                onClick={() => setTestModalVisible(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '10px 20px',
                  fontSize: '16px'
                }}
              >
                CLOSE TEST
              </button>
            </div>}



            {/* SMS Send Options Modal */}
            <Dialog open={showSmsSendModal} onOpenChange={setShowSmsSendModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{smsModalMode === 'schedule-only' ? 'Schedule SMS' : 'Send SMS'}</DialogTitle>
                  <p className="text-xs text-gray-500">Modal state: {showSmsSendModal ? 'OPEN' : 'CLOSED'}</p>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {smsModalMode === 'both' && (
                      <>
                        <Button
                          onClick={handleSendSms}
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
                      </>
                    )}
                    
                    <div className="space-y-3">
                      {smsModalMode === 'both' && <h4 className="font-medium">Schedule SMS</h4>}
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
                          onClick={scheduleSms}
                          disabled={!scheduledDate || !scheduledTime}
                          className="flex-1"
                          data-testid="button-confirm-schedule-sms"
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
        </div>

        </TabsContent>

        <TabsContent value="products" className="space-y-6 mt-6" key="main-products-tab">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">Products & Services</CardTitle>
                  <div className="flex gap-2">
                    {isAdminOrManager && (
                      <Button
                        onClick={() => setShowGenerateTasksModal(true)}
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Tasks
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setShowImportQuoteModal(true);
                        setSelectedImportQuoteId('');
                      }}
                      size="sm"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Import from Quote
                    </Button>
                    <Button
                      onClick={() => setShowAddProductModal(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-add-product"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </div>
                {clientProductsData && clientProductsData.length > 0 && canViewCosts && (
                  <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-gray-600">Monthly Cost</span>
                      </div>
                      <div className="text-lg font-bold text-primary" data-testid="text-monthly-cost">
                        ${monthlyCost.toFixed(2)}
                      </div>
                    </div>
                    {oneTimeCost > 0 && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-medium text-gray-600">One-Time (Onboarding) Cost</span>
                        </div>
                        <div className="text-lg font-bold text-orange-500" data-testid="text-onetime-cost">
                          ${oneTimeCost.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {clientProductsData && clientProductsData.length > 0 ? (
                  <div className="space-y-4">
                    {clientProductsData.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {product.itemType === 'bundle' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedBundles);
                                    if (newExpanded.has(product.productId)) {
                                      newExpanded.delete(product.productId);
                                    } else {
                                      newExpanded.add(product.productId);
                                    }
                                    setExpandedBundles(newExpanded);
                                  }}
                                  className="p-0 h-auto"
                                  data-testid={`button-expand-bundle-${product.id}`}
                                >
                                  {expandedBundles.has(product.productId) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <h4 className="font-medium text-gray-900" data-testid={`text-product-name-${product.id}`}>
                                {product.productName || product.name}
                                {product.itemType === 'bundle' && (
                                  <span className="ml-2 text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                    Bundle
                                  </span>
                                )}
                                {product.itemType === 'bundle' && (
                                  <span className={`ml-1 text-xs px-2 py-1 rounded-full ${
                                    product.bundleCostType === 'one_time' 
                                      ? 'bg-orange-100 text-orange-800' 
                                      : 'bg-teal-100 text-teal-800'
                                  }`}>
                                    {product.bundleCostType === 'one_time' ? 'One-Time' : 'Monthly'}
                                  </span>
                                )}
                              </h4>
                            </div>
                            {(product.productDescription || product.description) && (
                              <p className="text-sm text-gray-600 mt-1" data-testid={`text-product-description-${product.id}`}>
                                {product.productDescription || product.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              {product.itemType === 'bundle' && canViewCosts && (
                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded" data-testid={`text-bundle-total-${product.id}`}>
                                  Bundle Total: ${calculateIndividualBundleCost(product.productId).toFixed(2)}
                                </span>
                              )}
                              {product.price && product.itemType !== 'bundle' && canViewCosts && (
                                <span className="text-sm font-medium text-green-600" data-testid={`text-product-price-${product.id}`}>
                                  ${product.price}
                                </span>
                              )}
                              {product.category && (
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full" data-testid={`text-product-category-${product.id}`}>
                                  {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* Only show bundle edit button for Managers and Admins */}
                            {canViewCosts && product.itemType === 'bundle' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (editingBundleQuantities === product.productId) {
                                    setEditingBundleQuantities(null);
                                    setTempQuantities({});
                                  } else {
                                    setEditingBundleQuantities(product.productId);
                                    // Set current quantities as temp values
                                    const bundleDetails = bundleDetailsData[product.productId];
                                    if (bundleDetails) {
                                      const currentQuantities: Record<string, number> = {};
                                      bundleDetails.forEach((item: any) => {
                                        currentQuantities[item.productId] = item.quantity || 1;
                                      });
                                      setTempQuantities(currentQuantities);
                                    }
                                  }
                                }}
                                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                data-testid={`button-edit-quantities-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Only show edit button for Managers and Admins */}
                            {canViewCosts && product.itemType !== 'bundle' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: Implement product editing functionality
                                  console.log('Edit product:', product);
                                }}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Only show delete button for Managers and Admins */}
                            {canViewCosts && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.productId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-product-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Bundle Details - Show when expanded */}
                        {product.itemType === 'bundle' && expandedBundles.has(product.productId) && bundleDetailsData[product.productId] && (
                          <div className="mt-4 pl-6 border-l-2 border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Bundle Contents:</h5>
                            <div className="space-y-2">
                              {bundleDetailsData[product.productId].map((item: any) => (
                                <div key={item.productId} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">
                                    {item.productName}
                                    {editingBundleQuantities === product.productId ? (
                                      <input
                                        type="number"
                                        min="0"
                                        value={tempQuantities[item.productId] || item.quantity || 1}
                                        onChange={(e) => {
                                          const newQuantities = { ...tempQuantities };
                                          newQuantities[item.productId] = parseInt(e.target.value) || 0;
                                          setTempQuantities(newQuantities);
                                        }}
                                        className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                        data-testid={`input-quantity-${item.productId}`}
                                      />
                                    ) : (
                                      <span className="ml-2 text-primary">x{item.quantity || 1}</span>
                                    )}
                                  </span>
                                  {canViewCosts && (
                                    <span className="text-gray-500">
                                      ${(() => {
                                        // Handle various formats of cost fields (string, number, null, undefined)
                                        // Try multiple possible field names: productCost, cost, price, productPrice
                                        const costValue = item.productCost || item.cost || item.price || item.productPrice || 0;
                                        const cost = typeof costValue === 'string' ? parseFloat(costValue) : Number(costValue);
                                        const validCost = isNaN(cost) ? 0 : cost;
                                        const quantity = item.quantity || 1;
                                        const totalCost = validCost * quantity;
                                        return totalCost.toFixed(2);
                                      })()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {editingBundleQuantities === product.productId && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Save the quantities to the backend
                                      await apiRequest('PATCH', `/api/clients/${clientId}/bundles/${product.productId}/quantities`, {
                                        customQuantities: tempQuantities
                                      });
                                      
                                      // Invalidate cache to refresh data
                                      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
                                      queryClient.invalidateQueries({ queryKey: ['/api/product-bundles', product.productId, 'products'] });
                                      queryClient.invalidateQueries({ queryKey: ['/api/bundle-details', 'all-client-bundles'] });
                                      
                                      // Close editing mode
                                      setEditingBundleQuantities(null);
                                      setTempQuantities({});
                                      
                                      // Show success message
                                      toast({
                                        title: "Success",
                                        variant: "default",
                                        description: "Bundle quantities updated successfully."
                                      });
                                    } catch (error) {
                                      console.error('Error saving bundle quantities:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to save bundle quantities. Please try again.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`button-save-quantities-${product.id}`}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingBundleQuantities(null);
                                    setTempQuantities({});
                                  }}
                                  data-testid={`button-cancel-quantities-${product.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="text-no-products">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h3>
                    <p className="text-gray-600 mb-6">Add your first product or service to get started.</p>
                    <Button
                      onClick={() => setShowAddProductModal(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-add-first-product"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {isAdminOrManager && <RecurringTasksSection clientId={clientId} />}
            {isAdminOrManager && <TaskGenerationHistory clientId={clientId} />}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 mt-6">
          <ClientBillingTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          {/* Activity Filter */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={activityFilter} onValueChange={(value) => handleFilterChange(value as typeof activityFilter)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activity</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="contact">Client Updates</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="campaign">Campaign</SelectItem>
                        <SelectItem value="workflow">Workflow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <Select value={userFilter} onValueChange={handleUserFilterChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {staffData.map((staff: any) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : staff.name || 'Unknown User'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : auditLogs.length > 0 ? (
                  <>
                    {auditLogs
                      .map((log) => (
                      <div key={log.id} className="border-l-2 border-gray-200 pl-4 pb-4" data-testid={`activity-item-${log.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {log.action === 'call' && <Phone className="h-4 w-4 text-green-600" />}
                            {log.entityType === 'email' && log.action !== 'call' && <Mail className="h-4 w-4 text-blue-600" />}
                            {log.entityType === 'sms' && log.action !== 'call' && <MessageSquare className="h-4 w-4 text-primary" />}
                            {log.entityType === 'call' && log.action !== 'call' && <Phone className="h-4 w-4 text-green-600" />}
                            {log.entityType === 'meeting' && log.action !== 'call' && <Calendar className="h-4 w-4 text-purple-600" />}
                            {log.entityType === 'task' && log.action !== 'call' && <CheckCircle className="h-4 w-4 text-orange-600" />}
                            {log.entityType === 'note' && log.action !== 'call' && <StickyNote className="h-4 w-4 text-yellow-600" />}
                            {log.entityType === 'campaign' && log.action !== 'call' && <Target className="h-4 w-4 text-red-600" />}
                            {log.entityType === 'workflow' && log.action !== 'call' && <Workflow className="h-4 w-4 text-indigo-600" />}
                            {log.entityType === 'contact' && log.action !== 'call' && <User className="h-4 w-4 text-blue-600" />}
                            {!['email', 'sms', 'call', 'meeting', 'task', 'note', 'campaign', 'workflow', 'contact'].includes(log.entityType) && log.action !== 'call' && 
                              <Activity className="h-4 w-4 text-gray-600" />
                            }
                            <h4 className="font-medium text-gray-900 capitalize" data-testid={`activity-type-${log.id}`}>
                              {log.action === 'call' ? 'Client Call' :
                               log.entityType === 'contact' ? 'Client Update' : 
                               log.entityType === 'email' ? 'Email Sent' :
                               log.entityType === 'sms' ? 'SMS Sent' : 
                               `${log.entityType} Activity`}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.userId && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" data-testid={`activity-user-${log.id}`}>
                                By: {log.userName || log.userId}
                              </span>
                            )}
                            <span className="text-sm text-gray-500" data-testid={`activity-timestamp-${log.id}`}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1" data-testid={`activity-description-${log.id}`}>
                          {log.entityType === 'sms' 
                            ? (log.newValues?.direction === 'inbound' 
                              ? `SMS received from ${log.newValues?.from || 'unknown'}` 
                              : `SMS message sent to ${log.newValues?.to || 'client'}`)
                            : (log.details || log.description)
                          }
                        </p>
                        {log.changedFields && log.changedFields.length > 0 && (
                          <div className="text-xs text-gray-500 mt-2">
                            Changed: {log.changedFields.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Pagination for Activity */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, totalActivities)} of{' '}
                        {totalActivities} activities
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          data-testid="button-prev-activity"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages || !hasMoreActivities}
                          data-testid="button-next-activity"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                    <p className="text-gray-600">Activity and timeline will appear here as you interact with this client.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="communication" className="space-y-6 mt-6">
            {/* DND Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Do Not Disturb Settings</CardTitle>
                <p className="text-sm text-gray-600">Manage communication preferences for this client</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dnd-all" className="text-sm font-medium">Block All Communications</Label>
                      <p className="text-xs text-gray-500">Prevents all emails, SMS, and calls</p>
                    </div>
                    <Switch
                      id="dnd-all"
                      checked={client?.dndAll || false}
                      onCheckedChange={(checked) => handleDNDChange('dndAll', checked)}
                      data-testid="switch-dnd-all"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dnd-email" className="text-sm font-medium">Block Emails</Label>
                      <p className="text-xs text-gray-500">Prevents email communications</p>
                    </div>
                    <Switch
                      id="dnd-email"
                      checked={client?.dndEmail || false}
                      onCheckedChange={(checked) => handleDNDChange('dndEmail', checked)}
                      disabled={client?.dndAll}
                      data-testid="switch-dnd-email"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dnd-sms" className="text-sm font-medium">Block SMS</Label>
                      <p className="text-xs text-gray-500">Prevents SMS communications</p>
                    </div>
                    <Switch
                      id="dnd-sms"
                      checked={client?.dndSms || false}
                      onCheckedChange={(checked) => handleDNDChange('dndSms', checked)}
                      disabled={client?.dndAll}
                      data-testid="switch-dnd-sms"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dnd-calls" className="text-sm font-medium">Block Calls</Label>
                      <p className="text-xs text-gray-500">Prevents phone calls</p>
                    </div>
                    <Switch
                      id="dnd-calls"
                      checked={client?.dndCalls || false}
                      onCheckedChange={(checked) => handleDNDChange('dndCalls', checked)}
                      disabled={client?.dndAll}
                      data-testid="switch-dnd-calls"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Communication Tabs for SMS and Email */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Send Communication</CardTitle>
                <Tabs value={communicationTab} onValueChange={(value) => setCommunicationTab(value as 'sms' | 'email' | 'call')} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="call" className="flex items-center gap-2" data-testid="tab-call">
                      <Phone className="h-4 w-4" />
                      Call
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="flex items-center gap-2" data-testid="tab-sms">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-email">
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {/* Contact Selector - Available for call only (SMS and Email have their own multi-select) */}
                {availableContacts.length > 1 && communicationTab !== "sms" && communicationTab !== "email" && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Label className="text-sm font-medium mb-2 block">
                      <Users className="h-4 w-4 inline mr-2" />
                      Select Contact
                    </Label>
                    <Select 
                      value={selectedContactIndex.toString()} 
                      onValueChange={(value) => setSelectedContactIndex(parseInt(value))}
                    >
                      <SelectTrigger className="w-full" data-testid="select-communication-contact">
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContacts.map((contact, index) => (
                          <SelectItem key={contact.id} value={index.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {contact.name}
                                {contact.isPrimary && (
                                  <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                                )}
                              </span>
                              {contact.position && !contact.isPrimary && (
                                <span className="text-xs text-muted-foreground">{contact.position}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedContact && (
                      <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                        {selectedContact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{selectedContact.email}</span>
                          </div>
                        )}
                        {selectedContact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{selectedContact.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <Tabs value={communicationTab} className="w-full">
                  {/* Call Tab Content */}
                  <TabsContent value="call" className="space-y-4 mt-0">
                    {client?.dndAll || client?.dndCalls ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <PhoneOff className="h-4 w-4" />
                          <span className="font-medium">Call Communications Disabled</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          This client has call communications disabled. Disable DND to make calls.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-6">
                          <Phone className="h-12 w-12 mx-auto text-primary mb-4" />
                          <h3 className="text-lg font-medium mb-2">Browser-Based VoIP Calling</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Make calls directly from your browser using Twilio Voice.
                          </p>
                          
                          {selectedContact?.phone ? (
                            <div className="space-y-4">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <Label className="text-sm text-muted-foreground">
                                  Calling {selectedContact.name}
                                </Label>
                                <p className="text-lg font-medium">{selectedContact.phone}</p>
                              </div>
                              <CallButton
                                phoneNumber={selectedContact.phone}
                                leadId={client.id.toString()}
                                leadName={selectedContact.name || client.name || client.company || "Client"}
                                variant="button"
                                size="lg"
                                entityType="client"
                              />
                            </div>
                          ) : (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">No Phone Number</span>
                              </div>
                              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                                {availableContacts.length > 1 
                                  ? "This contact has no phone number. Select a different contact or add one to their profile."
                                  : "Add a phone number to this client's profile to enable calling."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* SMS Tab Content */}
                  <TabsContent value="sms" className="space-y-4 mt-0">
                    {client?.dndAll || client?.dndSms ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <PhoneOff className="h-4 w-4" />
                          <span className="font-medium">SMS Communications Disabled</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          This client has SMS communications disabled. Disable DND to send messages.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sms-from">From Number</Label>
                            <Select value={smsData.fromNumber} onValueChange={(value) => handleSmsFieldChange('fromNumber', value)}>
                              <SelectTrigger data-testid="select-sms-from">
                                <SelectValue placeholder="Select from number" />
                              </SelectTrigger>
                              <SelectContent>
                                {twilioNumbers?.map((number) => (
                                  <SelectItem key={number.id} value={number.phoneNumber}>
                                    {number.name ? `${number.name} - ${number.phoneNumber}` : number.phoneNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* SMS Contact Multi-Select with dropdown aesthetic */}
                          {availableContacts.length > 1 ? (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <Label className="text-sm font-medium mb-2 block">
                                <Users className="h-4 w-4 inline mr-2" />
                                Select Contacts
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between h-auto min-h-10 py-2"
                                  >
                                    <span className="text-left truncate">
                                      {selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length === 0 
                                        ? "Select contacts..."
                                        : selectedSmsContactIndices
                                            .filter(i => availableContacts[i]?.phone)
                                            .map(i => availableContacts[i]?.name)
                                            .join(", ")}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <div className="max-h-60 overflow-y-auto p-1">
                                    {availableContacts.map((contact, index) => (
                                      <label
                                        key={contact.id}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                          !contact.phone ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedSmsContactIndices.includes(index)}
                                          disabled={!contact.phone}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedSmsContactIndices(prev => [...prev, index]);
                                            } else {
                                              setSelectedSmsContactIndices(prev => prev.filter(i => i !== index));
                                            }
                                          }}
                                          className="rounded border-gray-300"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{contact.name}</span>
                                            {contact.isPrimary && (
                                              <Badge variant="outline" className="text-xs">Primary</Badge>
                                            )}
                                          </div>
                                          {contact.phone ? (
                                            <span className="text-xs text-muted-foreground">{contact.phone}</span>
                                          ) : (
                                            <span className="text-xs text-red-500">No phone number</span>
                                          )}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {/* Show selected contacts' phones */}
                              {selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                                  {selectedSmsContactIndices
                                    .filter(i => availableContacts[i]?.phone)
                                    .map(i => (
                                      <div key={availableContacts[i]?.id} className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        <span>{availableContacts[i]?.phone}</span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="sms-to">To</Label>
                              <Input
                                id="sms-to"
                                value={availableContacts[0]?.phone || ''}
                                disabled
                                className="bg-gray-50 dark:bg-gray-800"
                                data-testid="input-sms-to"
                              />
                            </div>
                          )}
                          
                          {/* Additional Recipients (Staff / Manual Numbers) */}
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium flex items-center gap-1">
                                <UserPlus className="h-4 w-4" />
                                Additional Recipients
                              </Label>
                              <span className="text-xs text-muted-foreground">Team members or other numbers</span>
                            </div>
                            
                            {additionalSmsNumbers.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {additionalSmsNumbers.map(entry => (
                                  <div key={entry.id} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-sm">
                                    <span className="font-medium">{entry.name}</span>
                                    <span className="text-muted-foreground text-xs">({entry.phone})</span>
                                    <button
                                      type="button"
                                      onClick={() => setAdditionalSmsNumbers(prev => prev.filter(n => n.id !== entry.id))}
                                      className="ml-1 text-gray-400 hover:text-red-500"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  placeholder="Enter phone number..."
                                  value={manualSmsNumber}
                                  onChange={(e) => setManualSmsNumber(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && manualSmsNumber.trim()) {
                                      e.preventDefault();
                                      const digits = manualSmsNumber.replace(/\D/g, '');
                                      if (digits.length >= 10) {
                                        const formatted = manualSmsNumber.trim();
                                        const normalized = formatPhoneNumber(formatted);
                                        const isDuplicate = additionalSmsNumbers.some(n => formatPhoneNumber(n.phone) === normalized);
                                        if (!isDuplicate) {
                                          setAdditionalSmsNumbers(prev => [...prev, {
                                            id: `manual-${Date.now()}`,
                                            name: formatted,
                                            phone: formatted
                                          }]);
                                        }
                                        setManualSmsNumber("");
                                      }
                                    }
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                disabled={!manualSmsNumber.trim() || manualSmsNumber.replace(/\D/g, '').length < 10}
                                onClick={() => {
                                  const formatted = manualSmsNumber.trim();
                                  const normalized = formatPhoneNumber(formatted);
                                  const isDuplicate = additionalSmsNumbers.some(n => formatPhoneNumber(n.phone) === normalized);
                                  if (!isDuplicate) {
                                    setAdditionalSmsNumbers(prev => [...prev, {
                                      id: `manual-${Date.now()}`,
                                      name: formatted,
                                      phone: formatted
                                    }]);
                                  }
                                  setManualSmsNumber("");
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                              <Popover open={showStaffSmsPicker} onOpenChange={setShowStaffSmsPicker}>
                                <PopoverTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="shrink-0">
                                    <Users className="h-3 w-3 mr-1" />
                                    Staff
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="end">
                                  <div className="p-2 border-b">
                                    <Input
                                      placeholder="Search staff..."
                                      value={staffSmsSearch}
                                      onChange={(e) => setStaffSmsSearch(e.target.value)}
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto p-1">
                                    {(staffData as any[])
                                      ?.filter((s: any) => s.isActive !== false && s.phone)
                                      ?.filter((s: any) => {
                                        if (!staffSmsSearch) return true;
                                        const search = staffSmsSearch.toLowerCase();
                                        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(search);
                                      })
                                      ?.filter((s: any) => !additionalSmsNumbers.some(n => n.id === `staff-${s.id}`))
                                      ?.map((s: any) => (
                                        <button
                                          key={s.id}
                                          type="button"
                                          className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                                          onClick={() => {
                                            setAdditionalSmsNumbers(prev => [...prev, {
                                              id: `staff-${s.id}`,
                                              name: `${s.firstName} ${s.lastName}`,
                                              phone: s.phone
                                            }]);
                                            setShowStaffSmsPicker(false);
                                            setStaffSmsSearch("");
                                          }}
                                        >
                                          <div>
                                            <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{s.phone}</div>
                                          </div>
                                          <Plus className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                      )) || null}
                                    {(staffData as any[])?.filter((s: any) => s.isActive !== false && s.phone)?.length === 0 && (
                                      <div className="p-3 text-sm text-muted-foreground text-center">No staff with phone numbers</div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor="sms-message">Message</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowSmsTemplateModal(true)}
                                  data-testid="button-sms-templates"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Templates
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowSmsMergeTagsModal(true)}
                                  data-testid="button-sms-merge-tags"
                                >
                                  <Hash className="h-3 w-3 mr-1" />
                                  Merge Tags
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              id="sms-message"
                              value={smsData.message}
                              onChange={(e) => {
                                handleSmsFieldChange('message', e.target.value);
                                setCharacterCount(e.target.value.length);
                              }}
                              placeholder="Type your message..."
                              rows={4}
                              className="resize-none"
                              data-testid="textarea-sms-message"
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className={`text-xs ${characterCount > 160 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {characterCount}/160 characters
                              </span>
                              <span className="text-xs text-gray-500">
                                ~{Math.ceil(characterCount / 160)} message{Math.ceil(characterCount / 160) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => {
                              setShowSmsChoiceModal(true);
                            }}
                            disabled={selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length === 0 && additionalSmsNumbers.length === 0}
                            className="w-full"
                            data-testid="button-send-sms"
                            title={
                              selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length === 0 && additionalSmsNumbers.length === 0
                                ? "Select at least one contact or add a phone number"
                                : `Send SMS to ${selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length + additionalSmsNumbers.length} recipient(s)`
                            }
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send SMS {(selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length + additionalSmsNumbers.length) > 1 && 
                              `(${selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length + additionalSmsNumbers.length})`}
                          </Button>
                        </div>
                        
                        
                        {/* Show helpful message when no contacts with phone are selected */}
                        {selectedSmsContactIndices.filter(i => availableContacts[i]?.phone).length === 0 && additionalSmsNumbers.length === 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-700 dark:text-yellow-400">
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span className="font-medium">Required to send SMS:</span>
                            </div>
                            <ul className="mt-1 ml-4 space-y-1 text-xs">
                              <li>
                                {availableContacts.length > 1 
                                  ? "• Select at least one contact with a phone number"
                                  : "• Client needs a phone number in their profile"}
                              </li>
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Email Tab Content */}
                  <TabsContent value="email" className="space-y-4 mt-0" ref={emailComposeRef}>
                    {client?.dndAll || client?.dndEmail ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <MailX className="h-4 w-4" />
                          <span className="font-medium">Email Communications Disabled</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          This client has email communications disabled. Disable DND to send emails.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="email-from-name">From Name</Label>
                              <Input
                                id="email-from-name"
                                value={emailData.fromName}
                                onChange={(e) => handleEmailFieldChange('fromName', e.target.value)}
                                placeholder="Your name"
                                data-testid="input-email-from-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email-from-email">From Email</Label>
                              <Input
                                id="email-from-email"
                                type="email"
                                value={emailData.fromEmail}
                                onChange={(e) => handleEmailFieldChange('fromEmail', e.target.value)}
                                placeholder="your@email.com"
                                data-testid="input-email-from-email"
                              />
                            </div>
                          </div>
                          
                          {/* Email Contact Multi-Select with dropdown aesthetic */}
                          {availableContacts.length > 1 ? (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <Label className="text-sm font-medium mb-2 block">
                                <Users className="h-4 w-4 inline mr-2" />
                                Select Contacts
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between h-auto min-h-10 py-2"
                                  >
                                    <span className="text-left truncate">
                                      {selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length === 0 
                                        ? "Select contacts..."
                                        : selectedEmailContactIndices
                                            .filter(i => availableContacts[i]?.email)
                                            .map(i => availableContacts[i]?.name)
                                            .join(", ")}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <div className="max-h-60 overflow-y-auto p-1">
                                    {availableContacts.map((contact, index) => (
                                      <label
                                        key={contact.id}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                          !contact.email ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedEmailContactIndices.includes(index)}
                                          disabled={!contact.email}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedEmailContactIndices(prev => [...prev, index]);
                                            } else {
                                              setSelectedEmailContactIndices(prev => prev.filter(i => i !== index));
                                            }
                                          }}
                                          className="rounded border-gray-300"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{contact.name}</span>
                                            {contact.isPrimary && (
                                              <Badge variant="outline" className="text-xs">Primary</Badge>
                                            )}
                                          </div>
                                          {contact.email ? (
                                            <span className="text-xs text-muted-foreground">{contact.email}</span>
                                          ) : (
                                            <span className="text-xs text-red-500">No email address</span>
                                          )}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {/* Show selected contacts' emails */}
                              {selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                                  {selectedEmailContactIndices
                                    .filter(i => availableContacts[i]?.email)
                                    .map(i => (
                                      <div key={availableContacts[i]?.id} className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        <span>{availableContacts[i]?.email}</span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="email-to">To</Label>
                              <Input
                                id="email-to"
                                value={availableContacts[0]?.email || ''}
                                disabled
                                className="bg-gray-50 dark:bg-gray-800"
                                data-testid="input-email-to"
                              />
                            </div>
                          )}
                          
                          {showCC && (
                            <div>
                              <Label htmlFor="email-cc">CC</Label>
                              <Input
                                id="email-cc"
                                type="email"
                                value={emailData.cc}
                                onChange={(e) => handleEmailFieldChange('cc', e.target.value)}
                                placeholder="cc@email.com"
                                data-testid="input-email-cc"
                              />
                            </div>
                          )}
                          
                          {showBCC && (
                            <div>
                              <Label htmlFor="email-bcc">BCC</Label>
                              <Input
                                id="email-bcc"
                                type="email"
                                value={emailData.bcc}
                                onChange={(e) => handleEmailFieldChange('bcc', e.target.value)}
                                placeholder="bcc@email.com"
                                data-testid="input-email-bcc"
                              />
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {!showCC && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCC(true)}
                                data-testid="button-show-cc"
                              >
                                + CC
                              </Button>
                            )}
                            {!showBCC && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowBCC(true)}
                                data-testid="button-show-bcc"
                              >
                                + BCC
                              </Button>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="email-subject">Subject</Label>
                            <Input
                              id="email-subject"
                              value={emailData.subject}
                              onChange={(e) => handleEmailFieldChange('subject', e.target.value)}
                              placeholder="Email subject"
                              data-testid="input-email-subject"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="email-preview-text">Preview Text</Label>
                            <Input
                              id="email-preview-text"
                              value={emailData.previewText}
                              onChange={(e) => handleEmailFieldChange('previewText', e.target.value)}
                              placeholder="Preview text (optional)"
                              data-testid="input-email-preview-text"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor="email-message">Message</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowTemplateModal(true)}
                                  data-testid="button-email-templates"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Templates
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowMergeTagsModal(true)}
                                  data-testid="button-email-merge-tags"
                                >
                                  <Hash className="h-3 w-3 mr-1" />
                                  Merge Tags
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowWysiwyg(!showWysiwyg)}
                                  data-testid="button-toggle-wysiwyg"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {showWysiwyg ? 'Simple' : 'Rich Text'}
                                </Button>
                              </div>
                            </div>
                            {showWysiwyg ? (
                              <div className="border rounded-md">
                                <RichTextEditor
                                  content={emailData.message}
                                  onChange={(content) => handleEmailFieldChange('message', content)}
                                  placeholder="Type your message..."
                                  className="min-h-[200px]"
                                  data-testid="editor-email-message"
                                />
                              </div>
                            ) : (
                              <Textarea
                                id="email-message"
                                value={emailData.message}
                                onChange={(e) => handleEmailFieldChange('message', e.target.value)}
                                placeholder="Type your message..."
                                rows={8}
                                className="resize-none"
                                data-testid="textarea-email-message"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          {/* CONSOLIDATED SEND EMAIL BUTTON - Same pattern as SMS */}
                          <Button
                            onClick={() => {
                              console.log("📧 CONSOLIDATED EMAIL BUTTON CLICKED!");
                              setShowEmailChoiceModal(true);
                              console.log("✅ setShowEmailChoiceModal(true) called");
                            }}
                            disabled={!emailData.fromEmail || !emailData.subject.trim() || !emailData.message.trim() || selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length === 0}
                            className="flex-1"
                            data-testid="button-send-email"
                            title={
                              selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length === 0
                                ? "Select at least one contact with an email address"
                                : `Send email to ${selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length} contact(s)`
                            }
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email {selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length > 1 && 
                              `(${selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length})`}
                          </Button>
                        </div>
                        
                        {/* Show helpful message when no contacts with email are selected */}
                        {selectedEmailContactIndices.filter(i => availableContacts[i]?.email).length === 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-700 dark:text-yellow-400">
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span className="font-medium">Required to send email:</span>
                            </div>
                            <ul className="mt-1 ml-4 space-y-1 text-xs">
                              <li>
                                {availableContacts.length > 1 
                                  ? "• Select at least one contact with an email address"
                                  : "• Client needs an email address in their profile"}
                              </li>
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Communication History */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Communication History</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search messages..."
                          value={communicationSearch}
                          onChange={(e) => {
                            setCommunicationSearch(e.target.value);
                            setCommCurrentPage(1);
                          }}
                          className="pl-10 w-64"
                          data-testid="input-communication-search"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" style={{ width: 'fit-content' }}>
                      {([{ value: 'all', label: 'All' }, { value: 'sms', label: 'SMS' }, { value: 'email', label: 'Email' }] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setCommTypeFilter(opt.value); setCommCurrentPage(1); }}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${commTypeFilter === opt.value ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                          style={commTypeFilter === opt.value ? { backgroundColor: 'hsl(179, 100%, 39%)' } : {}}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" style={{ width: 'fit-content' }}>
                      {([{ value: 'all', label: 'All' }, { value: 'outbound', label: 'Sent' }, { value: 'inbound', label: 'Received' }] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setCommDirectionFilter(opt.value); setCommCurrentPage(1); }}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${commDirectionFilter === opt.value ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                          style={commDirectionFilter === opt.value ? { backgroundColor: 'hsl(179, 100%, 39%)' } : {}}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-1">{communications.length} message{communications.length !== 1 ? 's' : ''} in {threadedCommunications.length} thread{threadedCommunications.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paginatedThreads.length > 0 ? (
                    <>
                      {paginatedThreads.map((thread) => {
                        const isThreadOpen = expandedThreads.has(thread.threadKey);
                        const latestMsg = thread.messages[0];
                        const latestIsInbound = latestMsg.newValues?.direction === 'inbound';
                        const latestType = latestMsg.entityType || latestMsg.entity_type;

                        return (
                          <div key={thread.threadKey} className="border rounded-lg overflow-hidden" data-testid={`thread-${thread.threadKey}`}>
                            {/* Thread Header */}
                            <button
                              onClick={() => toggleThread(thread.threadKey)}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${thread.type === 'sms' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {thread.type === 'sms' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">
                                      {thread.participants.join(' ↔ ')}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{thread.type === 'sms' ? 'SMS' : 'Email'}</Badge>
                                    {thread.messageCount > 1 && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{thread.messageCount} messages</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {latestIsInbound ? '← ' : '→ '}
                                    {(latestMsg.newValues?.message || latestMsg.details || '').replace(/<[^>]*>/g, '').slice(0, 100)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-400">{new Date(latestMsg.timestamp).toLocaleDateString()}</span>
                                {isThreadOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                              </div>
                            </button>

                            {/* Thread Messages */}
                            {isThreadOpen && (
                              <div className={`border-t max-h-[500px] overflow-y-auto ${thread.type === 'sms' ? 'bg-gray-50 px-4 py-3 space-y-1' : 'divide-y divide-gray-100'}`}>
                                {(() => {
                                  const sortedMsgs = [...thread.messages].sort(
                                    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                  );
                                  let lastDateStr = '';
                                  return sortedMsgs.map((log) => {
                                    const isInbound = log.newValues?.direction === 'inbound';
                                    const fullMessage = log.newValues?.message || log.details || '';
                                    const emailSubject = log.newValues?.subject || '';
                                    const logType = log.entityType || log.entity_type;
                                    const msgDate = new Date(log.timestamp);
                                    const dateStr = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    const timeStr = msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                    const showDateDivider = dateStr !== lastDateStr;
                                    lastDateStr = dateStr;

                                    if (thread.type === 'sms') {
                                      return (
                                        <div key={log.id}>
                                          {showDateDivider && (
                                            <div className="flex items-center justify-center my-3">
                                              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border text-[11px] text-gray-500 font-medium shadow-sm">
                                                <Calendar className="h-3 w-3" />
                                                {dateStr}
                                              </div>
                                            </div>
                                          )}
                                          <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-2`} data-testid={`message-card-${log.id}`}>
                                            <div className="max-w-[75%]">
                                              <div className={`rounded-2xl px-4 py-2.5 ${
                                                isInbound
                                                  ? 'bg-white border border-gray-200 rounded-bl-md'
                                                  : 'text-white rounded-br-md'
                                              }`} style={!isInbound ? { backgroundColor: 'hsl(179, 100%, 39%)' } : {}}>
                                                <p className={`text-sm whitespace-pre-wrap ${isInbound ? 'text-gray-800' : 'text-white'}`}>{fullMessage}</p>
                                              </div>
                                              <div className={`flex items-center gap-1.5 mt-1 ${isInbound ? '' : 'justify-end'}`}>
                                                <span className="text-[10px] text-gray-400">{timeStr}</span>
                                                {log.newValues?.status && (
                                                  <span className={`text-[10px] ${
                                                    log.newValues.status === 'delivered' ? 'text-green-500' :
                                                    log.newValues.status === 'failed' || log.newValues.status === 'undelivered' ? 'text-red-500' :
                                                    'text-gray-400'
                                                  }`}>
                                                    · {log.newValues.status}
                                                  </span>
                                                )}
                                                {!isInbound && log.userName && log.userName !== 'Unknown User' && (
                                                  <span className="text-[10px] text-gray-400">· {log.userName}</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={log.id} className="bg-white" data-testid={`message-card-${log.id}`}>
                                        <div className="px-5 py-4">
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                                isInbound ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                                              }`}>
                                                {isInbound
                                                  ? (log.newValues?.from || 'U').charAt(0).toUpperCase()
                                                  : (log.userName || 'A').charAt(0).toUpperCase()
                                                }
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                  {isInbound ? (log.newValues?.from || 'Unknown') : (log.userName || 'Agency')}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                  {isInbound && log.newValues?.to && (
                                                    <span>To: {log.newValues.to}</span>
                                                  )}
                                                  {!isInbound && log.newValues?.to && (
                                                    <span>To: {log.newValues.to}</span>
                                                  )}
                                                  {log.newValues?.status && (
                                                    <>
                                                      <span className="text-gray-300">·</span>
                                                      <span className={`${
                                                        log.newValues.status === 'delivered' || log.newValues.status === 'sent' ? 'text-green-600' :
                                                        log.newValues.status === 'failed' ? 'text-red-600' : 'text-gray-500'
                                                      }`}>{log.newValues.status}</span>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <span className="text-xs text-gray-400 shrink-0">{timeStr} · {dateStr}</span>
                                          </div>
                                          {emailSubject && (
                                            <p className="text-sm font-medium text-gray-800 mb-2">{emailSubject}</p>
                                          )}
                                          <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fullMessage) }} />
                                          <div className="mt-3 pt-3 border-t border-gray-100">
                                            <Button
                                              variant="default"
                                              size="sm"
                                              className="text-xs"
                                              style={{ backgroundColor: 'hsl(179, 100%, 39%)' }}
                                              onClick={() => handleReplyToEmail(log)}
                                            >
                                              <Reply className="h-3.5 w-3.5 mr-1.5" />
                                              Reply
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Pagination Controls */}
                      {totalCommPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-gray-500" data-testid="text-pagination-info">
                            Showing {((commCurrentPage - 1) * commItemsPerPage) + 1} to{' '}
                            {Math.min(commCurrentPage * commItemsPerPage, totalCommunications)} of{' '}
                            {totalCommunications} threads
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCommCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={commCurrentPage === 1}
                              data-testid="button-prev-communications"
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-gray-600" data-testid="text-current-page">
                              Page {commCurrentPage} of {totalCommPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCommCurrentPage(prev => Math.min(totalCommPages, prev + 1))}
                              disabled={commCurrentPage === totalCommPages}
                              data-testid="button-next-communications"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {communicationSearch.trim() || commTypeFilter !== 'all' || commDirectionFilter !== 'all' ? 'No Messages Found' : 'No Communication Yet'}
                      </h3>
                      <p className="text-gray-600">
                        {communicationSearch.trim() || commTypeFilter !== 'all' || commDirectionFilter !== 'all'
                          ? 'No messages match your current filters.'
                          : 'Communication history will appear here as you interact with this client.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6 mt-6">
            <RoadmapTabContent client={client} queryClient={queryClient} currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="health" className="space-y-6 mt-6">
            <ClientHealthTabContent clientId={clientId} />
          </TabsContent>

          <TabsContent value="hub" className="space-y-6 mt-6">
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
                          onClick={() => setActiveHubSection("notes")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "notes"
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
                          onClick={() => setActiveHubSection("tasks")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "tasks"
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
                          onClick={() => setActiveHubSection("appointments")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "appointments"
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
                          onClick={() => setActiveHubSection("documents")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "documents"
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
                          onClick={() => setActiveHubSection("team")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "team"
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
                          onClick={() => setActiveHubSection("meetings")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "meetings"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Meeting Agenda & Notes</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveHubSection("onboarding")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeHubSection === "onboarding"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Onboarding Form</p>
                      </TooltipContent>
                    </Tooltip>
                    
                  </div>
                </TooltipProvider>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Notes Section */}
                {activeHubSection === "notes" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notes</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsAddingNote(true)}
                      >
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

                    <div className="space-y-3 overflow-y-auto max-h-96">
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
                                  {canManageClientNotes && (
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-primary" 
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
                                          setDeletingNote(note);
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
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                                    {note.content}
                                  </p>
                                </div>
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
                {activeHubSection === "tasks" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Tasks</h3>
                      <Link href="/tasks">
                        <Button size="sm" variant="outline" data-testid="button-goto-tasks">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {/* Filters and Sorting */}
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                        <SelectTrigger className="h-9" data-testid="select-task-status-filter">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                        <SelectTrigger className="h-9" data-testid="select-task-priority-filter">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={taskAssigneeFilter} onValueChange={setTaskAssigneeFilter}>
                        <SelectTrigger className="h-9" data-testid="select-task-assignee-filter">
                          <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Assignees</SelectItem>
                          {staffData?.map((staff: any) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.firstName} {staff.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={taskSortBy} onValueChange={setTaskSortBy}>
                        <SelectTrigger className="h-9" data-testid="select-task-sort">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dueDate">Due Date (Asc)</SelectItem>
                          <SelectItem value="dueDateDesc">Due Date (Desc)</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters Button */}
                    {(taskStatusFilter !== "all" || taskPriorityFilter !== "all" || taskAssigneeFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTaskStatusFilter("all");
                          setTaskPriorityFilter("all");
                          setTaskAssigneeFilter("all");
                        }}
                        className="text-primary hover:text-primary/80"
                        data-testid="button-clear-task-filters"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Switch
                        id="show-completed"
                        checked={showCompletedTasks}
                        onCheckedChange={setShowCompletedTasks}
                      />
                      <Label htmlFor="show-completed" className="text-sm text-gray-600 dark:text-gray-400">
                        Show completed tasks
                      </Label>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {tasksLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-sm">Loading tasks...</div>
                        </div>
                      ) : filteredAndSortedTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No tasks found</p>
                          <p className="text-xs text-gray-400">Try adjusting your filters</p>
                        </div>
                      ) : (
                        filteredAndSortedTasks
                          .map((task: any) => (
                            <div 
                              key={task.id} 
                              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => window.open(`/tasks/${task.id}`, '_blank')}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={task.status === 'completed'}
                                  onCheckedChange={(checked) => {
                                    updateTaskStatusMutation.mutate({
                                      taskId: task.id,
                                      status: checked ? 'completed' : 'pending'
                                    });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {task.title}
                                    </h4>
                                    {task.isRecurring && (
                                      <Repeat className="h-3.5 w-3.5 text-primary flex-shrink-0" title="Recurring task" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    {task.dueDate && (
                                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    )}
                                    {task.assignedToUser && (
                                      <span>Assigned to: {task.assignedToUser.firstName} {task.assignedToUser.lastName}</span>
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

                {/* Appointments Section */}
                {activeHubSection === "appointments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Appointments</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsAppointmentModalOpen(true)}
                        data-testid="button-add-appointment"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {appointmentsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-sm">Loading appointments...</div>
                      </div>
                    ) : clientAppointmentsData && clientAppointmentsData.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {clientAppointmentsData.map((appointment: any) => (
                          <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">
                                  {replaceMergeTags(appointment.title)}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  {appointment.startTime && (
                                    <span>Date: {new Date(appointment.startTime).toLocaleDateString()}</span>
                                  )}
                                  {appointment.startTime && (
                                    <span>Time: {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                  {appointment.status && (
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      appointment.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {appointment.status}
                                    </span>
                                  )}
                                </div>
                                {appointment.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {appointment.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Edit/Delete Actions */}
                              <div className="flex items-center gap-2 ml-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAppointment(appointment);
                                    setIsAppointmentModalOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                  data-testid={`button-edit-appointment-${appointment.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingAppointment(appointment)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  data-testid={`button-delete-appointment-${appointment.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm">No appointments scheduled</p>
                        <p className="text-xs text-gray-400">Schedule an appointment to get started</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Section */}
                {activeHubSection === "documents" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Documents</h3>
                      <DocumentUploader clientId={clientId!} onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'documents'] })} />
                    </div>
                    
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchDocuments}
                        onChange={(e) => setSearchDocuments(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-documents"
                      />
                    </div>

                    {documentsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-sm">Loading documents...</div>
                      </div>
                    ) : clientDocuments && clientDocuments.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {clientDocuments
                          .filter((doc: any) => 
                            !searchDocuments || 
                            doc.fileName?.toLowerCase().includes(searchDocuments.toLowerCase()) ||
                            doc.fileType?.toLowerCase().includes(searchDocuments.toLowerCase())
                          )
                          .map((document: any) => (
                            <div key={document.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0 mt-1">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {document.fileName}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      {document.fileSize && (
                                        <span>{Math.round(document.fileSize / 1024)} KB</span>
                                      )}
                                      {document.uploadedAt && (
                                        <span>Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</span>
                                      )}
                                      {document.uploadedBy && (
                                        <span>by {document.uploadedBy}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                                    onClick={() => window.open(document.filePath || document.fileUrl, '_blank')}
                                    title="View document"
                                    data-testid={`button-view-document-${document.id}`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  {canDeleteDocuments && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                      onClick={() => setDocumentToDelete(document)}
                                      title="Delete document"
                                      data-testid={`button-delete-document-${document.id}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Upload className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm">No documents uploaded</p>
                        <p className="text-xs text-gray-400">Upload a document to get started</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Section */}
                {activeHubSection === "team" && (
                  <div className="space-y-4">
                    <TeamAssignmentSection clientId={clientId!} />
                  </div>
                )}

                {/* Meetings Section */}
                {activeHubSection === "onboarding" && (
                  <ClientOnboardingHubSection client={client} clientId={clientId!} isAdmin={isAdmin} />
                )}

                {activeHubSection === "meetings" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meeting Agenda & Notes</h3>
                      <a href="/hr?tab=px-meetings" className="text-sm text-primary hover:underline">
                        View All Meetings
                      </a>
                    </div>
                    {meetingsLoading ? (
                      <div className="flex items-center gap-2 p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <div className="text-sm">Loading meetings...</div>
                      </div>
                    ) : clientMeetings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">No meetings linked to this client</p>
                        <p className="text-xs mt-1">Link meetings from HR &gt; Meetings</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clientMeetings.map((meeting: any) => {
                          const meetingDate = meeting.meetingDate ? new Date(meeting.meetingDate) : null;
                          const isUpcoming = meetingDate && meetingDate > new Date();
                          const isPast = meetingDate && meetingDate < new Date();
                          
                          return (
                            <a
                              key={meeting.id}
                              href={`/hr/px-meetings/${meeting.id}`}
                              className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList className="h-4 w-4 text-primary flex-shrink-0" />
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {meeting.title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    {meetingDate ? (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {meetingDate.toLocaleDateString('en-US', { 
                                          weekday: 'short',
                                          month: 'short', 
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">No date set</span>
                                    )}
                                    {meeting.recordingLink && (
                                      <span className="flex items-center gap-1 text-primary">
                                        <ExternalLink className="h-3 w-3" />
                                        Recording
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  {isUpcoming && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      Upcoming
                                    </span>
                                  )}
                                  {isPast && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                      Past
                                    </span>
                                  )}
                                </div>
                              </div>
                              {meeting.attendeeIds && meeting.attendeeIds.length > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Users className="h-3 w-3" />
                                  <span>{meeting.attendeeIds.length} attendee{meeting.attendeeIds.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>


      </Tabs>
      
      {/* Appointment Modal */}
      <AppointmentModal
        open={isAppointmentModalOpen}
        onOpenChange={(open) => {
          setIsAppointmentModalOpen(open);
          if (!open) {
            setEditingAppointment(null);
          }
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
          setIsAppointmentModalOpen(false);
          setEditingAppointment(null);
        }}
        clientId={clientId!}
        clientName={client?.name}
        clientEmail={client?.email}
        appointmentId={editingAppointment?.id}
        existingAppointment={editingAppointment}
      />

      {/* Delete Appointment Confirmation Dialog */}
      <AlertDialog open={!!deletingAppointment} onOpenChange={(open) => !open && setDeletingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAppointment ? replaceMergeTags(deletingAppointment.title) : ""}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingAppointment) {
                  deleteAppointmentMutation.mutate(deletingAppointment.id);
                  setDeletingAppointment(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog open={!!deletingNote} onOpenChange={(open) => !open && setDeletingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingNote) {
                  deleteNoteMutation.mutate(deletingNote.id);
                  setDeletingNote(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (documentToDelete) {
                  deleteDocumentMutation.mutate(documentToDelete.id);
                  setDocumentToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Product Modal */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Products & Services</DialogTitle>
            <DialogDescription>
              Select products, bundles, or packages to add to this client.
            </DialogDescription>
          </DialogHeader>
          
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products, bundles, and packages..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="input-product-search"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Products Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Products</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {productsData && productsData
                  .filter(product => 
                    product.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                    product.description?.toLowerCase().includes(productSearchTerm.toLowerCase())
                  )
                  .map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description}</p>
                        )}
                        {canViewCosts && (
                          <p className="text-sm font-medium text-primary">
                            ${Number(product.cost || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await apiRequest('POST', `/api/clients/${clientId}/products`, {
                              productId: product.id
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
                            setShowAddProductModal(false);
                            toast({
                              title: "Success",
                              variant: "default",
                              description: `${product.name} added successfully!`
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to add product. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid={`button-add-product-${product.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bundles Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Bundles</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bundlesData && bundlesData
                  .filter(bundle => 
                    bundle.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                    bundle.description?.toLowerCase().includes(productSearchTerm.toLowerCase())
                  )
                  .map((bundle) => (
                    <div 
                      key={bundle.id} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{bundle.name}</h4>
                        {bundle.description && (
                          <p className="text-sm text-gray-600">{bundle.description}</p>
                        )}
                        {canViewCosts && (
                          <p className="text-sm font-medium text-primary">
                            ${Number(bundle.price || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await apiRequest('POST', `/api/clients/${clientId}/products`, {
                              productId: bundle.id
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
                            setShowAddProductModal(false);
                            toast({
                              title: "Success",
                              variant: "default",
                              description: `${bundle.name} bundle added successfully!`
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to add bundle. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid={`button-add-bundle-${bundle.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Packages Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Packages</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {packagesData && packagesData
                  .filter((pkg: any) =>
                    pkg.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                    pkg.description?.toLowerCase().includes(productSearchTerm.toLowerCase())
                  )
                  .map((pkg: any) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{pkg.name}</h4>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                        )}
                        <p className="text-xs text-gray-500">{pkg.itemCount || 0} items</p>
                        {canViewCosts && (
                          <p className="text-sm font-medium text-primary">
                            ${Number(pkg.totalCost || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await apiRequest('POST', `/api/clients/${clientId}/products`, {
                              productId: pkg.id
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
                            setShowAddProductModal(false);
                            toast({
                              title: "Success",
                              variant: "default",
                              description: `${pkg.name} package added successfully!`
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to add package. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid={`button-add-package-${pkg.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddProductModal(false)}
              data-testid="button-close-add-product-modal"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isAdminOrManager && <GenerateTasksDialog clientId={clientId} open={showGenerateTasksModal} onOpenChange={setShowGenerateTasksModal} />}

      {/* Import from Quote Modal */}
      <Dialog open={showImportQuoteModal} onOpenChange={setShowImportQuoteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import from Quote</DialogTitle>
            <DialogDescription>
              Select a quote to import its products, bundles, and packages to this client.
            </DialogDescription>
          </DialogHeader>
          <ImportFromQuoteContent
            clientId={clientId as string}
            selectedQuoteId={selectedImportQuoteId}
            setSelectedQuoteId={setSelectedImportQuoteId}
            isImporting={isImporting}
            setIsImporting={setIsImporting}
            onSuccess={() => {
              setShowImportQuoteModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'products'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* SMS Template Modal */}
      <Dialog open={showSmsTemplateModal} onOpenChange={setShowSmsTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>SMS Templates</DialogTitle>
            <DialogDescription>
              Choose a template to insert into your SMS message.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <SmsTemplateSelector onSelectTemplate={selectSmsTemplate} />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowSmsTemplateModal(false)}
              data-testid="button-close-sms-template-modal"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Merge Tags Modal */}
      <Dialog open={showSmsMergeTagsModal} onOpenChange={setShowSmsMergeTagsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>SMS Merge Tags</DialogTitle>
            <DialogDescription>
              Click a tag to insert it into your SMS message. Includes all custom fields.
            </DialogDescription>
          </DialogHeader>
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search merge tags..."
              value={smsMergeTagsSearch}
              onChange={(e) => setSmsMergeTagsSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-sms-merge-tags"
            />
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            <SmsMergeTagsSelector 
              searchTerm={smsMergeTagsSearch} 
              onSelectTag={insertSmsTag} 
            />
          </div>
          <div className="flex justify-end shrink-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowSmsMergeTagsModal(false)}
              data-testid="button-close-sms-merge-tags-modal"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    
    {/* SMS Choice Modal - MOVED OUTSIDE MAIN CONTAINER */}
    <Dialog open={showSmsChoiceModal} onOpenChange={setShowSmsChoiceModal}>
      <DialogContent className="sm:max-w-md" data-testid="modal-sms-choice">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send SMS Options
          </DialogTitle>
          <DialogDescription>
            Choose how you want to send your SMS message to {clientDisplayName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={() => {
              setShowSmsChoiceModal(false);
              handleSendSms(); // Send the already composed message immediately
            }}
            className="w-full justify-start gap-3 h-12"
            data-testid="button-send-sms-now"
          >
            <MessageSquare className="h-5 w-5" />
            Send SMS Now
          </Button>
          <Button
            onClick={() => {
              setShowSmsChoiceModal(false);
              setShowSmsScheduleModal(true);
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            data-testid="button-schedule-sms"
          >
            <Clock className="h-5 w-5" />
            Schedule SMS
          </Button>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowSmsChoiceModal(false)}
            data-testid="button-cancel-sms-choice"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* EMAIL Choice Modal - Same pattern as SMS */}
    <Dialog open={showEmailChoiceModal} onOpenChange={setShowEmailChoiceModal}>
      <DialogContent className="sm:max-w-md" data-testid="modal-email-choice">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send Email Options
          </DialogTitle>
          <DialogDescription>
            Choose how you want to send your email to {clientDisplayName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={() => {
              console.log("📧 EMAIL SEND NOW CLICKED!");
              setShowEmailChoiceModal(false);
              sendEmailNow(); // Send the already composed email immediately
            }}
            className="w-full justify-start gap-3 h-12"
            data-testid="button-send-email-now"
          >
            <Mail className="h-5 w-5" />
            Send Email Now
          </Button>
          <Button
            onClick={() => {
              console.log("🕐 EMAIL SCHEDULE CLICKED!");
              setShowEmailChoiceModal(false);
              setShowEmailScheduleModal(true); // Open dedicated email schedule modal
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            data-testid="button-schedule-email"
          >
            <Clock className="h-5 w-5" />
            Schedule Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* SMS Schedule Modal */}
    <Dialog open={showSmsScheduleModal} onOpenChange={setShowSmsScheduleModal}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-sms-schedule">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Schedule SMS to {clientDisplayName}
          </DialogTitle>
          <DialogDescription>
            Choose when you want to send your SMS message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-schedule-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                data-testid="input-schedule-time"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Select value={scheduledTimezone} onValueChange={setScheduledTimezone}>
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="ghost"
            onClick={() => setShowSmsScheduleModal(false)}
            data-testid="button-cancel-schedule"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Close schedule modal and schedule the already composed message
              setShowSmsScheduleModal(false);
              scheduleSms(); // Schedule the already composed message
            }}
            disabled={!scheduledDate || !scheduledTime}
            data-testid="button-continue-schedule"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* EMAIL Schedule Modal - Same pattern as SMS */}
    <Dialog open={showEmailScheduleModal} onOpenChange={setShowEmailScheduleModal}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-email-schedule">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Schedule Email to {clientDisplayName}
          </DialogTitle>
          <DialogDescription>
            Choose when you want to send your email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                data-testid="input-schedule-date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                data-testid="input-schedule-time"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={scheduledTimezone}
              onChange={(e) => setScheduledTimezone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              data-testid="select-timezone"
            >
              <option value="America/New_York">Eastern Time (EST/EDT)</option>
              <option value="America/Chicago">Central Time (CST/CDT)</option>
              <option value="America/Denver">Mountain Time (MST/MDT)</option>
              <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="ghost"
            onClick={() => setShowEmailScheduleModal(false)}
            data-testid="button-cancel-email-schedule"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log("📅 EMAIL SCHEDULE BUTTON CLICKED!");
              // Close schedule modal and schedule the already composed email
              setShowEmailScheduleModal(false);
              scheduleEmail(); // Schedule the already composed email
            }}
            disabled={!scheduledDate || !scheduledTime}
            data-testid="button-continue-email-schedule"
          >
            Schedule Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Email Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Templates</DialogTitle>
            <DialogDescription>
              Choose a template to insert into your email message.
            </DialogDescription>
          </DialogHeader>
          <EmailTemplateSelector 
            onSelectTemplate={selectTemplate}
          />
        </DialogContent>
      </Dialog>

      {/* Email Merge Tags Modal */}
      <Dialog open={showMergeTagsModal} onOpenChange={setShowMergeTagsModal}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Email Merge Tags</DialogTitle>
            <DialogDescription>
              Click a merge tag to insert it into your email message. Search to find specific fields.
            </DialogDescription>
          </DialogHeader>
          <MergeTagSelector
            searchValue={smsMergeTagsSearch}
            onSearchChange={setSmsMergeTagsSearch}
            customFields={customFields}
            onSelectTag={(tag) => {
              const currentMessage = emailData.message;
              const newMessage = currentMessage + tag;
              setEmailData(prev => ({ ...prev, message: newMessage }));
              setShowMergeTagsModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Owner Assignment Dialog */}
      <Dialog open={isAssigningOwner} onOpenChange={setIsAssigningOwner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Owner</DialogTitle>
            <DialogDescription>
              Select a team member to be the owner of this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={ownerSearchTerm}
                onChange={(e) => setOwnerSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-owner-search"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(ownerSearchTerm ? filteredStaff : staffData?.filter((s: any) => s.isActive !== false) || []).map((staff: any) => (
                <button
                  key={staff.id}
                  onClick={() => updateOwnerMutation.mutate(staff.id)}
                  disabled={updateOwnerMutation.isPending}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left ${
                    client?.contactOwner === staff.id ? 'bg-primary/10 border border-primary' : ''
                  }`}
                  data-testid={`button-select-owner-${staff.id}`}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                    {staff.firstName?.[0]}{staff.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{staff.firstName} {staff.lastName}</p>
                    <p className="text-xs text-muted-foreground">{staff.email}</p>
                  </div>
                  {client?.contactOwner === staff.id && (
                    <Badge variant="outline" className="text-xs">Current</Badge>
                  )}
                </button>
              ))}
              {ownerSearchTerm && filteredStaff.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">No team members found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers Assignment Dialog */}
      <Dialog open={isAddingFollowers} onOpenChange={setIsAddingFollowers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Followers</DialogTitle>
            <DialogDescription>
              Add or remove team members who follow this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={followerSearchTerm}
                onChange={(e) => setFollowerSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-follower-search"
              />
            </div>
            
            {/* Current Followers */}
            {client?.followers && client.followers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Followers</p>
                <div className="space-y-1">
                  {client.followers.map((followerId: string) => {
                    const follower = staffData?.find((s: any) => s.id === followerId);
                    if (!follower) return null;
                    return (
                      <div key={followerId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                          {follower.firstName?.[0]}{follower.lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{follower.firstName} {follower.lastName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFollowers = client.followers.filter((id: string) => id !== followerId);
                            updateFollowersMutation.mutate(newFollowers);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          data-testid={`button-remove-follower-${followerId}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Add New Followers */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Add Followers</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {(followerSearchTerm ? filteredFollowers : staffData?.filter((s: any) => 
                  s.isActive !== false && 
                  !client?.followers?.includes(s.id) && 
                  s.id !== client?.contactOwner
                ) || []).map((staff: any) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      const newFollowers = [...(client?.followers || []), staff.id];
                      updateFollowersMutation.mutate(newFollowers);
                    }}
                    disabled={updateFollowersMutation.isPending}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    data-testid={`button-add-follower-${staff.id}`}
                  >
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                      {staff.firstName?.[0]}{staff.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{staff.firstName} {staff.lastName}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                {followerSearchTerm && filteredFollowers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">No team members found</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};
