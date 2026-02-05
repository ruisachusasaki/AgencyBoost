import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, Edit, Trash2, GripVertical, Settings2, ChevronDown, ChevronRight,
  FolderOpen, Folder, Star, Type, Hash, Calendar, Circle, CheckCircle2,
  Building2, Users, Upload, AlertCircle, Link, AlertTriangle
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper to extract template variables from a description template
const extractTemplateVariables = (template: string | undefined | null): string[] => {
  if (!template) return [];
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  // Extract unique variable names, removing the {{ and }}
  const variables = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  return variables.sort();
};

// Helper to normalize internal labels (remove TRIGGER prefix)
const normalizeLabel = (label: string | undefined): string | undefined => {
  if (!label) return undefined;
  return label.replace(/^TRIGGER\s*-\s*/i, '').trim();
};

// Helper to check for template/question mismatches
const getTemplateMismatch = (
  template: string | undefined | null,
  questions: { internalLabel?: string }[]
): { missingQuestions: string[]; unusedLabels: string[] } => {
  const templateVars = extractTemplateVariables(template);
  const questionLabels = questions
    .map(q => normalizeLabel(q.internalLabel))
    .filter((label): label is string => !!label);
  
  // Template variables that don't have matching questions
  const missingQuestions = templateVars.filter(v => !questionLabels.includes(v));
  
  // Question labels that aren't in the template
  const unusedLabels = questionLabels.filter(l => !templateVars.includes(l));
  
  return { missingQuestions, unusedLabels };
};

type TaskIntakeOption = {
  id: string;
  questionId: string;
  optionText: string;
  order: number;
};

type TaskIntakeQuestion = {
  id: string;
  formId: string;
  sectionId: string;
  questionText: string;
  questionType: string;
  helpText?: string;
  internalLabel?: string;
  isRequired: boolean;
  order: number;
  settings?: any;
  options?: TaskIntakeOption[];
};

type VisibilityCondition = {
  questionId: string;
  operator: string;
  value: string;
};

type VisibilityConditions = {
  operator: "AND" | "OR";
  conditions: VisibilityCondition[];
} | null;

type TaskIntakeSection = {
  id: string;
  formId: string;
  sectionName: string;
  internalLabel?: string;
  orderIndex: number;
  visibilityConditions: VisibilityConditions;
  descriptionTemplate?: string;
  isActive: boolean;
  questionCount: number;
  visibilitySummary: string;
};

type TriggerQuestion = {
  id: string;
  internalLabel: string;
  questionText: string;
  questionType: string;
  options?: TaskIntakeOption[];
};

const questionTypeIcons: Record<string, any> = {
  single_choice: Circle,
  multi_choice: CheckCircle2,
  multiple_choice: CheckCircle2,
  text: Type,
  textarea: Type,
  number: Hash,
  date: Calendar,
  file: Upload,
  client: Building2,
  department: Users,
  url: Link,
};

interface IntakeSectionBuilderProps {
  formId: string;
  onOpenQuestionDialog: (question?: TaskIntakeQuestion, sectionId?: string) => void;
}

export function IntakeSectionBuilder({ formId, onOpenQuestionDialog }: IntakeSectionBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TaskIntakeSection | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  
  const [sectionFormData, setSectionFormData] = useState({
    sectionName: "",
    internalLabel: "",
    isActive: true,
  });
  
  const [visibilityFormData, setVisibilityFormData] = useState<{
    mode: "always" | "conditional";
    operator: "AND" | "OR";
    conditions: VisibilityCondition[];
  }>({
    mode: "always",
    operator: "AND",
    conditions: [],
  });

  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const { data: sections, isLoading: sectionsLoading } = useQuery<TaskIntakeSection[]>({
    queryKey: ["/api/task-intake/sections"],
  });

  const { data: triggerQuestions } = useQuery<TriggerQuestion[]>({
    queryKey: ["/api/task-intake/questions/triggers"],
  });

  const invalidateSections = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/task-intake/sections"] });
    queryClient.invalidateQueries({ queryKey: ["/api/task-intake/questions/triggers"] });
    expandedSections.forEach(sectionId => {
      queryClient.invalidateQueries({ queryKey: [`/api/task-intake-sections/${sectionId}/questions`] });
    });
  }, [queryClient, expandedSections]);

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/task-intake-sections/${sectionId}`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateSections();
      setIsSectionModalOpen(false);
      setEditingSection(null);
      toast({ title: "Success", description: "Section updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update section", variant: "destructive" });
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ sectionId, visibilityConditions }: { sectionId: string; visibilityConditions: VisibilityConditions }) => {
      const response = await apiRequest("PUT", `/api/task-intake-sections/${sectionId}`, { visibilityConditions });
      return response.json();
    },
    onSuccess: () => {
      invalidateSections();
      setIsVisibilityModalOpen(false);
      setEditingSection(null);
      setVisibilityError(null);
      toast({ title: "Success", description: "Visibility conditions updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sectionIds: string[]) => {
      const sections = sectionIds.map((id, index) => ({ id, orderIndex: index }));
      const response = await apiRequest("PUT", `/api/task-intake-forms/${formId}/sections/reorder`, { sections });
      return response.json();
    },
    onSuccess: () => {
      invalidateSections();
    },
  });

  const reorderQuestionsMutation = useMutation({
    mutationFn: async ({ sectionId, questionIds }: { sectionId: string; questionIds: string[] }) => {
      const response = await apiRequest("PUT", `/api/task-intake-forms/${formId}/questions/reorder`, { 
        questionIds,
        sectionId 
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/task-intake-sections/${variables.sectionId}/questions`] });
      invalidateSections();
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiRequest("DELETE", `/api/task-intake-questions/${questionId}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateSections();
      setDeleteQuestionId(null);
      toast({ title: "Success", description: "Question deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: async (data: { sectionName: string; internalLabel?: string }) => {
      const response = await apiRequest("POST", `/api/task-intake-forms/${formId}/sections`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateSections();
      setIsSectionModalOpen(false);
      toast({ title: "Success", description: "Section created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create section", variant: "destructive" });
    },
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const openSectionModal = (section?: TaskIntakeSection) => {
    if (section) {
      setEditingSection(section);
      setSectionFormData({
        sectionName: section.sectionName,
        internalLabel: section.internalLabel || "",
        isActive: section.isActive,
      });
    } else {
      setEditingSection(null);
      setSectionFormData({
        sectionName: "",
        internalLabel: "",
        isActive: true,
      });
    }
    setIsSectionModalOpen(true);
  };

  const openVisibilityModal = (section: TaskIntakeSection) => {
    setEditingSection(section);
    setVisibilityError(null);
    
    if (section.visibilityConditions) {
      setVisibilityFormData({
        mode: "conditional",
        operator: section.visibilityConditions.operator,
        conditions: section.visibilityConditions.conditions || [],
      });
    } else {
      setVisibilityFormData({
        mode: "always",
        operator: "AND",
        conditions: [],
      });
    }
    
    setIsVisibilityModalOpen(true);
  };

  const handleSaveSection = () => {
    if (!sectionFormData.sectionName.trim()) {
      toast({ title: "Error", description: "Section name is required", variant: "destructive" });
      return;
    }

    if (editingSection) {
      updateSectionMutation.mutate({
        sectionId: editingSection.id,
        data: sectionFormData,
      });
    } else {
      createSectionMutation.mutate({
        sectionName: sectionFormData.sectionName,
        internalLabel: sectionFormData.internalLabel || undefined,
      });
    }
  };

  const handleSaveVisibility = () => {
    if (!editingSection) return;

    setVisibilityError(null);

    if (visibilityFormData.mode === "conditional") {
      const validConditions = visibilityFormData.conditions.filter(c => c.questionId && c.value);
      
      if (validConditions.length === 0) {
        setVisibilityError("Please add at least one complete condition (trigger question and value)");
        return;
      }

      const incompleteConditions = visibilityFormData.conditions.filter(
        c => (c.questionId && !c.value) || (!c.questionId && c.value)
      );

      if (incompleteConditions.length > 0) {
        setVisibilityError("Some conditions are incomplete. Please select both a trigger question and a value for each condition.");
        return;
      }

      updateVisibilityMutation.mutate({
        sectionId: editingSection.id,
        visibilityConditions: {
          operator: visibilityFormData.operator,
          conditions: validConditions,
        },
      });
    } else {
      updateVisibilityMutation.mutate({
        sectionId: editingSection.id,
        visibilityConditions: null,
      });
    }
  };

  const addVisibilityCondition = () => {
    setVisibilityFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { questionId: "", operator: "equals", value: "" }],
    }));
  };

  const removeVisibilityCondition = (index: number) => {
    setVisibilityFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateVisibilityCondition = (index: number, field: keyof VisibilityCondition, value: string) => {
    setVisibilityFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "SECTION") {
      if (!sections) return;
      const items = Array.from(sections);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      reorderSectionsMutation.mutate(items.map(s => s.id));
    } else if (type === "QUESTION") {
      if (source.droppableId !== destination.droppableId) {
        toast({
          title: "Cannot move question",
          description: "Questions can only be reordered within their section",
          variant: "destructive",
        });
        return;
      }
      
      const sectionId = source.droppableId.replace('questions-', '');
      queryClient.setQueryData<TaskIntakeQuestion[]>(
        [`/api/task-intake-sections/${sectionId}/questions`],
        (oldData) => {
          if (!oldData) return oldData;
          const items = Array.from(oldData);
          const [reorderedItem] = items.splice(source.index, 1);
          items.splice(destination.index, 0, reorderedItem);
          return items;
        }
      );
      
      const questionsData = queryClient.getQueryData<TaskIntakeQuestion[]>([`/api/task-intake-sections/${sectionId}/questions`]);
      if (questionsData) {
        reorderQuestionsMutation.mutate({ 
          sectionId, 
          questionIds: questionsData.map(q => q.id) 
        });
      }
    }
  };

  const getSelectedTriggerOptions = (questionId: string): TaskIntakeOption[] => {
    const trigger = triggerQuestions?.find(t => t.id === questionId);
    return trigger?.options || [];
  };

  if (sectionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Section-Based Builder</h3>
          <p className="text-sm text-muted-foreground">
            Organize questions into sections with conditional visibility
          </p>
        </div>
        <Button size="sm" onClick={() => openSectionModal()}>
          <Plus className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {!sections || sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sections yet. Add your first section to organize questions.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg ${snapshot.isDragging ? "bg-accent" : "bg-muted/30"}`}
                          >
                            <SectionRow
                              section={section}
                              isExpanded={expandedSections.has(section.id)}
                              onToggle={() => toggleSection(section.id)}
                              onEdit={() => openSectionModal(section)}
                              onEditVisibility={() => openVisibilityModal(section)}
                              dragHandleProps={provided.dragHandleProps}
                              onEditQuestion={(q) => onOpenQuestionDialog(q, section.id)}
                              onDeleteQuestion={(id) => setDeleteQuestionId(id)}
                              onAddQuestion={() => onOpenQuestionDialog(undefined, section.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
            <DialogDescription>
              {editingSection ? "Update the section details" : "Create a new section to organize questions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                value={sectionFormData.sectionName}
                onChange={(e) => setSectionFormData(prev => ({ ...prev, sectionName: e.target.value }))}
                placeholder="e.g., Creative Type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalLabel">Internal Label (optional)</Label>
              <Input
                id="internalLabel"
                value={sectionFormData.internalLabel}
                onChange={(e) => setSectionFormData(prev => ({ ...prev, internalLabel: e.target.value }))}
                placeholder="For admin notes"
              />
            </div>
            {editingSection && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={sectionFormData.isActive}
                  onCheckedChange={(checked) => setSectionFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSection}
              disabled={updateSectionMutation.isPending || createSectionMutation.isPending}
            >
              {editingSection ? "Save Changes" : "Create Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVisibilityModalOpen} onOpenChange={setIsVisibilityModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visibility Conditions</DialogTitle>
            <DialogDescription>
              Configure when "{editingSection?.sectionName}" section should be shown
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {visibilityError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{visibilityError}</AlertDescription>
              </Alert>
            )}
            
            <RadioGroup
              value={visibilityFormData.mode}
              onValueChange={(value) => {
                setVisibilityFormData(prev => ({ 
                  ...prev, 
                  mode: value as "always" | "conditional" 
                }));
                setVisibilityError(null);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="always" id="always" />
                <Label htmlFor="always">Always visible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conditional" id="conditional" />
                <Label htmlFor="conditional">Show when conditions are met</Label>
              </div>
            </RadioGroup>

            {visibilityFormData.mode === "conditional" && (
              <div className="space-y-4 pl-6 border-l-2 border-muted ml-2">
                <div className="flex items-center gap-2">
                  <Label>Match:</Label>
                  <Select
                    value={visibilityFormData.operator}
                    onValueChange={(value) => setVisibilityFormData(prev => ({ 
                      ...prev, 
                      operator: value as "AND" | "OR" 
                    }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">ALL conditions (AND)</SelectItem>
                      <SelectItem value="OR">ANY condition (OR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {visibilityFormData.conditions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No conditions added. Add at least one condition to use conditional visibility.
                    </p>
                  )}
                  {visibilityFormData.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Select
                        value={condition.questionId}
                        onValueChange={(value) => {
                          updateVisibilityCondition(index, "questionId", value);
                          updateVisibilityCondition(index, "value", "");
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select trigger question" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerQuestions?.map(tq => (
                            <SelectItem key={tq.id} value={tq.id}>
                              <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {tq.internalLabel?.replace('TRIGGER - ', '') || tq.questionText}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-muted-foreground">=</span>

                      <Select
                        value={condition.value}
                        onValueChange={(value) => updateVisibilityCondition(index, "value", value)}
                        disabled={!condition.questionId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectedTriggerOptions(condition.questionId).map(opt => (
                            <SelectItem key={opt.id} value={opt.optionText}>
                              {opt.optionText}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVisibilityCondition(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVisibilityCondition}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Condition
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVisibilityModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveVisibility}
              disabled={updateVisibilityMutation.isPending}
            >
              Save Conditions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuestionId && deleteQuestionMutation.mutate(deleteQuestionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SectionRowProps {
  section: TaskIntakeSection;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEditVisibility: () => void;
  dragHandleProps: any;
  onEditQuestion: (question: TaskIntakeQuestion) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
}

function SectionRow({
  section,
  isExpanded,
  onToggle,
  onEdit,
  onEditVisibility,
  dragHandleProps,
  onEditQuestion,
  onDeleteQuestion,
  onAddQuestion,
}: SectionRowProps) {
  const { data: questions, isLoading } = useQuery<TaskIntakeQuestion[]>({
    queryKey: [`/api/task-intake-sections/${section.id}/questions`],
    enabled: isExpanded,
  });

  const isTriggerQuestion = (q: TaskIntakeQuestion) => 
    q.internalLabel?.includes("TRIGGER");

  // Check for template/question mismatches when questions are loaded
  const mismatch = useMemo(() => {
    if (!questions || !section.descriptionTemplate) return null;
    const result = getTemplateMismatch(section.descriptionTemplate, questions);
    if (result.missingQuestions.length === 0 && result.unusedLabels.length === 0) return null;
    return result;
  }, [questions, section.descriptionTemplate]);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="flex items-center gap-2 p-3">
        <div {...dragHandleProps} className="cursor-grab hover:bg-muted rounded p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}

        <CollapsibleTrigger asChild>
          <button className="flex-1 text-left font-medium hover:underline">
            {section.sectionName}
            <span className="text-muted-foreground font-normal ml-2">
              ({section.questionCount} question{section.questionCount !== 1 ? 's' : ''})
            </span>
          </button>
        </CollapsibleTrigger>

        {/* Warning indicator for template/question mismatch */}
        {mismatch && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <div className="text-sm space-y-1">
                  {mismatch.missingQuestions.length > 0 && (
                    <p>
                      <strong className="text-amber-500">Template expects:</strong>{" "}
                      {mismatch.missingQuestions.slice(0, 5).join(", ")}
                      {mismatch.missingQuestions.length > 5 && ` +${mismatch.missingQuestions.length - 5} more`}
                    </p>
                  )}
                  {mismatch.unusedLabels.length > 0 && (
                    <p>
                      <strong className="text-blue-500">Not in template:</strong>{" "}
                      {mismatch.unusedLabels.join(", ")}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Badge 
          variant={section.visibilityConditions ? "secondary" : "outline"}
          className="text-xs shrink-0"
        >
          {section.visibilitySummary}
        </Badge>

        {!section.isActive && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Inactive
          </Badge>
        )}

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditVisibility}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <div className="pl-12 pr-4 pb-3 space-y-2">
          {isLoading ? (
            <div className="space-y-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !questions || questions.length === 0 ? (
            <Droppable droppableId={`questions-${section.id}`} type="QUESTION">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="text-sm text-muted-foreground py-2 px-3 bg-background rounded border border-dashed min-h-[40px]"
                >
                  No questions in this section yet
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <Droppable droppableId={`questions-${section.id}`} type="QUESTION">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-1"
                >
                  {questions.map((question, index) => {
                    const Icon = questionTypeIcons[question.questionType] || Type;
                    const isTrigger = isTriggerQuestion(question);
                    
                    return (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-2 rounded border bg-background ${
                              snapshot.isDragging ? "ring-2 ring-primary shadow-lg" : ""
                            }`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            
                            {isTrigger && (
                              <Star className="h-3 w-3 text-yellow-500 shrink-0" fill="currentColor" />
                            )}
                            
                            <span className="flex-1 text-sm truncate">
                              {question.internalLabel || question.questionText}
                            </span>
                            
                            {question.isRequired && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Required
                              </Badge>
                            )}
                            
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => onEditQuestion(question)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive"
                                onClick={() => onDeleteQuestion(question.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onAddQuestion}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Question
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
