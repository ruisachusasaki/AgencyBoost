import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Building2, Calendar, DollarSign, User, CheckCircle2, Edit, Tag as TagIcon, FileText, Percent, MessageSquare, StickyNote, ListTodo, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import type { Lead, Task, User as StaffUser, LeadPipelineStage, CustomField, Tag } from "@shared/schema";
import LeadNotesSection from "@/components/forms/lead-notes-section";
import CustomFieldsLeadForm from "@/components/forms/custom-fields-lead-form";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import LeadAppointmentsDisplay from "@/components/forms/lead-appointments-display";

export default function LeadDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/leads/:id");
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "tasks" | "appointments">("notes");
  
  // Extract lead ID from route params
  const leadId = params?.id;

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
            {currentStage && !isEditMode && (
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
        {!isEditMode ? (
          <Button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-2"
            data-testid="button-edit-lead"
          >
            <Edit className="h-4 w-4" />
            Edit Lead
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsEditMode(false)}
            className="flex items-center gap-2"
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Edit Mode - Show Form Inline */}
      {isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomFieldsLeadForm
              lead={lead}
              onSuccess={() => setIsEditMode(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* View Mode - Show Lead Details */}
      {!isEditMode && (
        <>
          {/* Lead Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium" data-testid="text-lead-detail-name">{lead.name}</div>
              </div>
            </div>

            {/* Email */}
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium" data-testid="text-lead-email">{lead.email}</div>
                </div>
              </div>
            )}
            
            {/* Phone */}
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium" data-testid="text-lead-phone">{lead.phone}</div>
                </div>
              </div>
            )}
            
            {/* Company */}
            {lead.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Company</div>
                  <div className="font-medium" data-testid="text-lead-company">{lead.company}</div>
                </div>
              </div>
            )}

            {/* Pipeline Stage */}
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
            
            {/* Status */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
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
            </div>
            
            {/* Potential Value */}
            {lead.value && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Potential Value</div>
                  <div className="font-medium" data-testid="text-lead-value">
                    ${lead.value.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            
            {/* Probability */}
            {lead.probability !== null && lead.probability !== undefined && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Probability</div>
                  <div className="font-medium" data-testid="text-lead-probability">
                    {lead.probability}%
                  </div>
                </div>
              </div>
            )}
            
            {/* Assigned To */}
            {assignedStaff && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Assigned To</div>
                  <div className="font-medium" data-testid="text-lead-assigned-to">
                    {assignedStaff.firstName} {assignedStaff.lastName}
                  </div>
                </div>
              </div>
            )}
            
            {/* Source */}
            {lead.source && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Source</div>
                  <div className="font-medium" data-testid="text-lead-source">{lead.source}</div>
                </div>
              </div>
            )}
            
            {/* Last Contact Date */}
            {lead.lastContactDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Last Contact</div>
                  <div className="font-medium" data-testid="text-lead-last-contact">
                    {format(new Date(lead.lastContactDate), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            )}
            
            {/* Created Date */}
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

      {/* Tags Card */}
      {lead.tags && lead.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Custom Fields Card */}
      {lead.customFieldData && Object.keys(lead.customFieldData as Record<string, any>).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFields
                .filter(field => {
                  const customFieldData = lead.customFieldData as Record<string, any>;
                  return customFieldData && customFieldData[field.name];
                })
                .map(field => {
                  const customFieldData = lead.customFieldData as Record<string, any>;
                  const value = customFieldData?.[field.name];
                  
                  return (
                    <div key={field.id} className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">{field.name}</div>
                      <div className="text-sm text-gray-600" data-testid={`custom-field-${field.id}`}>
                        {value ? String(value) : '-'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Section - Marketing Page Style */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "notes" as const, name: "Notes", icon: StickyNote, count: 0 },
            { id: "tasks" as const, name: "Tasks", icon: ListTodo, count: leadTasks.length },
            { id: "appointments" as const, name: "Appointments", icon: CalendarCheck, count: 0 }
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
        </>
      )}
    </div>
  );
}
