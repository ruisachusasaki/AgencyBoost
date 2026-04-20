import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Settings, Flag, Layers, Folder, ArrowUp, ArrowDown, ArrowLeft, X, ChevronUp, ChevronDown, ClipboardList, MessageSquare, Hash, Calendar, Type, ListChecks, ArrowRight, Copy, ArrowUpDown } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/ui/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskStatusSchema, insertTaskPrioritySchema, insertTaskCategorySchema, insertTeamWorkflowSchema } from "@shared/schema";
import { TaskIntakeFormBuilder } from "@/components/settings/task-intake-form-builder";
import { z } from "zod";

// Color options for task statuses and priorities
const colorOptions = [
  { value: "#ef4444", label: "Red", class: "bg-red-500" },
  { value: "#f97316", label: "Orange", class: "bg-orange-500" },
  { value: "#eab308", label: "Yellow", class: "bg-yellow-500" },
  { value: "#22c55e", label: "Green", class: "bg-green-500" },
  { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
  { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
  { value: "#ec4899", label: "Pink", class: "bg-pink-500" },
  { value: "#6b7280", label: "Gray", class: "bg-gray-500" },
];

// Icon options for priorities
const iconOptions = [
  { value: "flag", label: "Flag" },
  { value: "alert-triangle", label: "Alert Triangle" },
  { value: "zap", label: "Zap" },
  { value: "star", label: "Star" },
  { value: "clock", label: "Clock" },
  { value: "shield", label: "Shield" },
];

type TaskStatus = {
  id: string;
  name: string;
  value: string;
  color: string;
  description?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  isSystemStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskPriority = {
  id: string;
  name: string;
  value: string;
  color: string;
  icon: string;
  description?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  isSystemPriority: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskCategory = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
};

type TaskStatusFormData = z.infer<typeof insertTaskStatusSchema>;
type TaskPriorityFormData = z.infer<typeof insertTaskPrioritySchema>;
type TaskCategoryFormData = z.infer<typeof insertTaskCategorySchema>;
type TeamWorkflowFormData = z.infer<typeof insertTeamWorkflowSchema>;

type TeamWorkflow = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statuses?: {
    id: string;
    workflowId: string;
    order: number;
    isRequired: boolean;
    status: {
      id: string;
      name: string;
      value: string;
      color: string;
      isDefault: boolean;
    };
  }[];
};

type Department = {
  id: string;
  name: string;
  description?: string;
  workflowId?: string;
  isActive: boolean;
};

function TaskMappingSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<{
    autoGenerateOnConversion: boolean;
    defaultCycleLength: number;
    defaultAdvanceGenerationDays: number;
    enableRecurringGeneration: boolean;
  }>({
    queryKey: ['/api/settings/task-mapping'],
  });

  const [localAutoGenerate, setLocalAutoGenerate] = useState(true);
  const [localCycleLength, setLocalCycleLength] = useState("30");
  const [localAdvanceDays, setLocalAdvanceDays] = useState("3");
  const [localEnableRecurring, setLocalEnableRecurring] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalAutoGenerate(settings.autoGenerateOnConversion);
      setLocalCycleLength(String(settings.defaultCycleLength));
      setLocalAdvanceDays(String(settings.defaultAdvanceGenerationDays));
      setLocalEnableRecurring(settings.enableRecurringGeneration);
      setHasChanges(false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/settings/task-mapping", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/task-mapping'] });
    },
  });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        autoGenerateOnConversion: localAutoGenerate,
        defaultCycleLength: parseInt(localCycleLength) || 30,
        defaultAdvanceGenerationDays: parseInt(localAdvanceDays) || 3,
        enableRecurringGeneration: localEnableRecurring,
      });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Task mapping settings have been updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  const templateVariables = [
    { variable: "{{client.name}}", description: "Client company name (falls back to contact name)" },
    { variable: "{{client.email}}", description: "Client email address" },
    { variable: "{{product.name}}", description: "Name of the product, bundle, or package" },
    { variable: "{{quantity}}", description: "Quantity assigned (from quote or default 1)" },
    { variable: "{{cycle.number}}", description: "Current recurring cycle number" },
    { variable: "{{cycle.startDate}}", description: "Start date of the current cycle (YYYY-MM-DD)" },
    { variable: "{{unit.number}}", description: "Current unit number (for per_unit modes)" },
    { variable: "{{unit.total}}", description: "Total number of units (same as quantity)" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Generation Automation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Control how tasks are automatically generated from product/task template mappings.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-generate-toggle" className="font-medium">Auto-Generate on Conversion</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate onboarding tasks when a lead converts to a client
              </p>
            </div>
            <Switch
              id="auto-generate-toggle"
              checked={localAutoGenerate}
              onCheckedChange={(checked) => {
                setLocalAutoGenerate(checked);
                setHasChanges(true);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="recurring-toggle" className="font-medium">Enable Recurring Task Generation</Label>
              <p className="text-sm text-muted-foreground">
                Global switch for the recurring task scheduler. When off, no recurring tasks will be auto-generated for any client.
              </p>
            </div>
            <Switch
              id="recurring-toggle"
              checked={localEnableRecurring}
              onCheckedChange={(checked) => {
                setLocalEnableRecurring(checked);
                setHasChanges(true);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default-cycle-length" className="font-medium">Default Cycle Length</Label>
              <p className="text-sm text-muted-foreground">
                Default number of days per recurring cycle for new clients
              </p>
              <div className="flex items-center gap-3">
                <Input
                  id="default-cycle-length"
                  type="number"
                  min="1"
                  max="365"
                  value={localCycleLength}
                  onChange={(e) => {
                    setLocalCycleLength(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-advance-days" className="font-medium">Default Advance Generation</Label>
              <p className="text-sm text-muted-foreground">
                Generate recurring tasks this many days before the next cycle
              </p>
              <div className="flex items-center gap-3">
                <Input
                  id="default-advance-days"
                  type="number"
                  min="0"
                  max="30"
                  value={localAdvanceDays}
                  onChange={(e) => {
                    setLocalAdvanceDays(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                style={{ backgroundColor: 'hsl(179, 100%, 39%)', color: 'white' }}
              >
                {saveMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Template Variables</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use these variables in task template names and descriptions. They will be replaced with actual values when tasks are generated.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Variable</TableHead>
                <TableHead>Resolves To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateVariables.map((tv) => (
                <TableRow key={tv.variable}>
                  <TableCell>
                    <code className="px-2 py-1 rounded text-sm font-mono bg-gray-100 dark:bg-gray-800 text-primary">
                      {tv.variable}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tv.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LongRunningTimerSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, any>>({
    queryKey: ['/api/task-settings'],
  });

  const alertsEnabled = settings?.long_running_timer_alerts_enabled?.value ?? true;
  const thresholdHours = settings?.long_running_timer_threshold_hours?.value ?? 8;
  const autoStopEnabled = settings?.auto_stop_timer_enabled?.value ?? false;
  const autoStopThresholdHours = settings?.auto_stop_timer_threshold_hours?.value ?? 12;

  const [localThreshold, setLocalThreshold] = useState<string>(String(thresholdHours));
  const [localEnabled, setLocalEnabled] = useState<boolean>(alertsEnabled);
  const [localAutoStopEnabled, setLocalAutoStopEnabled] = useState<boolean>(autoStopEnabled);
  const [localAutoStopThreshold, setLocalAutoStopThreshold] = useState<string>(String(autoStopThresholdHours));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalThreshold(String(thresholdHours));
    setLocalEnabled(alertsEnabled);
    setLocalAutoStopEnabled(autoStopEnabled);
    setLocalAutoStopThreshold(String(autoStopThresholdHours));
    setHasChanges(false);
  }, [thresholdHours, alertsEnabled, autoStopEnabled, autoStopThresholdHours]);

  const saveMutation = useMutation({
    mutationFn: async (data: { settingKey: string; settingValue: any }) => {
      const res = await apiRequest("POST", "/api/task-settings", {
        settingKey: data.settingKey,
        settingValue: data.settingValue,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-settings'] });
    },
  });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        settingKey: "long_running_timer_alerts_enabled",
        settingValue: { value: localEnabled },
      });
      await saveMutation.mutateAsync({
        settingKey: "long_running_timer_threshold_hours",
        settingValue: { value: parseFloat(localThreshold) || 8 },
      });
      await saveMutation.mutateAsync({
        settingKey: "auto_stop_timer_enabled",
        settingValue: { value: localAutoStopEnabled },
      });
      await saveMutation.mutateAsync({
        settingKey: "auto_stop_timer_threshold_hours",
        settingValue: { value: parseFloat(localAutoStopThreshold) || 12 },
      });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Long-running timer alert settings have been updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Long-Running Timer Alerts</CardTitle>
        <p className="text-sm text-muted-foreground">
          Get notified when a time tracker has been running for too long. Alerts are sent to the team member and all admins.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="timer-alerts-enabled" className="font-medium">Enable Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Send notifications when timers exceed the threshold
            </p>
          </div>
          <Switch
            id="timer-alerts-enabled"
            checked={localEnabled}
            onCheckedChange={(checked) => {
              setLocalEnabled(checked);
              setHasChanges(true);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timer-threshold" className="font-medium">Threshold (hours)</Label>
          <p className="text-sm text-muted-foreground">
            Timers running longer than this will trigger an alert. Each timer is only alerted once.
          </p>
          <div className="flex items-center gap-3">
            <Input
              id="timer-threshold"
              type="number"
              min="1"
              max="48"
              step="0.5"
              value={localThreshold}
              onChange={(e) => {
                setLocalThreshold(e.target.value);
                setHasChanges(true);
              }}
              className="w-32"
              disabled={!localEnabled}
            />
            <span className="text-sm text-muted-foreground">hours</span>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <h4 className="font-medium text-sm">Auto-Stop Abandoned Timers</h4>
            <p className="text-sm text-muted-foreground">
              Mobile browsers and sleeping laptops can suspend background tabs, leaving timers running indefinitely on the server. When enabled, the system will automatically stop timers that have been running longer than the threshold and cap the recorded duration so reports stay accurate.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-stop-enabled" className="font-medium">Enable Auto-Stop</Label>
              <p className="text-sm text-muted-foreground">
                Automatically stop timers exceeding the auto-stop threshold
              </p>
            </div>
            <Switch
              id="auto-stop-enabled"
              checked={localAutoStopEnabled}
              onCheckedChange={(checked) => {
                setLocalAutoStopEnabled(checked);
                setHasChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-stop-threshold" className="font-medium">Auto-Stop Threshold (hours)</Label>
            <p className="text-sm text-muted-foreground">
              Timers running longer than this will be auto-stopped and marked as "Auto-stopped" in reports. Recorded duration is capped at this value.
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="auto-stop-threshold"
                type="number"
                min="1"
                max="48"
                step="0.5"
                value={localAutoStopThreshold}
                onChange={(e) => {
                  setLocalAutoStopThreshold(e.target.value);
                  setHasChanges(true);
                }}
                className="w-32"
                disabled={!localAutoStopEnabled}
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              style={{ backgroundColor: 'hsl(179, 100%, 39%)', color: 'white' }}
            >
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeeklyHoursAlertSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, any>>({
    queryKey: ['/api/task-settings'],
  });

  const alertEnabled = settings?.weekly_hours_alert_enabled?.value ?? true;
  const threshold = settings?.weekly_hours_alert_threshold?.value ?? 40;
  const checkDay = settings?.weekly_hours_alert_check_day?.value ?? 'Monday';
  const includeCalendar = settings?.weekly_hours_alert_include_calendar?.value ?? true;

  const [localEnabled, setLocalEnabled] = useState<boolean>(alertEnabled);
  const [localThreshold, setLocalThreshold] = useState<string>(String(threshold));
  const [localCheckDay, setLocalCheckDay] = useState<string>(checkDay);
  const [localIncludeCalendar, setLocalIncludeCalendar] = useState<boolean>(includeCalendar);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalEnabled(alertEnabled);
    setLocalThreshold(String(threshold));
    setLocalCheckDay(checkDay);
    setLocalIncludeCalendar(includeCalendar);
    setHasChanges(false);
  }, [alertEnabled, threshold, checkDay, includeCalendar]);

  const saveMutation = useMutation({
    mutationFn: async (data: { settingKey: string; settingValue: any }) => {
      const res = await apiRequest("POST", "/api/task-settings", {
        settingKey: data.settingKey,
        settingValue: data.settingValue,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-settings'] });
    },
  });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        settingKey: "weekly_hours_alert_enabled",
        settingValue: { value: localEnabled },
      });
      await saveMutation.mutateAsync({
        settingKey: "weekly_hours_alert_threshold",
        settingValue: { value: parseFloat(localThreshold) || 40 },
      });
      await saveMutation.mutateAsync({
        settingKey: "weekly_hours_alert_check_day",
        settingValue: { value: localCheckDay },
      });
      await saveMutation.mutateAsync({
        settingKey: "weekly_hours_alert_include_calendar",
        settingValue: { value: localIncludeCalendar },
      });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Weekly hours alert settings have been updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Hours Alert</CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically notify managers and admins when team members log fewer than the expected hours in a week.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="weekly-hours-enabled" className="font-medium">Enable Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Send notifications to managers when their direct reports are under hours
            </p>
          </div>
          <Switch
            id="weekly-hours-enabled"
            checked={localEnabled}
            onCheckedChange={(checked) => {
              setLocalEnabled(checked);
              setHasChanges(true);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weekly-hours-threshold" className="font-medium">Minimum Hours Threshold</Label>
          <p className="text-sm text-muted-foreground">
            Staff logging fewer than this many hours will trigger an alert.
          </p>
          <div className="flex items-center gap-3">
            <Input
              id="weekly-hours-threshold"
              type="number"
              min="1"
              max="80"
              step="1"
              value={localThreshold}
              onChange={(e) => {
                setLocalThreshold(e.target.value);
                setHasChanges(true);
              }}
              className="w-32"
              disabled={!localEnabled}
            />
            <span className="text-sm text-muted-foreground">hours per week</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weekly-hours-check-day" className="font-medium">Check Day</Label>
          <p className="text-sm text-muted-foreground">
            Which day of the week to check the previous week's hours and send alerts.
          </p>
          <Select
            value={localCheckDay}
            onValueChange={(value) => {
              setLocalCheckDay(value);
              setHasChanges(true);
            }}
            disabled={!localEnabled}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monday">Monday</SelectItem>
              <SelectItem value="Tuesday">Tuesday</SelectItem>
              <SelectItem value="Wednesday">Wednesday</SelectItem>
              <SelectItem value="Thursday">Thursday</SelectItem>
              <SelectItem value="Friday">Friday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="weekly-hours-calendar" className="font-medium">Include Calendar Time</Label>
            <p className="text-sm text-muted-foreground">
              Count calendar/meeting time entries toward total hours
            </p>
          </div>
          <Switch
            id="weekly-hours-calendar"
            checked={localIncludeCalendar}
            onCheckedChange={(checked) => {
              setLocalIncludeCalendar(checked);
              setHasChanges(true);
            }}
            disabled={!localEnabled}
          />
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              style={{ backgroundColor: 'hsl(179, 100%, 39%)', color: 'white' }}
            >
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TasksSettingsPage() {
  const [activeTab, setActiveTab] = useState("statuses");
  const [editingItem, setEditingItem] = useState<TaskStatus | TaskPriority | TaskCategory | TeamWorkflow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TaskStatus | TaskPriority | TaskCategory | TeamWorkflow | null>(null);
  const [editType, setEditType] = useState<'status' | 'priority' | 'category' | 'workflow'>('status');
  const [isStatusFlowDialogOpen, setIsStatusFlowDialogOpen] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<TeamWorkflow | null>(null);
  const [workflowStatuses, setWorkflowStatuses] = useState<{id: string; order: number; isRequired: boolean; statusId: string}[]>([]);
  const [newWorkflowStatuses, setNewWorkflowStatuses] = useState<{id: string; order: number; isRequired: boolean; statusId: string}[]>([]);
  const [wfSortField, setWfSortField] = useState<'name' | 'isDefault' | 'isActive' | 'createdAt'>('createdAt');
  const [wfSortDir, setWfSortDir] = useState<'asc' | 'desc'>('desc');
  const [stSortField, setStSortField] = useState<'sortOrder' | 'name' | 'isDefault' | 'isActive' | 'isSystemStatus'>('sortOrder');
  const [stSortDir, setStSortDir] = useState<'asc' | 'desc'>('asc');
  const [prSortField, setPrSortField] = useState<'sortOrder' | 'name' | 'isDefault' | 'isActive' | 'isSystemPriority'>('sortOrder');
  const [prSortDir, setPrSortDir] = useState<'asc' | 'desc'>('desc');
  const [catSortField, setCatSortField] = useState<'name' | 'isDefault' | 'createdAt'>('createdAt');
  const [catSortDir, setCatSortDir] = useState<'asc' | 'desc'>('desc');
  const { toast} = useToast();
  const queryClient = useQueryClient();

  // Fetch task statuses
  const { data: statuses = [], isLoading: loadingStatuses } = useQuery<TaskStatus[]>({
    queryKey: ["/api/task-statuses"],
  });

  // Fetch task priorities
  const { data: priorities = [], isLoading: loadingPriorities } = useQuery<TaskPriority[]>({
    queryKey: ["/api/task-priorities"],
  });

  // Fetch task categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  // Fetch team workflows
  const { data: workflows = [], isLoading: loadingWorkflows } = useQuery<TeamWorkflow[]>({
    queryKey: ["/api/team-workflows"],
  });

  // Fetch departments
  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Form for creating/editing statuses
  const statusForm = useForm<TaskStatusFormData>({
    resolver: zodResolver(insertTaskStatusSchema),
    defaultValues: {
      name: "",
      value: "",
      color: "#6b7280",
      description: "",
      sortOrder: 0,
      isDefault: false,
      isActive: true,
      isSystemStatus: false,
    },
  });

  // Form for creating/editing priorities
  const priorityForm = useForm<TaskPriorityFormData>({
    resolver: zodResolver(insertTaskPrioritySchema),
    defaultValues: {
      name: "",
      value: "",
      color: "#6b7280",
      icon: "flag",
      description: "",
      sortOrder: 0,
      isDefault: false,
      isActive: true,
      isSystemPriority: false,
    },
  });

  // Form for creating/editing categories
  const categoryForm = useForm<TaskCategoryFormData>({
    resolver: zodResolver(insertTaskCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6b7280",
      icon: "folder",
      workflowId: "none",
      isDefault: false,
    },
  });

  // Form for creating/editing workflows
  const workflowForm = useForm<TeamWorkflowFormData>({
    resolver: zodResolver(insertTeamWorkflowSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      isActive: true,
    },
  });

  // Status mutations
  const createStatusMutation = useMutation({
    mutationFn: (data: TaskStatusFormData) => apiRequest("POST", "/api/task-statuses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task status created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task status", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskStatusFormData> }) =>
      apiRequest(`/api/task-statuses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task status updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task status", variant: "destructive" });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/task-statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task status deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete task status", variant: "destructive" });
    },
  });

  const reorderStatusesMutation = useMutation({
    mutationFn: (reorderedStatuses: { id: string; sortOrder: number }[]) =>
      apiRequest("PUT", "/api/task-statuses/reorder", { statuses: reorderedStatuses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task statuses reordered successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reorder task statuses", variant: "destructive" });
    },
  });

  const reorderPrioritiesMutation = useMutation({
    mutationFn: (reorderedPriorities: { id: string; sortOrder: number }[]) =>
      apiRequest("PUT", "/api/task-priorities/reorder", { priorities: reorderedPriorities }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priorities reordered successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reorder task priorities", variant: "destructive" });
    },
  });

  // Priority mutations
  const createPriorityMutation = useMutation({
    mutationFn: (data: TaskPriorityFormData) => apiRequest("POST", "/api/task-priorities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priority created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task priority", variant: "destructive" });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskPriorityFormData> }) =>
      apiRequest("PUT", `/api/task-priorities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priority updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task priority", variant: "destructive" });
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/task-priorities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priority deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete task priority", variant: "destructive" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: TaskCategoryFormData) => apiRequest("POST", "/api/task-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-categories"] });
      toast({ title: "Success", description: "Task category created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskCategoryFormData> }) =>
      apiRequest("PUT", `/api/task-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-categories"] });
      toast({ title: "Success", description: "Task category updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/task-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-categories"] });
      toast({ title: "Success", description: "Task category deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete task category", variant: "destructive" });
    },
  });

  // Workflow mutations
  const createWorkflowMutation = useMutation({
    mutationFn: (data: TeamWorkflowFormData) => apiRequest("POST", "/api/team-workflows", data),
    onSuccess: async (newWorkflow: any) => {
      // If statuses were selected for the new workflow, save them
      if (newWorkflowStatuses.length > 0 && newWorkflow?.id) {
        try {
          const statusesToSave = newWorkflowStatuses.map(ws => ({
            statusId: ws.statusId,
            order: ws.order,
            isRequired: ws.isRequired
          }));
          await apiRequest("PUT", `/api/team-workflows/${newWorkflow.id}/statuses`, { statuses: statusesToSave });
        } catch (error: any) {
          toast({ title: "Warning", description: "Workflow created but failed to save statuses. Please configure them manually.", variant: "destructive" });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/team-workflows"] });
      toast({ title: "Success", description: "Team workflow created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create team workflow", variant: "destructive" });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeamWorkflowFormData }) => 
      apiRequest("PATCH", `/api/team-workflows/${id}`, data),
    onSuccess: async (_result: any, variables: any) => {
      // Save updated statuses
      if (newWorkflowStatuses.length >= 0) {
        try {
          const statusesToSave = newWorkflowStatuses.map(ws => ({
            statusId: ws.statusId,
            order: ws.order,
            isRequired: ws.isRequired
          }));
          await apiRequest("PUT", `/api/team-workflows/${variables.id}/statuses`, { statuses: statusesToSave });
        } catch (error: any) {
          toast({ title: "Warning", description: "Workflow updated but failed to save statuses.", variant: "destructive" });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/team-workflows"] });
      toast({ title: "Success", description: "Team workflow updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update team workflow", variant: "destructive" });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/team-workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-workflows"] });
      toast({ title: "Success", description: "Team workflow deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete team workflow", variant: "destructive" });
    },
  });

  // Workflow status mutations
  const saveWorkflowStatusesMutation = useMutation({
    mutationFn: ({ workflowId, statuses }: { workflowId: string; statuses: { statusId: string; order: number; isRequired: boolean }[] }) =>
      apiRequest("PUT", `/api/team-workflows/${workflowId}/statuses`, { statuses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-workflows"] });
      toast({ title: "Success", description: "Workflow status flow updated successfully" });
      setIsStatusFlowDialogOpen(false);
      setCurrentWorkflow(null);
      setWorkflowStatuses([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update workflow status flow", variant: "destructive" });
    },
  });

  const handleConfigureStatusFlow = (workflow: TeamWorkflow) => {
    setCurrentWorkflow(workflow);
    // Initialize workflow statuses from the workflow's current statuses
    const initialStatuses = workflow.statuses?.map(ws => ({
      id: ws.id,
      statusId: ws.status.id,
      order: ws.order,
      isRequired: ws.isRequired
    })) || [];
    setWorkflowStatuses(initialStatuses);
    setIsStatusFlowDialogOpen(true);
  };

  const handleAddStatusToWorkflow = (statusId: string) => {
    const maxOrder = workflowStatuses.length > 0 ? Math.max(...workflowStatuses.map(ws => ws.order)) : -1;
    setWorkflowStatuses([...workflowStatuses, {
      id: `temp-${Date.now()}`,
      statusId,
      order: maxOrder + 1,
      isRequired: true
    }]);
  };

  const handleRemoveStatusFromWorkflow = (statusId: string) => {
    setWorkflowStatuses(workflowStatuses.filter(ws => ws.statusId !== statusId));
  };

  // Helper functions for new workflow status management
  const handleAddStatusToNewWorkflow = (statusId: string) => {
    const maxOrder = newWorkflowStatuses.length > 0 ? Math.max(...newWorkflowStatuses.map(ws => ws.order)) : -1;
    setNewWorkflowStatuses([...newWorkflowStatuses, {
      id: `temp-${Date.now()}`,
      statusId,
      order: maxOrder + 1,
      isRequired: true
    }]);
  };

  const handleRemoveStatusFromNewWorkflow = (statusId: string) => {
    setNewWorkflowStatuses(newWorkflowStatuses.filter(ws => ws.statusId !== statusId));
  };

  const handleMoveNewWorkflowStatusUp = (statusId: string) => {
    const index = newWorkflowStatuses.findIndex(ws => ws.statusId === statusId);
    if (index > 0) {
      const newStatuses = [...newWorkflowStatuses];
      [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];
      // Update order values
      newStatuses.forEach((ws, idx) => ws.order = idx);
      setNewWorkflowStatuses(newStatuses);
    }
  };

  const handleMoveNewWorkflowStatusDown = (statusId: string) => {
    const index = newWorkflowStatuses.findIndex(ws => ws.statusId === statusId);
    if (index < newWorkflowStatuses.length - 1) {
      const newStatuses = [...newWorkflowStatuses];
      [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];
      // Update order values
      newStatuses.forEach((ws, idx) => ws.order = idx);
      setNewWorkflowStatuses(newStatuses);
    }
  };

  const handleToggleStatusRequired = (statusId: string) => {
    setWorkflowStatuses(workflowStatuses.map(ws => 
      ws.statusId === statusId ? { ...ws, isRequired: !ws.isRequired } : ws
    ));
  };

  const handleMoveStatusUp = (statusId: string) => {
    const index = workflowStatuses.findIndex(ws => ws.statusId === statusId);
    if (index > 0) {
      const newStatuses = [...workflowStatuses];
      [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];
      // Update order values
      newStatuses.forEach((ws, idx) => ws.order = idx);
      setWorkflowStatuses(newStatuses);
    }
  };

  const handleMoveStatusDown = (statusId: string) => {
    const index = workflowStatuses.findIndex(ws => ws.statusId === statusId);
    if (index < workflowStatuses.length - 1) {
      const newStatuses = [...workflowStatuses];
      [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];
      // Update order values
      newStatuses.forEach((ws, idx) => ws.order = idx);
      setWorkflowStatuses(newStatuses);
    }
  };

  const handleSaveWorkflowStatuses = () => {
    if (!currentWorkflow) return;
    
    const statusesToSave = workflowStatuses.map(ws => ({
      statusId: ws.statusId,
      order: ws.order,
      isRequired: ws.isRequired
    }));
    
    saveWorkflowStatusesMutation.mutate({
      workflowId: currentWorkflow.id,
      statuses: statusesToSave
    });
  };

  const handleStatusDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const sortedStatuses = [...statuses].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const [movedStatus] = sortedStatuses.splice(sourceIndex, 1);
    sortedStatuses.splice(destinationIndex, 0, movedStatus);

    // Update sort orders
    const reorderedStatuses = sortedStatuses.map((status, index) => ({
      id: status.id,
      sortOrder: index + 1
    }));

    reorderStatusesMutation.mutate(reorderedStatuses);
  };

  const handlePriorityDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const sortedPriorities = [...priorities].sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
    const [movedPriority] = sortedPriorities.splice(sourceIndex, 1);
    sortedPriorities.splice(destinationIndex, 0, movedPriority);

    // Update sort orders (reverse order for priorities, higher = more important)
    const reorderedPriorities = sortedPriorities.map((priority, index) => ({
      id: priority.id,
      sortOrder: sortedPriorities.length - index
    }));

    reorderPrioritiesMutation.mutate(reorderedPriorities);
  };

  const handleOpenDialog = (type: 'status' | 'priority' | 'category' | 'workflow', item?: TaskStatus | TaskPriority | TaskCategory | TeamWorkflow) => {
    setEditType(type);
    
    if (type === 'status') {
      const status = item as TaskStatus;
      if (status) {
        setEditingItem(status);
        statusForm.reset({
          name: status.name,
          value: status.value,
          color: status.color,
          description: status.description || "",
          sortOrder: status.sortOrder,
          isDefault: status.isDefault,
          isActive: status.isActive,
          isSystemStatus: status.isSystemStatus,
        });
      } else {
        setEditingItem(null);
        statusForm.reset({
          name: "",
          value: "",
          color: "#6b7280",
          description: "",
          sortOrder: Math.max(...statuses.map(s => s.sortOrder || 0), 0) + 1,
          isDefault: false,
          isActive: true,
          isSystemStatus: false,
        });
      }
    } else if (type === 'priority') {
      const priority = item as TaskPriority;
      if (priority) {
        setEditingItem(priority);
        priorityForm.reset({
          name: priority.name,
          value: priority.value,
          color: priority.color,
          icon: priority.icon,
          description: priority.description || "",
          sortOrder: priority.sortOrder,
          isDefault: priority.isDefault,
          isActive: priority.isActive,
          isSystemPriority: priority.isSystemPriority,
        });
      } else {
        setEditingItem(null);
        priorityForm.reset({
          name: "",
          value: "",
          color: "#6b7280",
          icon: "flag",
          description: "",
          sortOrder: Math.max(...priorities.map(p => p.sortOrder || 0), 0) + 1,
          isDefault: false,
          isActive: true,
          isSystemPriority: false,
        });
      }
    } else if (type === 'category') {
      const category = item as TaskCategory;
      if (category) {
        setEditingItem(category);
        categoryForm.reset({
          name: category.name,
          description: category.description || "",
          color: category.color,
          icon: category.icon || "folder",
          workflowId: (category as any).workflowId || "none",
          isDefault: category.isDefault,
        });
      } else {
        setEditingItem(null);
        categoryForm.reset({
          name: "",
          description: "",
          color: "#6b7280",
          icon: "folder",
          isDefault: false,
        });
      }
    } else if (type === 'workflow') {
      const workflow = item as TeamWorkflow;
      if (workflow) {
        setEditingItem(workflow);
        workflowForm.reset({
          name: workflow.name,
          description: workflow.description || "",
          isDefault: workflow.isDefault,
          isActive: workflow.isActive,
        });
        // Load existing statuses when editing
        if (workflow.statuses && workflow.statuses.length > 0) {
          const existingStatuses = workflow.statuses.map((ws: any) => ({
            id: ws.id,
            statusId: ws.status?.id || ws.statusId,
            order: ws.order,
            isRequired: ws.isRequired
          }));
          setNewWorkflowStatuses(existingStatuses);
        } else {
          setNewWorkflowStatuses([]);
        }
      } else {
        setEditingItem(null);
        setNewWorkflowStatuses([]);
        workflowForm.reset({
          name: "",
          description: "",
          isDefault: false,
          isActive: true,
        });
      }
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setNewWorkflowStatuses([]);
    statusForm.reset();
    priorityForm.reset();
    categoryForm.reset();
    workflowForm.reset();
  };

  const handleSubmit = (data: TaskStatusFormData | TaskPriorityFormData | TaskCategoryFormData | TeamWorkflowFormData) => {
    // Auto-generate value from name if not provided for statuses and priorities
    if ('value' in data && !data.value) {
      data.value = data.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }

    if (editType === 'status') {
      if (editingItem) {
        updateStatusMutation.mutate({ id: editingItem.id, data: data as TaskStatusFormData });
      } else {
        createStatusMutation.mutate(data as TaskStatusFormData);
      }
    } else if (editType === 'priority') {
      if (editingItem) {
        updatePriorityMutation.mutate({ id: editingItem.id, data: data as TaskPriorityFormData });
      } else {
        createPriorityMutation.mutate(data as TaskPriorityFormData);
      }
    } else if (editType === 'category') {
      const categoryData = { ...(data as TaskCategoryFormData) };
      if ((categoryData as any).workflowId === 'none' || (categoryData as any).workflowId === '') {
        (categoryData as any).workflowId = null;
      }
      if (editingItem) {
        updateCategoryMutation.mutate({ id: editingItem.id, data: categoryData });
      } else {
        createCategoryMutation.mutate(categoryData);
      }
    } else if (editType === 'workflow') {
      if (editingItem) {
        updateWorkflowMutation.mutate({ id: editingItem.id, data: data as TeamWorkflowFormData });
      } else {
        createWorkflowMutation.mutate(data as TeamWorkflowFormData);
      }
    }
  };

  const handleDelete = (item: TaskStatus | TaskPriority | TaskCategory | TeamWorkflow) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if ('isSystemStatus' in itemToDelete) {
        deleteStatusMutation.mutate(itemToDelete.id);
      } else if ('isSystemPriority' in itemToDelete) {
        deletePriorityMutation.mutate(itemToDelete.id);
      } else if ('createdAt' in itemToDelete && 'updatedAt' in itemToDelete && 'isActive' in itemToDelete) {
        deleteWorkflowMutation.mutate(itemToDelete.id);
      } else {
        deleteCategoryMutation.mutate(itemToDelete.id);
      }
    }
  };

  const generateValue = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  const getCurrentForm = () => {
    if (editType === 'status') return statusForm;
    if (editType === 'priority') return priorityForm;
    if (editType === 'workflow') return workflowForm;
    return categoryForm;
  };

  return (
    <div className="space-y-6">
      {/* Back to Settings */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Task Settings</h2>
        </div>
        <p className="text-muted-foreground">
          Configure task statuses, priorities, categories, and other task management options.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Statuses
          </TabsTrigger>
          <TabsTrigger value="priorities" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Priorities
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="intake-form" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Intake Form
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Task Statuses Tab */}
        <TabsContent value="statuses" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Task Statuses</h3>
              <p className="text-muted-foreground">
                Manage custom status options for tasks. Create statuses that match your workflow.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('status')} data-testid="button-add-status">
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingStatuses ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading task statuses...</div>
                </div>
              ) : statuses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task statuses configured. Create your first status to get started.
                </div>
              ) : (
                <DragDropContext onDragEnd={handleStatusDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {([
                          { field: 'sortOrder' as const, label: 'Order', className: 'w-12' },
                          { field: 'name' as const, label: 'Name', className: '' },
                          { field: null, label: 'Value', className: '' },
                          { field: null, label: 'Color', className: '' },
                          { field: 'isDefault' as const, label: 'Default', className: '' },
                          { field: 'isActive' as const, label: 'Status', className: '' },
                          { field: 'isSystemStatus' as const, label: 'System', className: '' },
                        ]).map(col => (
                          <TableHead
                            key={col.label}
                            className={`${col.className} ${col.field ? "cursor-pointer select-none hover:bg-muted/50 transition-colors" : ""}`}
                            onClick={col.field ? () => {
                              if (stSortField === col.field) {
                                setStSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              } else {
                                setStSortField(col.field!);
                                setStSortDir('asc');
                              }
                            } : undefined}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {col.field && (
                                stSortField === col.field ? (
                                  stSortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                )
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Droppable droppableId="task-statuses" isDropDisabled={stSortField !== 'sortOrder'}>
                      {(provided) => (
                        <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                          {[...statuses]
                            .sort((a, b) => {
                              let cmp = 0;
                              if (stSortField === 'sortOrder') {
                                cmp = (a.sortOrder || 0) - (b.sortOrder || 0);
                              } else if (stSortField === 'name') {
                                cmp = (a.name || '').localeCompare(b.name || '');
                              } else if (stSortField === 'isDefault') {
                                cmp = (a.isDefault ? 1 : 0) - (b.isDefault ? 1 : 0);
                              } else if (stSortField === 'isActive') {
                                cmp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
                              } else if (stSortField === 'isSystemStatus') {
                                cmp = (a.isSystemStatus ? 1 : 0) - (b.isSystemStatus ? 1 : 0);
                              }
                              return stSortDir === 'asc' ? cmp : -cmp;
                            })
                            .map((status, index) => (
                              <Draggable key={status.id} draggableId={status.id} index={index} isDragDisabled={stSortField !== 'sortOrder'}>
                                {(provided) => (
                                  <TableRow
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...(stSortField === 'sortOrder' ? provided.dragHandleProps : {})}
                                  >
                          <TableCell>
                            <div className="flex items-center">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                {status.sortOrder}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{status.name}</div>
                            {status.description && (
                              <div className="text-sm text-muted-foreground">
                                {status.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {status.value}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              style={{ backgroundColor: status.color }} 
                              className="text-white"
                            >
                              {status.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {status.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {status.isActive ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="ml-2 text-sm">
                                {status.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {status.isSystemStatus && (
                              <Badge variant="outline">System</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('status', status)}
                                data-testid={`button-edit-${status.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!status.isSystemStatus && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(status)}
                                  data-testid={`button-delete-${status.id}`}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </TableBody>
                      )}
                    </Droppable>
                  </Table>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Priorities Tab */}
        <TabsContent value="priorities" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Task Priorities</h3>
              <p className="text-muted-foreground">
                Manage priority levels for tasks. Higher sort order values indicate higher priority.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('priority')} data-testid="button-add-priority">
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingPriorities ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading task priorities...</div>
                </div>
              ) : priorities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task priorities configured. Create your first priority to get started.
                </div>
              ) : (
                <DragDropContext onDragEnd={handlePriorityDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {([
                          { field: 'sortOrder' as const, label: 'Order', className: 'w-12' },
                          { field: 'name' as const, label: 'Name', className: '' },
                          { field: null, label: 'Value', className: '' },
                          { field: null, label: 'Color', className: '' },
                          { field: null, label: 'Icon', className: '' },
                          { field: 'isDefault' as const, label: 'Default', className: '' },
                          { field: 'isActive' as const, label: 'Status', className: '' },
                          { field: 'isSystemPriority' as const, label: 'System', className: '' },
                        ]).map(col => (
                          <TableHead
                            key={col.label}
                            className={`${col.className} ${col.field ? "cursor-pointer select-none hover:bg-muted/50 transition-colors" : ""}`}
                            onClick={col.field ? () => {
                              if (prSortField === col.field) {
                                setPrSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              } else {
                                setPrSortField(col.field!);
                                setPrSortDir('asc');
                              }
                            } : undefined}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {col.field && (
                                prSortField === col.field ? (
                                  prSortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                )
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Droppable droppableId="task-priorities" isDropDisabled={prSortField !== 'sortOrder'}>
                      {(provided) => (
                        <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                          {[...priorities]
                            .sort((a, b) => {
                              let cmp = 0;
                              if (prSortField === 'sortOrder') {
                                cmp = (a.sortOrder || 0) - (b.sortOrder || 0);
                              } else if (prSortField === 'name') {
                                cmp = (a.name || '').localeCompare(b.name || '');
                              } else if (prSortField === 'isDefault') {
                                cmp = (a.isDefault ? 1 : 0) - (b.isDefault ? 1 : 0);
                              } else if (prSortField === 'isActive') {
                                cmp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
                              } else if (prSortField === 'isSystemPriority') {
                                cmp = (a.isSystemPriority ? 1 : 0) - (b.isSystemPriority ? 1 : 0);
                              }
                              return prSortDir === 'asc' ? cmp : -cmp;
                            })
                            .map((priority, index) => (
                              <Draggable key={priority.id} draggableId={priority.id} index={index} isDragDisabled={prSortField !== 'sortOrder'}>
                                {(provided, snapshot) => (
                                  <TableRow 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={snapshot.isDragging ? "bg-slate-50" : ""}
                                  >
                                    <TableCell>
                                      <div className="flex items-center">
                                        <div
                                          {...(prSortField === 'sortOrder' ? provided.dragHandleProps : {})}
                                          className={prSortField === 'sortOrder' ? "cursor-move text-muted-foreground hover:text-gray-600" : "text-muted-foreground/40"}
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>
                                        <span className="ml-2 text-sm text-muted-foreground">
                                          {priority.sortOrder}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{priority.name}</div>
                                      {priority.description && (
                                        <div className="text-sm text-muted-foreground">
                                          {priority.description}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {priority.value}
                                      </code>
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        style={{ backgroundColor: priority.color }} 
                                        className="text-white"
                                      >
                                        {priority.name}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Flag className="h-4 w-4" />
                                        <span className="ml-2 text-sm">{priority.icon}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {priority.isDefault && (
                                        <Badge variant="secondary">Default</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        {priority.isActive ? (
                                          <Eye className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="ml-2 text-sm">
                                          {priority.isActive ? "Active" : "Inactive"}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {priority.isSystemPriority && (
                                        <Badge variant="outline">System</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenDialog('priority', priority)}
                                          data-testid={`button-edit-${priority.id}`}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        {!priority.isSystemPriority && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(priority)}
                                            data-testid={`button-delete-${priority.id}`}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </TableBody>
                      )}
                    </Droppable>
                  </Table>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Team Workflows</h3>
              <p className="text-muted-foreground">
                Create custom status flows for different teams and departments.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('workflow')} data-testid="button-add-workflow">
              <Plus className="h-4 w-4 mr-2" />
              Add Workflow
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingWorkflows ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading workflows...</div>
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No custom workflows configured. Create your first workflow to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {([
                        { field: 'name' as const, label: 'Name' },
                        { field: null, label: 'Description' },
                        { field: null, label: 'Status Flow' },
                        { field: 'isDefault' as const, label: 'Default' },
                        { field: 'isActive' as const, label: 'Active' },
                        { field: 'createdAt' as const, label: 'Created' },
                      ]).map(col => (
                        <TableHead
                          key={col.label}
                          className={col.field ? "cursor-pointer select-none hover:bg-muted/50 transition-colors" : ""}
                          onClick={col.field ? () => {
                            if (wfSortField === col.field) {
                              setWfSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            } else {
                              setWfSortField(col.field!);
                              setWfSortDir('asc');
                            }
                          } : undefined}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {col.field && (
                              wfSortField === col.field ? (
                                wfSortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                              )
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...workflows]
                      .sort((a, b) => {
                        let cmp = 0;
                        if (wfSortField === 'name') {
                          cmp = (a.name || '').localeCompare(b.name || '');
                        } else if (wfSortField === 'isDefault') {
                          cmp = (a.isDefault ? 1 : 0) - (b.isDefault ? 1 : 0);
                        } else if (wfSortField === 'isActive') {
                          cmp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
                        } else if (wfSortField === 'createdAt') {
                          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        }
                        return wfSortDir === 'asc' ? cmp : -cmp;
                      })
                      .map((workflow) => (
                        <TableRow key={workflow.id}>
                          <TableCell className="font-medium">{workflow.name}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {workflow.description || 'No description'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {workflow.statuses?.slice(0, 3).map((ws, index) => (
                                <Badge key={ws.id} variant="secondary" className="text-xs">
                                  {ws.status.name}
                                  {index < Math.min(2, (workflow.statuses?.length || 0) - 1) && " →"}
                                </Badge>
                              ))}
                              {(workflow.statuses?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(workflow.statuses?.length || 0) - 3} more
                                </Badge>
                              )}
                              {(!workflow.statuses || workflow.statuses.length === 0) && (
                                <span className="text-sm text-muted-foreground">No statuses</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {workflow.isDefault && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {workflow.isActive ? (
                              <Badge variant="secondary" className="text-xs text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfigureStatusFlow(workflow)}
                                data-testid={`button-configure-${workflow.id}`}
                                title="Configure Status Flow"
                              >
                                <GripVertical className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('workflow', workflow)}
                                data-testid={`button-edit-${workflow.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(workflow)}
                                data-testid={`button-delete-${workflow.id}`}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Task Categories</h3>
              <p className="text-muted-foreground">
                Organize tasks into categories for better management and filtering.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('category')} data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingCategories ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading task categories...</div>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task categories configured. Create your first category to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {([
                        { field: 'name' as const, label: 'Name' },
                        { field: null, label: 'Color' },
                        { field: null, label: 'Icon' },
                        { field: 'isDefault' as const, label: 'Default' },
                        { field: 'createdAt' as const, label: 'Created' },
                      ]).map(col => (
                        <TableHead
                          key={col.label}
                          className={col.field ? "cursor-pointer select-none hover:bg-muted/50 transition-colors" : ""}
                          onClick={col.field ? () => {
                            if (catSortField === col.field) {
                              setCatSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            } else {
                              setCatSortField(col.field!);
                              setCatSortDir('asc');
                            }
                          } : undefined}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {col.field && (
                              catSortField === col.field ? (
                                catSortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                              )
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...categories]
                      .sort((a, b) => {
                        let cmp = 0;
                        if (catSortField === 'name') {
                          cmp = (a.name || '').localeCompare(b.name || '');
                        } else if (catSortField === 'isDefault') {
                          cmp = (a.isDefault ? 1 : 0) - (b.isDefault ? 1 : 0);
                        } else if (catSortField === 'createdAt') {
                          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        }
                        return catSortDir === 'asc' ? cmp : -cmp;
                      })
                      .map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground">
                              {category.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: category.color }} 
                            className="text-white"
                          >
                            {category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {(() => {
                              const iconName = category.icon || 'folder';
                              const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Folder;
                              return <IconComponent className="h-4 w-4 mr-2" />;
                            })()}
                            <span className="text-sm">{category.icon || 'folder'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog('category', category)}
                              data-testid={`button-edit-${category.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category)}
                              data-testid={`button-delete-${category.id}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Intake Form Tab */}
        <TabsContent value="intake-form" className="space-y-6">
          <TaskIntakeFormBuilder />
        </TabsContent>


        {/* Task Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Global Task Settings</h3>
              <p className="text-muted-foreground">
                Configure system-wide task behavior and defaults.
              </p>
            </div>
          </div>

          <TaskMappingSettings />
          <LongRunningTimerSettings />
          <WeeklyHoursAlertSettings />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `Edit Task ${editType === 'status' ? 'Status' : 'Priority'}` 
                : `Create Task ${editType === 'status' ? 'Status' : 'Priority'}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update the task ${editType} details.`
                : `Create a new ${editType} option for tasks.`}
            </DialogDescription>
          </DialogHeader>

          {editType === 'status' && (
            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={statusForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., In Progress"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!editingItem) {
                              statusForm.setValue("value", generateValue(e.target.value));
                            }
                          }}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={statusForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Value (Code)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., in_progress"
                          {...field}
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Used internally in the system. Auto-generated from name if left empty.
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={statusForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-color"
                          />
                          <div className="flex space-x-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  field.value === color.value
                                    ? "border-foreground"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={statusForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of when this status should be used"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={statusForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-sort-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={statusForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Default Status</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-default"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={statusForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStatusMutation.isPending || updateStatusMutation.isPending}
                    data-testid="button-save"
                  >
                    {createStatusMutation.isPending || updateStatusMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {editType === 'priority' && (
            <Form {...priorityForm}>
              <form onSubmit={priorityForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={priorityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., High Priority"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!editingItem) {
                              priorityForm.setValue("value", generateValue(e.target.value));
                            }
                          }}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Value (Code)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., high"
                          {...field}
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Used internally in the system. Auto-generated from name if left empty.
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-color"
                          />
                          <div className="flex space-x-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  field.value === color.value
                                    ? "border-foreground"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <select 
                          {...field}
                          value={field.value || ""}
                          className="w-full p-2 border rounded"
                          data-testid="select-icon"
                        >
                          {iconOptions.map((icon) => (
                            <option key={icon.value} value={icon.value}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of when this priority should be used"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={priorityForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-sort-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={priorityForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Default Priority</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-default"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={priorityForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPriorityMutation.isPending || updatePriorityMutation.isPending}
                    data-testid="button-save"
                  >
                    {createPriorityMutation.isPending || updatePriorityMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {editType === 'category' && (
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Development"
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-color"
                          />
                          <div className="flex space-x-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  field.value === color.value
                                    ? "border-foreground"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Type icon name (e.g., folder, star, tag)"
                          data-testid="picker-icon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this category"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Default Category</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-default"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="workflowId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a workflow for this category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Workflow (Use all statuses)</SelectItem>
                          {workflows.filter(w => w.isActive).map((workflow) => (
                            <SelectItem key={workflow.id} value={workflow.id}>
                              {workflow.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    data-testid="button-save"
                  >
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {editType === 'workflow' && (
            <Form {...workflowForm}>
              <form onSubmit={workflowForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={workflowForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Video Production Workflow"
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workflowForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this workflow and when it should be used"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={workflowForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Default Workflow</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-default"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={workflowForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Status Selection - Available for both create and edit */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Workflow Statuses</Label>
                    <span className="text-xs text-muted-foreground">
                      {newWorkflowStatuses.length} selected
                    </span>
                  </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Available Statuses */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Available Statuses</h5>
                        <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                          {statuses
                            .filter(status => !newWorkflowStatuses.some(ws => ws.statusId === status.id))
                            .map(status => (
                              <div
                                key={status.id}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: status.color }}
                                  />
                                  <span>{status.name}</span>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAddStatusToNewWorkflow(status.id)}
                                  className="h-6 w-6 p-0"
                                  data-testid={`button-add-status-${status.id}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          {statuses.filter(s => !newWorkflowStatuses.some(ws => ws.statusId === s.id)).length === 0 && (
                            <div className="text-xs text-center text-muted-foreground py-4">
                              All statuses added
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Statuses */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Workflow Progression</h5>
                        <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                          {newWorkflowStatuses
                            .sort((a, b) => a.order - b.order)
                            .map((ws, index) => {
                              const status = statuses.find(s => s.id === ws.statusId);
                              return (
                                <div
                                  key={ws.id}
                                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: status?.color }}
                                    />
                                    <span className="text-xs text-muted-foreground">{index + 1}.</span>
                                    <span className="flex-1">{status?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMoveNewWorkflowStatusUp(ws.statusId)}
                                      disabled={index === 0}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-move-up-${ws.statusId}`}
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMoveNewWorkflowStatusDown(ws.statusId)}
                                      disabled={index === newWorkflowStatuses.length - 1}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-move-down-${ws.statusId}`}
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveStatusFromNewWorkflow(ws.statusId)}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-remove-status-${ws.statusId}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          {newWorkflowStatuses.length === 0 && (
                            <div className="text-xs text-center text-muted-foreground py-4">
                              No statuses added yet
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Define which statuses are part of this workflow and their progression order.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
                    data-testid="button-save"
                  >
                    {createWorkflowMutation.isPending || updateWorkflowMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task {
              itemToDelete && 'isSystemStatus' in itemToDelete ? 'Status' : 
              itemToDelete && 'isSystemPriority' in itemToDelete ? 'Priority' : 
              itemToDelete && 'isActive' in itemToDelete ? 'Workflow' : 'Category'
            }</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action will
              deactivate the {
                itemToDelete && 'isSystemStatus' in itemToDelete ? 'status' : 
                itemToDelete && 'isSystemPriority' in itemToDelete ? 'priority' : 
                itemToDelete && 'isActive' in itemToDelete ? 'workflow' : 'category'
              } and it won't be available for new tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteStatusMutation.isPending || deletePriorityMutation.isPending || deleteCategoryMutation.isPending || deleteWorkflowMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteStatusMutation.isPending || deletePriorityMutation.isPending || deleteCategoryMutation.isPending || deleteWorkflowMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Flow Configuration Dialog */}
      <Dialog open={isStatusFlowDialogOpen} onOpenChange={setIsStatusFlowDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Status Flow: {currentWorkflow?.name}</DialogTitle>
            <DialogDescription>
              Define which statuses are part of this workflow and their progression order. Users will see these statuses when creating tasks assigned to team members in departments using this workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Available Statuses */}
            <div className="space-y-4">
              <h4 className="font-medium">Available Statuses</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {statuses
                  .filter(status => !workflowStatuses.some(ws => ws.statusId === status.id))
                  .map(status => (
                    <div
                      key={status.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm">{status.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddStatusToWorkflow(status.id)}
                        data-testid={`add-status-${status.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Workflow Status Flow */}
            <div className="space-y-4">
              <h4 className="font-medium">Workflow Status Flow</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {workflowStatuses.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No statuses added to workflow yet. Add statuses from the left panel.
                  </div>
                ) : (
                  workflowStatuses
                    .sort((a, b) => a.order - b.order)
                    .map((workflowStatus, index) => {
                      const status = statuses.find(s => s.id === workflowStatus.statusId);
                      if (!status) return null;
                      
                      return (
                        <div
                          key={workflowStatus.statusId}
                          className="flex items-center justify-between p-2 border rounded bg-background"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: status.color }}
                            />
                            <span className="text-sm">{status.name}</span>
                            {workflowStatus.isRequired && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatusRequired(workflowStatus.statusId)}
                              data-testid={`toggle-required-${status.id}`}
                              title={workflowStatus.isRequired ? "Mark as Optional" : "Mark as Required"}
                            >
                              {workflowStatus.isRequired ? "★" : "☆"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStatusUp(workflowStatus.statusId)}
                              disabled={index === 0}
                              data-testid={`move-up-${status.id}`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStatusDown(workflowStatus.statusId)}
                              disabled={index === workflowStatuses.length - 1}
                              data-testid={`move-down-${status.id}`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveStatusFromWorkflow(workflowStatus.statusId)}
                              data-testid={`remove-status-${status.id}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusFlowDialogOpen(false)}
              data-testid="button-cancel-status-flow"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkflowStatuses}
              disabled={saveWorkflowStatusesMutation.isPending}
              data-testid="button-save-status-flow"
            >
              {saveWorkflowStatusesMutation.isPending ? "Saving..." : "Save Status Flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}