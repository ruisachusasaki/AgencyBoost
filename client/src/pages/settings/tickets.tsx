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
import { ArrowLeft, Plus, Edit, Trash2, Route, Copy, ExternalLink, FileText, ChevronUp, ChevronDown, GripVertical, Code, Eye, EyeOff, RefreshCw, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

interface CustomForm {
  id: string;
  name: string;
  description: string | null;
  status: string;
  shortCode: string;
  destination: string;
  destinationConfig: Record<string, any>;
  settings: Record<string, any>;
  styling: Record<string, any>;
  embedApiKey: string | null;
  platformLabel: string | null;
  createdAt: string;
}

interface CustomFormField {
  id: string;
  formId: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean | null;
  options: string[] | null;
  validation: Record<string, any> | null;
  fieldMapping: string | null;
  order: number;
  settings: Record<string, any> | null;
}

interface FieldDraft {
  tempId: string;
  dbId?: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  fieldMapping: string;
}

const defaultRuleForm = {
  name: "",
  description: "",
  isActive: true,
  priority: 0,
  conditionType: "all",
  conditionPriority: "all",
  conditionSource: "all",
  assignToUserId: "none",
  autoSetPriority: "",
};

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

const FIELD_MAPPINGS = [
  { value: "none", label: "Custom Data (no mapping)" },
  { value: "title", label: "Ticket Title" },
  { value: "description", label: "Ticket Description" },
  { value: "type", label: "Ticket Type" },
  { value: "priority", label: "Ticket Priority" },
  { value: "name", label: "Submitter Name" },
  { value: "email", label: "Submitter Email" },
  { value: "loomVideoUrl", label: "Loom Video URL" },
  { value: "screenshots", label: "Screenshot / File Attachment" },
];

export default function TicketsSettingsPage() {
  const [activeTab, setActiveTab] = useState<"routing" | "forms">("routing");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<RoutingRule | null>(null);
  const [formData, setFormData] = useState(defaultRuleForm);

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [deletingForm, setDeletingForm] = useState<CustomForm | null>(null);
  const [showEmbedDialog, setShowEmbedDialog] = useState<CustomForm | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formDefaultType, setFormDefaultType] = useState("bug");
  const [formDefaultPriority, setFormDefaultPriority] = useState("medium");
  const [formFields, setFormFields] = useState<FieldDraft[]>([]);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldDraft, setFieldDraft] = useState<FieldDraft>({
    tempId: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    options: [],
    fieldMapping: "none",
  });
  const [optionInput, setOptionInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery<RoutingRule[]>({
    queryKey: ["/api/ticket-routing-rules"],
  });

  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: allCustomForms = [] } = useQuery<CustomForm[]>({
    queryKey: ["/api/custom-forms"],
  });

  const ticketForms = allCustomForms.filter((f) => f.destination === "ticket");

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("POST", "/api/ticket-routing-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ticket-routing-rules"] });
      toast({ title: "Rule created", description: "Routing rule created successfully.", variant: "default" as any });
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
      toast({ title: "Rule updated", description: "Routing rule updated successfully.", variant: "default" as any });
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
      toast({ title: "Rule deleted", description: "Routing rule deleted.", variant: "default" as any });
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

  const createFormMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const resp = await apiRequest("POST", "/api/custom-forms", data);
      return resp.json();
    },
    onSuccess: async (created: CustomForm) => {
      try {
        if (formFields.length > 0) {
          const fieldsPayload = formFields.map((f, idx) => ({
            type: f.type,
            label: f.label,
            placeholder: f.placeholder || null,
            required: f.required,
            options: f.options.length > 0 ? f.options : null,
            fieldMapping: f.fieldMapping !== "none" ? f.fieldMapping : null,
            order: idx,
          }));
          await apiRequest("POST", `/api/custom-forms/${created.id}/fields`, { fields: fieldsPayload });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
        toast({ title: "Form created", description: "Ticket intake form created successfully." });
        closeFormDialog();
      } catch (err: any) {
        queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
        toast({ title: "Form created with errors", description: err?.message || "Form was created but fields could not be saved. Please edit the form to add fields.", variant: "destructive" });
        closeFormDialog();
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create form.", variant: "destructive" });
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      await apiRequest("PUT", `/api/custom-forms/${id}`, data);
      return id;
    },
    onSuccess: async (id: string) => {
      try {
        const fieldsPayload = formFields.map((f, idx) => ({
          ...(f.dbId ? { id: f.dbId } : {}),
          type: f.type,
          label: f.label,
          placeholder: f.placeholder || null,
          required: f.required,
          options: f.options.length > 0 ? f.options : null,
          fieldMapping: f.fieldMapping !== "none" ? f.fieldMapping : null,
          order: idx,
        }));
        await apiRequest("POST", `/api/custom-forms/${id}/fields`, { fields: fieldsPayload });
        queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
        toast({ title: "Form updated", description: "Ticket intake form updated successfully." });
        closeFormDialog();
      } catch (err: any) {
        queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
        toast({ title: "Error saving fields", description: err?.message || "Form was updated but fields could not be saved.", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update form.", variant: "destructive" });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/custom-forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
      toast({ title: "Form deleted", description: "Ticket intake form deleted." });
      setDeletingForm(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete form.", variant: "destructive" });
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const resp = await apiRequest("POST", `/api/custom-forms/${id}/regenerate-key`);
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
      toast({ title: "API key regenerated", description: "The embed API key has been regenerated." });
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
      conditionSource: conditions.source || "all",
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
    if (formData.conditionSource !== "all") conditions.source = formData.conditionSource;

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
      if (cond.source) parts.push(`Source: ${cond.source}`);
      return parts.length > 0 ? parts.join(", ") : "All tickets";
    } catch {
      return "All tickets";
    }
  };

  const closeFormDialog = () => {
    setShowFormDialog(false);
    setEditingForm(null);
    setFormName("");
    setFormDescription("");
    setFormStatus("draft");
    setFormDefaultType("bug");
    setFormDefaultPriority("medium");
    setFormFields([]);
    setEditingFieldIndex(null);
    resetFieldDraft();
  };

  const resetFieldDraft = () => {
    setFieldDraft({
      tempId: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
      fieldMapping: "none",
    });
    setOptionInput("");
  };

  const openEditForm = async (form: CustomForm) => {
    setEditingForm(form);
    setFormName(form.name);
    setFormDescription(form.description || "");
    setFormStatus(form.status);
    const config = form.destinationConfig || {};
    setFormDefaultType(config.defaultType || "bug");
    setFormDefaultPriority(config.defaultPriority || "medium");

    try {
      const resp = await fetch(`/api/custom-forms/${form.id}`);
      const data = await resp.json();
      if (data.fields) {
        setFormFields(
          data.fields.map((f: CustomFormField) => ({
            tempId: f.id,
            dbId: f.id,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder || "",
            required: !!f.required,
            options: f.options || [],
            fieldMapping: f.fieldMapping || "none",
          }))
        );
      }
    } catch {
      setFormFields([]);
    }

    setShowFormDialog(true);
  };

  const handleDuplicateForm = async (form: CustomForm) => {
    setEditingForm(null);
    setFormName(`${form.name} (Copy)`);
    setFormDescription(form.description || "");
    setFormStatus("draft");
    const config = form.destinationConfig || {};
    setFormDefaultType(config.defaultType || "bug");
    setFormDefaultPriority(config.defaultPriority || "medium");

    try {
      const resp = await fetch(`/api/custom-forms/${form.id}`);
      const data = await resp.json();
      if (data.fields) {
        setFormFields(
          data.fields.map((f: CustomFormField) => ({
            tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder || "",
            required: !!f.required,
            options: f.options || [],
            fieldMapping: f.fieldMapping || "none",
          }))
        );
      }
    } catch {
      setFormFields([]);
      toast({
        title: "Warning",
        description: "Could not load form fields. The duplicate will start without fields.",
        variant: "destructive",
      });
    }

    setShowFormDialog(true);
    toast({
      title: "Duplicating Form",
      description: `Creating a copy of "${form.name}". Make any changes and save.`,
    });
  };

  const addField = () => {
    if (!fieldDraft.label.trim()) {
      toast({ title: "Validation Error", description: "Field label is required.", variant: "destructive" });
      return;
    }
    if (editingFieldIndex !== null) {
      setFormFields((prev) => prev.map((f, i) => (i === editingFieldIndex ? { ...fieldDraft, tempId: f.tempId } : f)));
      setEditingFieldIndex(null);
    } else {
      setFormFields((prev) => [...prev, { ...fieldDraft, tempId: `temp_${Date.now()}` }]);
    }
    resetFieldDraft();
  };

  const editField = (index: number) => {
    setEditingFieldIndex(index);
    setFieldDraft({ ...formFields[index] });
    setOptionInput("");
  };

  const removeField = (index: number) => {
    setFormFields((prev) => prev.filter((_, i) => i !== index));
    if (editingFieldIndex === index) {
      setEditingFieldIndex(null);
      resetFieldDraft();
    }
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...formFields];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    setFormFields(newFields);
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    setFieldDraft((prev) => ({ ...prev, options: [...prev.options, optionInput.trim()] }));
    setOptionInput("");
  };

  const removeOption = (idx: number) => {
    setFieldDraft((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  const handleFormSubmit = () => {
    if (!formName.trim()) {
      toast({ title: "Validation Error", description: "Form name is required.", variant: "destructive" });
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      status: formStatus,
      destination: "ticket",
      destinationConfig: {
        defaultType: formDefaultType,
        defaultPriority: formDefaultPriority,
      },
      platformLabel: formName.trim(),
    };

    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.id, data: payload });
    } else {
      createFormMutation.mutate(payload);
    }
  };

  const getEmbedUrl = (form: CustomForm) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/ticket-form/${form.shortCode}`;
  };

  const getIframeCode = (form: CustomForm) => {
    const url = getEmbedUrl(form);
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const sourceOptions = [
    { value: "AgencyBoost", label: "AgencyBoost (Internal)" },
    ...ticketForms.map((f) => ({ value: f.name, label: f.name })),
  ];

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure ticket routing and intake forms</p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "routing" as const, name: "Routing Rules", icon: Route, count: rules.length },
            { id: "forms" as const, name: "Forms", icon: FileText, count: ticketForms.length },
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
              >
                <Icon className="w-4 h-4" />
                {tab.name}
                <Badge variant="secondary" className="ml-1 text-xs">{tab.count}</Badge>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "routing" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Ticket Routing Rules
              </CardTitle>
              <CardDescription>
                Automatically assign tickets to team members based on ticket type, priority, and source. Rules are evaluated in order of priority (lowest number first).
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
      )}

      {activeTab === "forms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ticket Intake Forms</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create embeddable forms that generate tickets when submitted externally.</p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => { closeFormDialog(); setShowFormDialog(true); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Form
            </Button>
          </div>

          {ticketForms.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No intake forms</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create an embeddable form to accept ticket submissions from external tools.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {ticketForms.map((form) => (
                <Card key={form.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{form.name}</h3>
                          {form.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{form.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={form.status === "published" ? "default" : "secondary"} className="text-xs">
                              {form.status === "published" ? "Published" : "Draft"}
                            </Badge>
                            <span className="text-xs text-gray-400">Code: {form.shortCode}</span>
                            <span className="text-xs text-gray-400">Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => setShowEmbedDialog(form)} title="Get Embed Code">
                          <Code className="w-4 h-4 mr-1" />
                          Embed
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(form)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateForm(form)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeletingForm(form)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Routing Rule Dialog */}
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
              <Label>And Source Is</Label>
              <Select value={formData.conditionSource} onValueChange={(v) => setFormData({ ...formData, conditionSource: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Source</SelectItem>
                  {sourceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Delete Rule Dialog */}
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

      {/* Form Builder Dialog */}
      <Dialog open={showFormDialog} onOpenChange={(open) => { if (!open) closeFormDialog(); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? "Edit Intake Form" : "Create Intake Form"}</DialogTitle>
            <DialogDescription>
              {editingForm ? "Update your ticket intake form configuration and fields." : "Build a ticket intake form that can be embedded on external tools."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formName">Form Name *</Label>
                <Input id="formName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., EventGrowth App" />
                <p className="text-xs text-gray-500 dark:text-gray-400">This name becomes the ticket source label.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formDesc">Description</Label>
                <Textarea id="formDesc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe this form..." rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Type</Label>
                  <Select value={formDefaultType} onValueChange={setFormDefaultType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Priority</Label>
                  <Select value={formDefaultPriority} onValueChange={setFormDefaultPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Form Fields</h3>

              {formFields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formFields.map((field, idx) => (
                    <div key={field.tempId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveField(idx, "up")} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => moveField(idx, "down")} disabled={idx === formFields.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{field.label}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}</Badge>
                          {field.required && <Badge variant="secondary" className="text-[10px] shrink-0">Required</Badge>}
                          {field.fieldMapping && field.fieldMapping !== "none" && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">→ {FIELD_MAPPINGS.find((m) => m.value === field.fieldMapping)?.label}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editField(idx)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => removeField(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {editingFieldIndex !== null ? "Edit Field" : "Add Field"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Field Type</Label>
                    <Select value={fieldDraft.type} onValueChange={(v) => setFieldDraft({ ...fieldDraft, type: v })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label *</Label>
                    <Input className="h-9" value={fieldDraft.label} onChange={(e) => setFieldDraft({ ...fieldDraft, label: e.target.value })} placeholder="e.g., What happened?" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Placeholder</Label>
                    <Input className="h-9" value={fieldDraft.placeholder} onChange={(e) => setFieldDraft({ ...fieldDraft, placeholder: e.target.value })} placeholder="Hint text..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Maps To</Label>
                    <Select value={fieldDraft.fieldMapping} onValueChange={(v) => setFieldDraft({ ...fieldDraft, fieldMapping: v })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_MAPPINGS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(fieldDraft.type === "select") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Options</Label>
                    <div className="flex gap-2">
                      <Input className="h-9" value={optionInput} onChange={(e) => setOptionInput(e.target.value)} placeholder="Add option..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }} />
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>Add</Button>
                    </div>
                    {fieldDraft.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {fieldDraft.options.map((opt, i) => (
                          <Badge key={i} variant="secondary" className="text-xs gap-1">
                            {opt}
                            <button type="button" onClick={() => removeOption(i)} className="ml-0.5 hover:text-red-500">&times;</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={fieldDraft.required} onCheckedChange={(c) => setFieldDraft({ ...fieldDraft, required: c })} />
                    <Label className="text-xs">Required</Label>
                  </div>
                  <div className="flex gap-2">
                    {editingFieldIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => { setEditingFieldIndex(null); resetFieldDraft(); }}>Cancel</Button>
                    )}
                    <Button type="button" size="sm" onClick={addField} className="bg-primary hover:bg-primary/90 text-white">
                      {editingFieldIndex !== null ? "Update Field" : "Add Field"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFormDialog}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleFormSubmit}
              disabled={createFormMutation.isPending || updateFormMutation.isPending}
            >
              {(createFormMutation.isPending || updateFormMutation.isPending) ? "Saving..." : editingForm ? "Update Form" : "Create Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Form Dialog */}
      <AlertDialog open={!!deletingForm} onOpenChange={(open) => { if (!open) setDeletingForm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Intake Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the form "{deletingForm?.name}"? All submissions and fields will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (deletingForm) deleteFormMutation.mutate(deletingForm.id); }}
              disabled={deleteFormMutation.isPending}
            >
              {deleteFormMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embed Code Dialog */}
      <Dialog open={!!showEmbedDialog} onOpenChange={(open) => { if (!open) setShowEmbedDialog(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Embed Code — {showEmbedDialog?.name}</DialogTitle>
            <DialogDescription>
              Use these snippets to embed this form on your website or share it via a direct link.
            </DialogDescription>
          </DialogHeader>
          {showEmbedDialog && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Direct Link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={getEmbedUrl(showEmbedDialog)} className="text-xs font-mono" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(getEmbedUrl(showEmbedDialog), "Direct link")} title="Copy Link">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={getEmbedUrl(showEmbedDialog)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" title="Open in New Tab">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Iframe Embed Code</Label>
                <div className="relative">
                  <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono whitespace-pre-wrap break-all border">
                    {getIframeCode(showEmbedDialog)}
                  </pre>
                  <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(getIframeCode(showEmbedDialog), "Iframe code")}>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">API Key</Label>
                  <Button variant="ghost" size="sm" onClick={() => regenerateKeyMutation.mutate(showEmbedDialog.id)} disabled={regenerateKeyMutation.isPending}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={showEmbedDialog.embedApiKey || "N/A"} className="text-xs font-mono" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(showEmbedDialog.embedApiKey || "", "API key")} title="Copy API Key">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {showEmbedDialog.status !== "published" && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This form is currently in <strong>Draft</strong> mode. It must be set to <strong>Published</strong> before external users can submit it.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
