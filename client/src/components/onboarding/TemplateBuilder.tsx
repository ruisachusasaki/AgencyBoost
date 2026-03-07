import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Loader2, FileText, BookOpen, GraduationCap, AlertTriangle, Settings2, Calendar, Lock, Link as LinkIcon } from "lucide-react";
import TemplateItemForm from "./TemplateItemForm";

interface TemplateItem {
  id: number;
  templateId: number;
  dayNumber: number;
  sortOrder: number;
  title: string;
  description: string | null;
  itemType: string;
  referenceId: string | null;
  resources: Array<{ label: string; url: string }> | null;
  isRequired: boolean;
}

interface Template {
  id: number;
  teamId: string;
  positionName: string;
  totalDays: number;
  dayUnlockMode: string;
  teamName: string | null;
  items: TemplateItem[];
}

interface TemplateBuilderProps {
  templateId: number;
}

export default function TemplateBuilder({ templateId }: TemplateBuilderProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeDay, setActiveDay] = useState(1);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [addItemDay, setAddItemDay] = useState(1);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ positionName: "", totalDays: 10, dayUnlockMode: "calendar" });
  const [dragItem, setDragItem] = useState<TemplateItem | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ["/api/onboarding-templates", templateId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding-templates/${templateId}`, { credentials: "include" });
      return res.json();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; dayNumber: number; sortOrder: number }[]) => {
      await apiRequest("PUT", `/api/onboarding-templates/${templateId}/items/reorder`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates", templateId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/onboarding-templates/${templateId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates", templateId] });
      setDeleteTarget(null);
      toast({ title: "Item deleted" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { positionName: string; totalDays: number; dayUnlockMode: string }) => {
      await apiRequest("PUT", `/api/onboarding-templates/${templateId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates", templateId] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates"] });
      setEditingSettings(false);
      toast({ title: "Template settings updated" });
    },
  });

  const scrollToDay = (day: number) => {
    setActiveDay(day);
    dayRefs.current[day]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDragStart = useCallback((e: React.DragEvent, item: TemplateItem) => {
    setDragItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(item.id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, day: number, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day);
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDragOverDay(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: number, targetIndex: number) => {
    e.preventDefault();
    if (!dragItem || !template) return;

    const allItems = [...template.items];
    const movedItemIndex = allItems.findIndex(i => i.id === dragItem.id);
    if (movedItemIndex === -1) return;

    const [movedItem] = allItems.splice(movedItemIndex, 1);
    const originalDay = movedItem.dayNumber;
    movedItem.dayNumber = targetDay;

    const itemsByDayMap: Record<number, typeof allItems> = {};
    for (const item of allItems) {
      if (!itemsByDayMap[item.dayNumber]) itemsByDayMap[item.dayNumber] = [];
      itemsByDayMap[item.dayNumber].push(item);
    }
    if (!itemsByDayMap[targetDay]) itemsByDayMap[targetDay] = [];
    itemsByDayMap[targetDay].splice(targetIndex, 0, movedItem);

    const reorderData: { id: number; dayNumber: number; sortOrder: number }[] = [];
    for (const [day, items] of Object.entries(itemsByDayMap)) {
      items.forEach((item, idx) => {
        reorderData.push({ id: item.id, dayNumber: parseInt(day), sortOrder: idx });
      });
    }

    reorderMutation.mutate(reorderData);

    setDragItem(null);
    setDragOverDay(null);
    setDragOverIndex(null);
  }, [dragItem, template, reorderMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(179,100%,39%)]" />
      </div>
    );
  }

  if (!template) {
    return <div className="text-center py-12 text-muted-foreground">Template not found</div>;
  }

  const days = Array.from({ length: template.totalDays }, (_, i) => i + 1);
  const itemsByDay = days.reduce<Record<number, TemplateItem[]>>((acc, day) => {
    acc[day] = (template.items || [])
      .filter(i => i.dayNumber === day)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return acc;
  }, {});

  const typeBadgeConfig: Record<string, { label: string; className: string; icon: typeof FileText }> = {
    text: { label: "Text", className: "bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,30%)] border-[hsl(179,100%,39%)]/20", icon: FileText },
    kb_article: { label: "KB Article", className: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: BookOpen },
    training_course: { label: "Training", className: "bg-orange-500/10 text-orange-700 border-orange-500/20", icon: GraduationCap },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings/hr-settings?tab=onboarding-templates")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{template.positionName}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{template.teamName}</span>
            <span>·</span>
            <span>{template.totalDays}-day checklist</span>
            <span>·</span>
            <Badge variant="outline" className="text-xs">
              {template.dayUnlockMode === "calendar" ? (
                <><Calendar className="h-3 w-3 mr-1" />Calendar</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" />Completion-gated</>
              )}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSettingsForm({
              positionName: template.positionName,
              totalDays: template.totalDays,
              dayUnlockMode: template.dayUnlockMode,
            });
            setEditingSettings(true);
          }}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="w-36 shrink-0">
          <div className="sticky top-4 space-y-1">
            {days.map((day) => {
              const count = itemsByDay[day]?.length || 0;
              return (
                <button
                  key={day}
                  onClick={() => scrollToDay(day)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                    activeDay === day
                      ? "bg-[hsl(179,100%,39%)] text-white"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span>Day {day}</span>
                  {count > 0 && (
                    <span className={`text-xs ${activeDay === day ? "text-white/70" : "text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-6 min-w-0">
          {days.map((day) => {
            const dayItems = itemsByDay[day] || [];
            return (
              <div
                key={day}
                ref={(el) => { dayRefs.current[day] = el; }}
                className="scroll-mt-4"
                onDragOver={(e) => {
                  if (dayItems.length === 0) handleDragOver(e, day, 0);
                }}
                onDrop={(e) => {
                  if (dayItems.length === 0) handleDrop(e, day, 0);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Day {day}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[hsl(179,100%,39%)] hover:text-[hsl(179,100%,30%)]"
                    onClick={() => { setAddItemDay(day); setEditingItem(null); setShowItemForm(true); }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {dayItems.length === 0 ? (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground ${
                    dragOverDay === day ? "border-[hsl(179,100%,39%)] bg-[hsl(179,100%,39%)]/5" : "border-muted"
                  }`}>
                    No items for this day
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayItems.map((item, idx) => {
                      const config = typeBadgeConfig[item.itemType] || typeBadgeConfig.text;
                      const Icon = config.icon;
                      const isDragging = dragItem?.id === item.id;
                      const isDropTarget = dragOverDay === day && dragOverIndex === idx;

                      return (
                        <div key={item.id}>
                          {isDropTarget && (
                            <div className="h-1 bg-[hsl(179,100%,39%)] rounded-full mb-2" />
                          )}
                          <Card
                            className={`transition-all ${isDragging ? "opacity-40" : ""}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragOver={(e) => handleDragOver(e, day, idx)}
                            onDrop={(e) => handleDrop(e, day, idx)}
                            onDragEnd={handleDragEnd}
                          >
                            <CardContent className="p-3 flex items-start gap-3">
                              <div className="cursor-grab active:cursor-grabbing text-muted-foreground mt-0.5">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-xs ${config.className}`}>
                                    <Icon className="h-3 w-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                  {!item.isRequired && (
                                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                                  )}
                                  {item.referenceId && item.itemType === "kb_article" && (
                                    <span className="text-xs text-muted-foreground truncate">📄 Article linked</span>
                                  )}
                                  {item.referenceId && item.itemType === "training_course" && (
                                    <span className="text-xs text-muted-foreground truncate">🎓 Course linked</span>
                                  )}
                                </div>
                                <p className="font-medium text-sm">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                )}
                                {Array.isArray(item.resources) && item.resources.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <LinkIcon className="h-3 w-3" />
                                    <span>{item.resources.length} resource{item.resources.length !== 1 ? "s" : ""} attached</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => { setEditingItem(item); setAddItemDay(item.dayNumber); setShowItemForm(true); }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                    {dragOverDay === day && dragOverIndex === dayItems.length && (
                      <div className="h-1 bg-[hsl(179,100%,39%)] rounded-full" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <TemplateItemForm
        open={showItemForm}
        onOpenChange={setShowItemForm}
        templateId={templateId}
        totalDays={template.totalDays}
        editItem={editingItem}
        defaultDay={addItemDay}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.
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

      {editingSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingSettings(false)}>
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Template Settings</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Position Name</label>
                <Input
                  value={settingsForm.positionName}
                  onChange={(e) => setSettingsForm(p => ({ ...p, positionName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Total Days</label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={settingsForm.totalDays}
                  onChange={(e) => setSettingsForm(p => ({ ...p, totalDays: parseInt(e.target.value) || 10 }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Day Unlock Mode</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="unlockMode"
                      checked={settingsForm.dayUnlockMode === "calendar"}
                      onChange={() => setSettingsForm(p => ({ ...p, dayUnlockMode: "calendar" }))}
                    />
                    Calendar-based
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="unlockMode"
                      checked={settingsForm.dayUnlockMode === "completion"}
                      onChange={() => setSettingsForm(p => ({ ...p, dayUnlockMode: "completion" }))}
                    />
                    Completion-gated
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSettings(false)}>Cancel</Button>
              <Button
                className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
                disabled={!settingsForm.positionName.trim() || updateSettingsMutation.isPending}
                onClick={() => updateSettingsMutation.mutate(settingsForm)}
              >
                {updateSettingsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
