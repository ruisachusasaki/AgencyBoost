import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, ChevronDown, ChevronRight, ChevronLeft, FileText, CheckCircle, Plus, ExternalLink, Edit2, Save, X, Filter, Hash, Briefcase, Workflow, Target, UserCircle, ShoppingCart, Package, Trash2, Mail, MessageSquare, Phone, ShieldOff, StickyNote, Calendar, Upload, CreditCard, Search, Clock, RefreshCw, Send, AtSign, Download, MessageCircle, Bold, Italic, Underline, Type, FileImage, Paperclip, HelpCircle, Tag as TagIcon, Globe, CornerDownRight, MapPin, Edit, Users, Activity, Zap, Archive, ShoppingBag, TrendingUp, Monitor, FileX, PenTool, Palette, Heart, Star, Coffee, Lightbulb, Rocket, Contact, Settings } from "lucide-react";
import CustomFieldFileUpload from "@/components/CustomFieldFileUpload";


import { DocumentUploader } from "@/components/DocumentUploader";
import { AppointmentModal } from "@/components/AppointmentModal";
import { ProductSearchResults } from "@/components/ProductSearchResults";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, Tag, InsertTag, EmailTemplate, SmsTemplate, ClientHealthScore } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentWeekRange } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import ClientHealthModal from "@/components/client-health-modal";
import type { HealthStatusResult } from "@shared/utils/healthAnalysis";

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

// ClientHealthTabContent Component
function ClientHealthTabContent({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

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
  const clearFilters = () => {
    setDateRangeFilter("all");
    setCustomDateRange({ from: null, to: null });
    setHealthStatusFilters({ Green: true, Yellow: true, Red: true });
  };

  // Get current week range for checking if score exists
  const weekRange = getCurrentWeekRange();
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
  const getHealthIndicatorStyling = (healthIndicator: string) => {
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
  };

  // Helper function to get metric styling based on value
  const getMetricStyling = (metric: string, value: string) => {
    if (metric === 'goals') {
      switch (value) {
        case 'Above': return 'text-green-600 bg-green-50';
        case 'On Track': return 'text-blue-600 bg-blue-50';
        case 'Below': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    if (metric === 'fulfillment') {
      switch (value) {
        case 'Early': return 'text-green-600 bg-green-50';
        case 'On Time': return 'text-blue-600 bg-blue-50';
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
        case 'Up to Date': return 'text-blue-600 bg-blue-50';
        case 'Late': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
    return 'text-gray-600 bg-gray-50';
  };

  // Handle successful health score submission
  const handleHealthScoreSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "health-scores"] });
    setIsHealthModalOpen(false);
    toast({
      title: "Health Score Recorded",
      description: `Weekly health score for ${displayRange} has been saved successfully.`,
    });
  };

  // Health functionality has been moved to the health tab

  if (!client) {
    return <div className="p-8 text-center text-gray-500">Client not found</div>;
  }
  
  // Main component return starts here
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="health">Client Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Overview</h3>
              <p className="text-gray-500">Client overview content will be displayed here.</p>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tasks</h3>
              <p className="text-gray-500">Client tasks will be displayed here.</p>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-500">Client notes will be displayed here.</p>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6 mt-6">
            <ClientHealthTabContent clientId={clientId} />
          </TabsContent>
        </Tabs>

        {/* Health Score Modal */}
        <ClientHealthModal
          clientId={clientId}
          isOpen={isHealthModalOpen}
          onClose={() => setIsHealthModalOpen(false)}
          onSuccess={handleHealthScoreSuccess}
        />
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
  const [activeRightSection, setActiveRightSection] = useState<"notes">("notes");
  const [activeHubSection, setActiveHubSection] = useState<"notes" | "tasks" | "appointments" | "documents" | "team">("notes");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
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
  const [emailData, setEmailData] = useState({ fromName: "", fromEmail: "", to: "", cc: "", bcc: "", subject: "", message: "" });
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  
  // Handler functions for communication forms
  const handleSmsFieldChange = (field: string, value: string) => {
    setSmsData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailFieldChange = (field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

  // SMS sending functionality
  const sendSmsMutation = useMutation({
    mutationFn: async (smsPayload: { fromNumber: string; to: string; message: string }) => {
      return await apiRequest("POST", "/api/integrations/twilio/send", smsPayload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "SMS sent successfully!" });
      setSmsData({ fromNumber: "", message: "" }); // Clear form
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error?.message || "Failed to send SMS" 
      });
    }
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
    if (!smsData.fromNumber || !smsData.message.trim() || !client?.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    const formattedToNumber = formatPhoneNumber(client.phone);

    sendSmsMutation.mutate({
      fromNumber: smsData.fromNumber,
      to: formattedToNumber,
      message: smsData.message,
      clientId: client?.id
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
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
  

  // Communication tabs state
  const [communicationTab, setCommunicationTab] = useState<'sms' | 'email'>('sms');

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



  // Email composition state (removed duplicate)
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
  const [activeTab, setActiveTab] = useState<'contact' | 'hub' | 'health' | 'products' | 'communication' | 'activity'>('contact');



  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Get client health status for highlighting
  const { data: healthStatus, isLoading: healthStatusLoading } = useQuery<HealthStatusResult>({
    queryKey: [`/api/clients/${clientId}/health-status`],
    enabled: !!clientId,
  });

  // Initialize brief sections from client data
  // Initialize editing content when brief sections load
  useEffect(() => {
    if (briefSections.length > 0) {
      const contentMap: Record<string, string> = {};
      briefSections.forEach((section: any) => {
        contentMap[section.id] = section.value || "";
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
  const { data: customFieldsData, isLoading: customFieldsLoading } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
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
        description: `Bundle quantities updated. New cost: $${data.newCost?.toFixed(2)}`,
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

  // Fetch audit logs for this client with pagination and filtering
  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['/api/audit-logs/entity/contact', clientId, currentPage, itemsPerPage, activityFilter],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const filterParam = activityFilter !== 'all' ? `&filter=${encodeURIComponent(activityFilter)}` : '';
      const response = await fetch(`/api/audit-logs/entity/contact/${clientId}?limit=${itemsPerPage}&offset=${offset}${filterParam}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
    enabled: !!clientId,
    staleTime: 1000 * 30, // Cache for 30 seconds
  });

  const auditLogs = auditLogsData?.logs || [];
  const totalActivities = auditLogsData?.total || 0;
  const hasMoreActivities = auditLogsData?.hasMore || false;
  const totalPages = Math.ceil(totalActivities / itemsPerPage);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: typeof activityFilter) => {
    setActivityFilter(newFilter);
    setCurrentPage(1);
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

  // Auto-populate email fields when user and client data are available
  useEffect(() => {
    if (currentUser?.id && client?.email) {
      const fromName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      const fromEmail = currentUser.email || '';
      const to = client.email || '';
      
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
  }, [currentUser?.id, currentUser?.firstName, currentUser?.lastName, currentUser?.email, client?.email]);

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
    if (client?.phone) {
      setSmsData(prev => {
        if (prev.to !== client.phone) {
          return { ...prev, to: client.phone };
        }
        return prev;
      });
    }
  }, [client?.phone]);

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
                      {getClientDisplayName()}
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
          <div className="border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-6 bg-transparent border-0 rounded-none h-auto p-0">
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
                    </div>
                  )}
                </div>

                {/* Campaigns Accordion */}
                <div className="border-b border-gray-200 pb-4">
                  <div
                    onClick={() => setActionsExpanded(prev => ({ ...prev, campaigns: !prev.campaigns }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Campaigns
                    </h4>
                    {actionsExpanded.campaigns ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  {actionsExpanded.campaigns && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">No campaigns associated</p>
                      <p className="text-xs text-gray-400">Campaigns will appear when the client is added to marketing campaigns</p>
                    </div>
                  )}
                </div>

                {/* Workflows Accordion */}
                <div className="border-b border-gray-200 pb-4">
                  <div
                    onClick={() => setActionsExpanded(prev => ({ ...prev, workflows: !prev.workflows }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      Workflows
                    </h4>
                    {actionsExpanded.workflows ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  {actionsExpanded.workflows && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">No workflows active</p>
                      <p className="text-xs text-gray-400">Automated workflows will appear when triggered for this client</p>
                    </div>
                  )}
                </div>

                {/* Opportunities Accordion */}
                <div className="pb-2">
                  <div
                    onClick={() => setActionsExpanded(prev => ({ ...prev, opportunities: !prev.opportunities }))}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Opportunities
                    </h4>
                    {actionsExpanded.opportunities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  {actionsExpanded.opportunities && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">No opportunities tracked</p>
                      <p className="text-xs text-gray-400">Sales opportunities will appear when pipeline functionality is added</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


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
              briefSections
                .filter((section: any) => section.isEnabled) // Only show enabled sections
                .map((section: any) => {
                  const isEditing = editingSections.has(section.id);
                  const IconComponent = iconMap[section.icon] || FileText;
                  const currentContent = editingContent[section.id] || section.value || "";
                  
                  return (
                    <Card key={section.id} data-testid={`card-brief-${section.key}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <IconComponent className="h-5 w-5 text-primary" />
                            {section.title}
                            {section.scope === 'core' && (
                              <Badge variant="secondary" className="text-xs">Core</Badge>
                            )}
                          </h2>
                          {!isEditing ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSections(prev => new Set([...prev, section.id]));
                              }}
                              data-testid={`button-edit-${section.key}`}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
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
                                  // Reset to original content
                                  setEditingContent(prev => ({
                                    ...prev,
                                    [section.id]: section.value || ""
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
                      </CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                  );
                })
            )}




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
        </div>

        </TabsContent>

        <TabsContent value="products" className="space-y-6 mt-6" key="main-products-tab">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">Products & Services</CardTitle>
                  <Button
                    onClick={() => setIsAddingProduct(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-add-product"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clientProductsData && clientProductsData.length > 0 ? (
                  <div className="space-y-4">
                    {clientProductsData.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900" data-testid={`text-product-name-${product.id}`}>
                              {product.name}
                            </h4>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-1" data-testid={`text-product-description-${product.id}`}>
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              {product.price && (
                                <span className="text-sm font-medium text-green-600" data-testid={`text-product-price-${product.id}`}>
                                  ${product.price}
                                </span>
                              )}
                              {product.category && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full" data-testid={`text-product-category-${product.id}`}>
                                  {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              data-testid={`button-edit-product-${product.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-product-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="text-no-products">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h3>
                    <p className="text-gray-600 mb-6">Add your first product or service to get started.</p>
                    <Button
                      onClick={() => setIsAddingProduct(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-add-first-product"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Activity & Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client?.activities && client.activities.length > 0 ? (
                    client.activities.map((activity, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <span className="text-sm text-gray-500">{activity.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    ))
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client?.communications && client.communications.length > 0 ? (
                    client.communications.map((comm, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comm.type}</span>
                          <span className="text-sm text-gray-500">{comm.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comm.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Communication Yet</h3>
                      <p className="text-gray-600">Communication history will appear here as you interact with this client.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                                      assignedTo: newTask.assignee || undefined
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
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Switch
                        id="show-completed"
                        checked={showCompletedTasks}
                        onCheckedChange={setShowCompletedTasks}
                      />
                      <Label htmlFor="show-completed" className="text-sm text-gray-600">
                        Show completed tasks
                      </Label>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        clientTasksData
                          .filter((task: any) => showCompletedTasks || task.status !== 'completed')
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
                                  <h4 className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {task.title}
                                  </h4>
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
                                  {appointment.title}
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
                      <DocumentUploader clientId={clientId!} />
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6 mt-6">
            {/* Health functionality will be moved here from the original location */}
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
              Are you sure you want to delete "{deletingAppointment?.title}"? This action cannot be undone.
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
    </div>
  );
};
