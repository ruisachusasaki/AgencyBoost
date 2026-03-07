import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Pencil, Trash2, ClipboardList, Calendar, Lock, Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OnboardingTemplate {
  id: number;
  teamId: string;
  positionName: string;
  totalDays: number;
  dayUnlockMode: string;
  teamName: string | null;
  itemCount: number;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
}

export default function OnboardingTemplates() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OnboardingTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    teamId: "",
    positionName: "",
    totalDays: 10,
    dayUnlockMode: "calendar",
  });

  const { data: templates = [], isLoading } = useQuery<OnboardingTemplate[]>({
    queryKey: ["/api/onboarding-templates"],
  });

  const { data: departmentsData = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: positionsData = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: [`/api/departments/${newTemplate.teamId}/positions`],
    enabled: !!newTemplate.teamId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      const res = await apiRequest("POST", "/api/onboarding-templates", data);
      return res.json();
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates"] });
      setShowCreateDialog(false);
      setNewTemplate({ teamId: "", positionName: "", totalDays: 10, dayUnlockMode: "calendar" });
      toast({ title: "Template created" });
      navigate(`/settings/hr/onboarding-templates/${template.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/onboarding-templates/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates"] });
      setDeleteTarget(null);
      toast({ title: "Template deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const grouped = templates.reduce<Record<string, OnboardingTemplate[]>>((acc, t) => {
    const team = t.teamName || "Unassigned";
    if (!acc[team]) acc[team] = [];
    acc[team].push(t);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(179,100%,39%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Templates</h2>
          <p className="text-sm text-muted-foreground">Design checklists for new hire onboarding by position</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No onboarding templates yet</p>
            <p className="text-sm">Create your first template to get started</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([teamName, teamTemplates]) => (
          <div key={teamName} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{teamName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate">{template.positionName}</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.totalDays}-day checklist
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {template.itemCount} items
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {template.dayUnlockMode === "calendar" ? (
                              <><Calendar className="h-3 w-3 mr-1" />Calendar</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" />Completion-gated</>
                            )}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/settings/hr/onboarding-templates/${template.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Onboarding Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={newTemplate.teamId} onValueChange={(v) => setNewTemplate(p => ({ ...p, teamId: v, positionName: "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsData.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Position Name</Label>
              <Select
                value={newTemplate.positionName}
                onValueChange={(v) => setNewTemplate(p => ({ ...p, positionName: v }))}
                disabled={!newTemplate.teamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={newTemplate.teamId ? "Select position" : "Select a department first"} />
                </SelectTrigger>
                <SelectContent>
                  {positionsData.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Total Days</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of Business Days onboarding takes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                min={1}
                max={90}
                value={newTemplate.totalDays}
                onChange={(e) => setNewTemplate(p => ({ ...p, totalDays: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Day Unlock Mode</Label>
              <RadioGroup
                value={newTemplate.dayUnlockMode}
                onValueChange={(v) => setNewTemplate(p => ({ ...p, dayUnlockMode: v }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calendar" id="calendar" />
                  <Label htmlFor="calendar" className="cursor-pointer">Calendar-based</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="completion" id="completion" />
                  <Label htmlFor="completion" className="cursor-pointer">Completion-gated</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
              disabled={!newTemplate.teamId || !newTemplate.positionName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(newTemplate)}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deleteTarget?.positionName}" onboarding template? This will also delete all checklist items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
