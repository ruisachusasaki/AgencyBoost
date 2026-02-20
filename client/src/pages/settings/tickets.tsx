import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Route, ToggleLeft, ToggleRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: string;
  assignToUserId: string | null;
  assignToTeam: string | null;
  autoSetPriority: string | null;
  autoAddTags: string[] | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
}

const defaultRuleForm = {
  name: "",
  description: "",
  isActive: true,
  priority: 0,
  conditionType: "all",
  conditionPriority: "all",
  assignToUserId: "none",
  autoSetPriority: "",
};

export default function TicketsSettingsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<RoutingRule | null>(null);
  const [formData, setFormData] = useState(defaultRuleForm);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery<RoutingRule[]>({
    queryKey: ["/api/ticket-routing-rules"],
  });

  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("POST", "/api/ticket-routing-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ticket-routing-rules"] });
      toast({ title: "Rule created", description: "Routing rule created successfully.", variant: "success" as any });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create rule.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PUT", `/api/ticket-routing-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ticket-routing-rules"] });
      toast({ title: "Rule updated", description: "Routing rule updated successfully.", variant: "success" as any });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update rule.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/ticket-routing-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ticket-routing-rules"] });
      toast({ title: "Rule deleted", description: "Routing rule deleted.", variant: "success" as any });
      setDeletingRule(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete rule.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => apiRequest("PUT", `/api/ticket-routing-rules/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ticket-routing-rules"] });
    },
  });

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingRule(null);
    setFormData(defaultRuleForm);
  };

  const openEditDialog = (rule: RoutingRule) => {
    const conditions = JSON.parse(rule.conditions || "{}");
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      isActive: rule.isActive,
      priority: rule.priority,
      conditionType: conditions.type || "all",
      conditionPriority: conditions.priority || "all",
      assignToUserId: rule.assignToUserId || "none",
      autoSetPriority: rule.autoSetPriority || "",
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Rule name is required.", variant: "destructive" });
      return;
    }

    const conditions: Record<string, string> = {};
    if (formData.conditionType !== "all") conditions.type = formData.conditionType;
    if (formData.conditionPriority !== "all") conditions.priority = formData.conditionPriority;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      isActive: formData.isActive,
      priority: formData.priority,
      conditions: JSON.stringify(conditions),
      assignToUserId: formData.assignToUserId && formData.assignToUserId !== "none" ? formData.assignToUserId : null,
      autoSetPriority: formData.autoSetPriority || null,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getConditionLabel = (rule: RoutingRule) => {
    try {
      const cond = JSON.parse(rule.conditions || "{}");
      const parts: string[] = [];
      if (cond.type) parts.push(`Type: ${cond.type}`);
      if (cond.priority) parts.push(`Priority: ${cond.priority}`);
      return parts.length > 0 ? parts.join(", ") : "All tickets";
    } catch {
      return "All tickets";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ticket Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure ticket routing and management</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Ticket Routing Rules
            </CardTitle>
            <CardDescription>
              Automatically assign tickets to team members based on ticket type and priority. Rules are evaluated in order of priority (lowest number first).
            </CardDescription>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => { setEditingRule(null); setFormData(defaultRuleForm); setShowAddDialog(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Route className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No routing rules</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create routing rules to automatically assign tickets to the right team members.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Active</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Assign To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getConditionLabel(rule)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {rule.assigneeName && rule.assigneeName.trim() !== "" ? rule.assigneeName : rule.assignToTeam || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{rule.priority}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(rule)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeletingRule(rule)}>
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Routing Rule" : "Create Routing Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "Update the routing rule configuration." : "Define conditions and assignment for this routing rule."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name *</Label>
              <Input id="ruleName" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Route bugs to Dev Team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruleDescription">Description</Label>
              <Textarea id="ruleDescription" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe when this rule should apply..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>When Ticket Type Is</Label>
                <Select value={formData.conditionType} onValueChange={(v) => setFormData({ ...formData, conditionType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Type</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>And Priority Is</Label>
                <Select value={formData.conditionPriority} onValueChange={(v) => setFormData({ ...formData, conditionPriority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={formData.assignToUserId} onValueChange={(v) => setFormData({ ...formData, assignToUserId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Assignment</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rulePriority">Rule Priority (Order)</Label>
                <Input
                  id="rulePriority"
                  type="number"
                  min={0}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Lower number = higher priority</p>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className="text-sm text-gray-500">{formData.isActive ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRule} onOpenChange={(open) => { if (!open) setDeletingRule(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routing Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the routing rule "{deletingRule?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (deletingRule) deleteMutation.mutate(deletingRule.id); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}