import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ArrowUpDown, User, FolderOpen, Tag, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssignmentRule {
  id: string;
  formId: string;
  name: string;
  conditions: any;
  assignToRole: string | null;
  assignToStaffId: string | null;
  setCategoryId: string | null;
  setTags: string[] | null;
  priority: number;
  enabled: boolean;
  createdAt: string;
  categoryName: string | null;
  staffName: string | null;
  conditionSummary: string;
}

interface RuleCondition {
  questionId: string;
  operator: string;
  value: string;
}

interface TaskCategory {
  id: string;
  name: string;
}

interface TriggerQuestion {
  id: string;
  questionText: string;
  internalLabel: string;
  options: { id: string; optionText: string }[];
}

interface AssignmentRole {
  roleName: string;
  assignedTo: { id: string; name: string } | null;
}

export function TaskIntakeAssignmentRules() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    priority: 10,
    enabled: true,
    assignToRole: "",
    assignToStaffId: "",
    setCategoryId: "",
    setTags: [] as string[],
    conditions: [] as RuleCondition[],
  });

  const { data: forms = [] } = useQuery<{ id: string; formName: string }[]>({
    queryKey: ["/api/task-intake-forms"],
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery<AssignmentRule[]>({
    queryKey: ["/api/task-intake/assignment-rules"],
  });

  const { data: categories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  const { data: roles = [] } = useQuery<AssignmentRole[]>({
    queryKey: ["/api/assignment-roles"],
  });

  const { data: triggerQuestions = [] } = useQuery<TriggerQuestion[]>({
    queryKey: ["/api/task-intake/questions/triggers"],
  });

  const { data: staff = [] } = useQuery<{ id: string; firstName: string; lastName: string }[]>({
    queryKey: ["/api/staff"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/task-intake/assignment-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-intake/assignment-rules"] });
      toast({ title: "Success", description: "Assignment rule created" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/task-intake/assignment-rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-intake/assignment-rules"] });
      toast({ title: "Success", description: "Assignment rule updated" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/task-intake/assignment-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-intake/assignment-rules"] });
      toast({ title: "Success", description: "Assignment rule deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    setFormData({
      name: "",
      priority: 10,
      enabled: true,
      assignToRole: "",
      assignToStaffId: "",
      setCategoryId: "",
      setTags: [],
      conditions: [],
    });
  };

  const openEditDialog = (rule: AssignmentRule) => {
    setEditingRule(rule);
    const conditions = Array.isArray(rule.conditions) 
      ? rule.conditions 
      : rule.conditions?.conditions || [];
    
    const safeRole = rule.assignToRole && uniqueRoles.includes(rule.assignToRole) ? rule.assignToRole : "";
    const safeStaffId = rule.assignToStaffId && staff.some(s => s.id === rule.assignToStaffId) ? rule.assignToStaffId : "";
    const safeCategoryId = rule.setCategoryId && categories.some(c => c.id === rule.setCategoryId) ? rule.setCategoryId : "";

    setFormData({
      name: rule.name,
      priority: rule.priority,
      enabled: rule.enabled,
      assignToRole: safeRole,
      assignToStaffId: safeStaffId,
      setCategoryId: safeCategoryId,
      setTags: rule.setTags || [],
      conditions: conditions.length > 0 ? conditions : [{ questionId: "", operator: "equals", value: "" }],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      priority: 10,
      enabled: true,
      assignToRole: "",
      assignToStaffId: "",
      setCategoryId: "",
      setTags: [],
      conditions: [{ questionId: "", operator: "equals", value: "" }],
    });
    setIsDialogOpen(true);
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { questionId: "", operator: "equals", value: "" }],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: keyof RuleCondition, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Rule name is required", variant: "destructive" });
      return;
    }

    const activeForm = forms[0];
    if (!activeForm) {
      toast({ title: "Error", description: "No intake form found", variant: "destructive" });
      return;
    }

    const ruleData = {
      formId: activeForm.id,
      name: formData.name,
      priority: formData.priority,
      enabled: formData.enabled,
      assignToRole: formData.assignToRole || null,
      assignToStaffId: formData.assignToStaffId || null,
      setCategoryId: formData.setCategoryId || null,
      setTags: formData.setTags.length > 0 ? formData.setTags : null,
      conditions: formData.conditions.filter(c => c.questionId && c.value),
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: ruleData });
    } else {
      createMutation.mutate(ruleData);
    }
  };

  const getQuestionOptions = (questionId: string) => {
    const question = triggerQuestions.find(q => q.id === questionId);
    return question?.options || [];
  };

  const uniqueRoles = [...new Set(roles.map(r => r.roleName))];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Task Assignment Rules
            </CardTitle>
            <CardDescription>
              Automatically assign tasks to team members based on intake form answers
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rulesLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assignment rules configured</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create rules to automatically assign tasks based on form answers
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Priority</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Assigns To</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-20">Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.priority}</TableCell>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {rule.conditionSummary}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{rule.assignToRole || rule.staffName || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.categoryName ? (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <FolderOpen className="h-3 w-3" />
                        {rule.categoryName}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {rule.enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(rule)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Assignment Rule</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this rule? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmId) {
                    deleteMutation.mutate(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Assignment Rule" : "Create Assignment Rule"}
              </DialogTitle>
              <DialogDescription>
                Configure when and how tasks should be automatically assigned
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Creative Tasks → Creative PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (lower = first)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Rule is active</Label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Conditions (match ALL)</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Select
                      value={condition.questionId}
                      onValueChange={(val) => updateCondition(index, "questionId", val)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select question" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.questionText}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(val) => updateCondition(index, "operator", val)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">not equals</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                      </SelectContent>
                    </Select>

                    {condition.questionId ? (
                      <Select
                        value={condition.value}
                        onValueChange={(val) => updateCondition(index, "value", val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {getQuestionOptions(condition.questionId).map((opt) => (
                            <SelectItem key={opt.id} value={opt.optionText}>
                              {opt.optionText}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="flex-1"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, "value", e.target.value)}
                        placeholder="Enter value"
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                      disabled={formData.conditions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Assignment Actions</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assign To Role
                    </Label>
                    <Select
                      value={formData.assignToRole || "__none__"}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, assignToRole: val === "__none__" ? "" : val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role/position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {uniqueRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Assigns to whoever currently holds this position
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Fallback User
                    </Label>
                    <Select
                      value={formData.assignToStaffId || "__none__"}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, assignToStaffId: val === "__none__" ? "" : val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.firstName} {s.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used if no one has the role assigned
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Set Category
                  </Label>
                  <Select
                    value={formData.setCategoryId || "__none__"}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, setCategoryId: val === "__none__" ? "" : val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
