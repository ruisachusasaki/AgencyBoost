import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/rich-text-editor";
import PlaceholderToolbar from "./PlaceholderToolbar";
import { ArrowLeft, Save, Eye, Loader2, Zap } from "lucide-react";
import { Link } from "wouter";

const SAMPLE_VALUES: Record<string, string> = {
  "{{candidate_name}}": "Alex Johnson",
  "{{position}}": "Account Manager",
  "{{start_date}}": new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  "{{compensation}}": "$5,000",
  "{{compensation_type}}": "per month",
  "{{offer_date}}": new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  "{{custom_terms}}": "Standard contractor terms apply.",
  "{{manager_name}}": "",
  "{{company_name}}": "The Media Optimizers",
};

export default function ICAgreementEditor() {
  const [, matchNew] = useRoute("/settings/hr/ic-agreement/new");
  const [, matchEdit] = useRoute("/settings/hr/ic-agreement/:id");
  const templateId = matchEdit?.id;
  const isNew = !!matchNew;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<"activate" | null>(null);
  const editorRef = useRef<RichTextEditorHandle | null>(null);

  const currentUserQuery = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const templateQuery = useQuery<any>({
    queryKey: [`/api/ic-agreement-templates/${templateId}`],
    enabled: !!templateId && !isNew,
  });

  const activeTemplateQuery = useQuery<any>({
    queryKey: ["/api/ic-agreement-templates/active"],
  });

  useEffect(() => {
    if (templateQuery.data && !isNew) {
      setName(templateQuery.data.name || "");
      setContent(templateQuery.data.content || "");
      setIsActive(!!templateQuery.data.isActive);
    }
  }, [templateQuery.data, isNew]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["/api/ic-agreement-templates"] });
    qc.invalidateQueries({ queryKey: ["/api/ic-agreement-templates/active"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/ic-agreement-templates", data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Template saved successfully" });
      navigate("/settings/hr-settings?tab=ic-agreement");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to save template" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/ic-agreement-templates/${templateId}`, data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Template saved successfully" });
      navigate("/settings/hr-settings?tab=ic-agreement");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update template" });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = (forceActivate: boolean) => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Template name is required" });
      return;
    }
    if (!content.trim()) {
      toast({ variant: "destructive", title: "Template content is required" });
      return;
    }

    const shouldActivate = forceActivate || isActive;

    if (shouldActivate && activeTemplateQuery.data?.template && activeTemplateQuery.data.template.id !== Number(templateId)) {
      setPendingAction("activate");
      setShowActivateConfirm(true);
      return;
    }

    doSave(shouldActivate);
  };

  const doSave = (activate: boolean) => {
    const payload = { name: name.trim(), content, isActive: activate };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(placeholder);
    }
  };

  const previewContent = useMemo(() => {
    if (!content) return "";
    let result = content;
    const managerName = currentUserQuery.data?.firstName && currentUserQuery.data?.lastName
      ? `${currentUserQuery.data.firstName} ${currentUserQuery.data.lastName}`
      : currentUserQuery.data?.fullName || "Jane Smith";
    const values = { ...SAMPLE_VALUES, "{{manager_name}}": managerName };
    for (const [key, val] of Object.entries(values)) {
      result = result.replaceAll(key, `<span style="background-color: hsl(179, 100%, 90%); padding: 1px 4px; border-radius: 3px; font-weight: 500;">${val}</span>`);
    }
    return result;
  }, [content, currentUserQuery.data]);

  const isCurrentlyActive = !isNew && templateQuery.data?.isActive;

  if (!isNew && templateQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isNew ? "Create IC Agreement Template" : "Edit IC Agreement Template"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build your Independent Contractor Agreement with dynamic placeholders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <Label htmlFor="template-name" className="text-sm font-medium">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard IC Agreement 2026"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Agreement Content</Label>
              <div className="border rounded-lg overflow-hidden">
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your IC Agreement template..."
                  editorRef={editorRef}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[hsl(179,100%,39%)]" />
                  Dynamic Fields
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlaceholderToolbar onInsert={handleInsertPlaceholder} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Template Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isCurrentlyActive}
                    className="mt-0.5"
                  />
                  <div>
                    <Label className="text-sm font-medium">Make this the active template</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Only one template can be active at a time. Setting this as active will deactivate the current active template.
                    </p>
                    {isCurrentlyActive && (
                      <p className="text-xs text-[hsl(179,100%,39%)] mt-1 font-medium">
                        This is the currently active template
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t mt-6 -mx-6 px-6 py-4 flex items-center justify-between">
          <Link href="/settings/hr-settings?tab=ic-agreement">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Templates
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!content.trim()}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>

            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save & Activate
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agreement Preview — Sample Data</DialogTitle>
            <DialogDescription>
              This is a preview using sample data. Actual values will be filled in when an offer is sent.
            </DialogDescription>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none dark:prose-invert mt-4 p-6 border rounded-lg bg-white dark:bg-gray-950"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Active Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace "{activeTemplateQuery.data?.template?.name}" as the active template. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowActivateConfirm(false);
                setPendingAction(null);
                doSave(true);
              }}
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
