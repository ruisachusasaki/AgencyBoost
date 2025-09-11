import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Mail, Clock, CheckSquare, Tag, MessageSquare, Phone, Trash2, Settings, Zap, Users, Target, TrendingUp, DollarSign, FileText, Calendar, AlertCircle, GraduationCap, BookOpen, Trophy, BellRing, BarChart3, UserCheck, GitBranch, ArrowRight, Hash } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface WorkflowStep {
  id: string;
  type: "trigger" | "action" | "wait" | "condition";
  name: string;
  description: string;
  config: any;
  icon: any;
}

interface WorkflowBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: any) => void;
  editingWorkflow?: any;
}



export default function WorkflowBuilder({ isOpen, onClose, onSave, editingWorkflow }: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState(editingWorkflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(editingWorkflow?.description || "");
  const [workflowCategory, setWorkflowCategory] = useState(editingWorkflow?.category || "");
  const [selectedTrigger, setSelectedTrigger] = useState<WorkflowStep | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [showTriggerSelect, setShowTriggerSelect] = useState(false);
  const [showActionSelect, setShowActionSelect] = useState(false);

  // Fetch triggers from API
  const { data: apiTriggers = [] } = useQuery<any[]>({
    queryKey: ["/api/automation-triggers"],
  });

  // Fetch actions from API
  const { data: apiActions = [] } = useQuery<any[]>({
    queryKey: ["/api/automation-actions"],
  });

  // Map action types to icons
  const getIconForAction = (type: string) => {
    const iconMap: { [key: string]: any } = {
      send_email: Mail,
      send_sms: MessageSquare,
      create_task: CheckSquare,
      create_lead: Users,
      add_tag: Tag,
      wait: Clock,
      make_call: Phone,
      log_communication: FileText,
      send_internal_notification: BellRing,
      send_slack_message: MessageSquare,
      create_project: Plus,
      update_client_fields: Users,
      update_lead_stage: Target,
      update_project_status: Settings,
      add_client_tags: Tag,
      update_custom_fields: Settings,
      assign_contact_owner: UserCheck,
      assign_task_to_staff: CheckSquare,
      assign_lead_to_staff: Users,
      add_team_role_assignment: Users,
      reassign_project_manager: UserCheck,
      remove_staff_assignment: Users,
      mark_task_complete: CheckSquare,
      update_lead_score: TrendingUp,
      change_client_status: Users,
      update_deal_value: DollarSign,
      schedule_follow_up: Calendar,
      create_calendar_event: Calendar,
      send_proposal: FileText,
      generate_invoice: DollarSign,
      update_payment_status: DollarSign,
      add_note: FileText,
      create_support_ticket: AlertCircle,
      schedule_training: GraduationCap,
      assign_course: BookOpen,
      award_badge: Trophy,
      update_progress: BarChart3,
      send_completion_certificate: Trophy,
      appointment_reminder: Calendar,
      task_deadline_alert: AlertCircle,
      lead_follow_up_reminder: Users,
      client_check_in_reminder: Calendar,
      overdue_task_alert: AlertCircle,
      // Internal actions
      split: GitBranch,
      go_to: ArrowRight,
      date_time_formatter: Calendar,
      number_formatter: Hash
    };
    return iconMap[type] || FileText;
  };

  // Group actions by category
  const groupedActions = apiActions.reduce((groups: any, action: any) => {
    const category = action.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push({
      ...action,
      icon: getIconForAction(action.type)
    });
    return groups;
  }, {});

  // Get category display names
  const getCategoryDisplayName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      communication: '📧 Communication',
      data_management: '📋 Data Management', 
      assignment: '👥 Assignment',
      status_progress: '📊 Status & Progress',
      financial_billing: '💰 Financial & Billing',
      calendar_scheduling: '📅 Calendar & Scheduling',
      knowledge_training: '🎓 Knowledge & Training',
      notification_alert: '🔔 Notification & Alert',
      internal: '🔧 Internal Control'
    };
    return categoryNames[category] || category;
  };



  // Map trigger types to icons
  const getIconForTrigger = (type: string) => {
    const iconMap: { [key: string]: any } = {
      contact_created: Plus,
      form_submitted: CheckSquare,
      tag_added: Tag,
      client_status_changed: Users,
      project_created: Plus,
      project_status_changed: Settings,
      project_completed: CheckSquare,
      project_deadline_approaching: AlertCircle,
      task_created: Plus,
      task_completed: CheckSquare,
      task_assigned: Users,
      task_due_soon: Clock,
      task_overdue: AlertCircle,
      lead_created: Target,
      lead_stage_changed: TrendingUp,
      lead_assigned: Users,
      lead_converted: CheckSquare,
      campaign_created: Plus,
      campaign_status_changed: Settings,
      campaign_budget_exceeded: DollarSign,
      campaign_milestone: TrendingUp,
      invoice_created: FileText,
      invoice_paid: DollarSign,
      invoice_overdue: AlertCircle,
      payment_received: DollarSign,
      // Training System Triggers
      course_enrollment: UserCheck,
      lesson_completion: BookOpen,
      course_completion: Trophy,
      course_published: BellRing,
      training_progress_milestone: BarChart3,
      course_assignment: GraduationCap,
      training_overdue: Calendar,
    };
    return iconMap[type] || Zap;
  };

  const handleTriggerSelect = (trigger: any) => {
    const triggerStep: WorkflowStep = {
      id: `trigger-${Date.now()}`,
      type: "trigger",
      name: trigger.name,
      description: trigger.description || "",
      config: trigger.configSchema || {},
      icon: getIconForTrigger(trigger.type)
    };
    setSelectedTrigger(triggerStep);
    setShowTriggerSelect(false);
  };

  const handleActionSelect = (action: any) => {
    const actionStep: WorkflowStep = {
      id: `action-${Date.now()}`,
      type: "action",
      name: action.name,
      description: action.description,
      config: {},
      icon: action.icon
    };
    setWorkflowSteps([...workflowSteps, actionStep]);
    setShowActionSelect(false);
  };

  const removeStep = (stepId: string) => {
    setWorkflowSteps(workflowSteps.filter(step => step.id !== stepId));
  };

  const handleSave = () => {
    if (!workflowName || !selectedTrigger) return;

    const workflow = {
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      trigger: {
        type: selectedTrigger.name.toLowerCase().replace(/\s+/g, '_'),
        config: selectedTrigger.config
      },
      actions: workflowSteps.map(step => ({
        type: step.name.toLowerCase().replace(/\s+/g, '_'),
        config: step.config
      })),
      status: "draft",
      createdBy: "user-1"
    };

    onSave(workflow);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Builder</DialogTitle>
          <DialogDescription>
            Create an automated workflow by selecting a trigger and adding actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <Label htmlFor="workflow-category">Category</Label>
                <Select value={workflowCategory} onValueChange={setWorkflowCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_management">Lead Management</SelectItem>
                    <SelectItem value="email_marketing">Email Marketing</SelectItem>
                    <SelectItem value="task_automation">Task Automation</SelectItem>
                    <SelectItem value="customer_onboarding">Customer Onboarding</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="training_management">Training Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does"
              />
            </div>
          </div>

          <Separator />

          {/* Trigger Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Select Trigger</h3>
            {selectedTrigger ? (
              <Card className="border-[#46a1a0]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <selectedTrigger.icon className="h-5 w-5 text-[#46a1a0]" />
                      <CardTitle className="text-lg">{selectedTrigger.name}</CardTitle>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedTrigger(null)}
                    >
                      Change
                    </Button>
                  </div>
                  <CardDescription>{selectedTrigger.description}</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div>
                {!showTriggerSelect ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTriggerSelect(true)}
                    className="w-full h-20 border-dashed"
                  >
                    <Plus className="h-6 w-6 mr-2" />
                    Choose a Trigger
                  </Button>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {(apiTriggers as any[]).map((trigger: any) => (
                      <Card 
                        key={trigger.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#46a1a0]"
                        onClick={() => handleTriggerSelect(trigger)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = getIconForTrigger(trigger.type);
                              return <Icon className="h-5 w-5 text-[#46a1a0]" />;
                            })()}
                            <CardTitle className="text-base">{trigger.name}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">
                            {trigger.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">2. Add Actions</h3>
            
            {/* Existing Actions */}
            {workflowSteps.length > 0 && (
              <div className="space-y-3 mb-4">
                {workflowSteps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-[#46a1a0]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <step.icon className="h-4 w-4 text-[#46a1a0]" />
                          <CardTitle className="text-base">{step.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Action */}
            {!showActionSelect ? (
              <Button 
                variant="outline" 
                onClick={() => setShowActionSelect(true)}
                className="w-full h-16 border-dashed"
                disabled={!selectedTrigger}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Action
              </Button>
            ) : (
              <div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(groupedActions).map(([category, actions]: [string, any[]]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        {getCategoryDisplayName(category)}
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-3">
                        {actions.map((action) => (
                          <Card 
                            key={action.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#46a1a0]"
                            onClick={() => handleActionSelect(action)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <action.icon className="h-4 w-4 text-[#46a1a0]" />
                                <CardTitle className="text-sm">{action.name}</CardTitle>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowActionSelect(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!workflowName || !selectedTrigger}
            className="bg-[#46a1a0] hover:bg-[#3a8a89]"
          >
            <Zap className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}