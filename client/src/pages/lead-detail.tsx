import { useQuery } from "@tanstack/react-query";
import { useLocation, Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Building2, Calendar, DollarSign, User, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { Lead, Task, User as StaffUser, LeadPipelineStage } from "@shared/schema";
import LeadNotesSection from "@/components/forms/lead-notes-section";

export default function LeadDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/leads/:id");
  
  // Extract lead ID from route params
  const leadId = params?.id;

  // Fetch lead data
  const { data: lead, isLoading: leadLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
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
      </div>

      {/* Lead Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium" data-testid="text-lead-email">{lead.email}</div>
                </div>
              </div>
            )}
            
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium" data-testid="text-lead-phone">{lead.phone}</div>
                </div>
              </div>
            )}
            
            {lead.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Company</div>
                  <div className="font-medium" data-testid="text-lead-company">{lead.company}</div>
                </div>
              </div>
            )}
            
            {lead.value && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Value</div>
                  <div className="font-medium" data-testid="text-lead-value">
                    ${lead.value.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            
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

      {/* Tabs Section */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList>
          <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            Tasks {leadTasks.length > 0 && `(${leadTasks.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          <LeadNotesSection leadId={leadId || ""} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
