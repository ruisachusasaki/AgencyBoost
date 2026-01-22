import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, Edit, Trash2, GripVertical, Save, X, ChevronDown, ChevronUp, 
  MessageSquare, Hash, Calendar, Type, ListChecks, ArrowRight, Copy,
  CheckCircle2, Circle, ToggleLeft, Building2, Users
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

type QuestionType = "single_choice" | "multi_choice" | "text" | "number" | "date" | "client" | "department";

type TaskIntakeOption = {
  id: string;
  questionId: string;
  optionText: string;
  order: number;
};

type TaskIntakeQuestion = {
  id: string;
  formId: string;
  questionText: string;
  questionType: QuestionType;
  helpText?: string;
  isRequired: boolean;
  order: number;
  settings?: any;
  options: TaskIntakeOption[];
};

type TaskIntakeLogicRule = {
  id: string;
  formId: string;
  sourceQuestionId: string;
  conditions: { optionId: string }[];
  targetQuestionId?: string;
  isEndForm: boolean;
  order: number;
  enabled: boolean;
};

type TaskIntakeAssignmentRule = {
  id: string;
  formId: string;
  name: string;
  conditions: { questionId: string; optionIds: string[] }[];
  assignToStaffId?: string;
  priority: number;
  enabled: boolean;
};

type TaskIntakeForm = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  questions: TaskIntakeQuestion[];
  logicRules: TaskIntakeLogicRule[];
  assignmentRules: TaskIntakeAssignmentRule[];
};

const questionTypeIcons: Record<QuestionType, any> = {
  single_choice: Circle,
  multi_choice: CheckCircle2,
  text: Type,
  number: Hash,
  date: Calendar,
  client: Building2,
  department: Users,
};

const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  multi_choice: "Multiple Choice",
  text: "Text Input",
  number: "Number",
  date: "Date",
  client: "Client (from active clients)",
  department: "Department (from teams)",
};

const questionFormSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["single_choice", "multi_choice", "text", "number", "date", "client", "department"]),
  helpText: z.string().optional(),
  isRequired: z.boolean().default(true),
  options: z.array(z.object({ optionText: z.string() })).optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export function TaskIntakeFormBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TaskIntakeQuestion | null>(null);
  const [optionInputs, setOptionInputs] = useState<string[]>([""]);
  const [expandedSections, setExpandedSections] = useState<string[]>(["questions"]);
  
  const { data: forms, isLoading: formsLoading } = useQuery<TaskIntakeForm[]>({
    queryKey: ["/api/task-intake-forms"],
  });
  
  const { data: staffList } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });
  
  const activeForm = forms?.[0];
  
  const formId = activeForm?.id;
  
  const { data: formDetails, isLoading: formDetailsLoading } = useQuery<TaskIntakeForm>({
    queryKey: [`/api/task-intake-forms/${formId}`],
    enabled: !!formId,
  });
  
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      questionType: "single_choice",
      helpText: "",
      isRequired: true,
      options: [],
    },
  });
  
  const createFormMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/task-intake-forms", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-intake-forms"] });
      toast({ title: "Success", description: "Task intake form created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create form", variant: "destructive" });
    },
  });
  
  const invalidateFormQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/task-intake-forms"] });
    if (formId) {
      queryClient.invalidateQueries({ queryKey: [`/api/task-intake-forms/${formId}`] });
    }
  };
  
  const createQuestionMutation = useMutation({
    mutationFn: async ({ formId, data }: { formId: string; data: any }) => {
      const response = await apiRequest("POST", `/api/task-intake-forms/${formId}/questions`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      setIsQuestionDialogOpen(false);
      resetQuestionForm();
      toast({ title: "Success", description: "Question added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add question", variant: "destructive" });
    },
  });
  
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/task-intake-questions/${questionId}`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
      toast({ title: "Success", description: "Question updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update question", variant: "destructive" });
    },
  });
  
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiRequest("DELETE", `/api/task-intake-questions/${questionId}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      toast({ title: "Success", description: "Question deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
    },
  });
  
  const reorderQuestionsMutation = useMutation({
    mutationFn: async ({ formId, questionIds }: { formId: string; questionIds: string[] }) => {
      const response = await apiRequest("PUT", `/api/task-intake-forms/${formId}/questions/reorder`, { questionIds });
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
    },
  });
  
  const resetQuestionForm = () => {
    form.reset({
      questionText: "",
      questionType: "single_choice",
      helpText: "",
      isRequired: true,
      options: [],
    });
    setOptionInputs([""]);
  };
  
  const handleCreateForm = () => {
    createFormMutation.mutate({
      name: "Task Submission Form",
      description: "Guide users through creating properly scoped tasks",
    });
  };
  
  const handleOpenQuestionDialog = (question?: TaskIntakeQuestion) => {
    if (question) {
      setEditingQuestion(question);
      form.reset({
        questionText: question.questionText,
        questionType: question.questionType,
        helpText: question.helpText || "",
        isRequired: question.isRequired,
      });
      setOptionInputs(
        question.options.length > 0
          ? question.options.map((o) => o.optionText)
          : [""]
      );
    } else {
      setEditingQuestion(null);
      resetQuestionForm();
    }
    setIsQuestionDialogOpen(true);
  };
  
  const handleSubmitQuestion = (data: QuestionFormData) => {
    const questionType = data.questionType;
    const needsOptions = questionType === "single_choice" || questionType === "multi_choice";
    
    const options = needsOptions
      ? optionInputs.filter((o) => o.trim()).map((o) => ({ optionText: o.trim() }))
      : [];
    
    if (needsOptions && options.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least 2 options for choice questions",
        variant: "destructive",
      });
      return;
    }
    
    const payload = {
      ...data,
      options,
    };
    
    if (editingQuestion) {
      updateQuestionMutation.mutate({ questionId: editingQuestion.id, data: payload });
    } else if (activeForm) {
      createQuestionMutation.mutate({ formId: activeForm.id, data: payload });
    }
  };
  
  const handleDragEnd = (result: any) => {
    if (!result.destination || !formDetails) return;
    
    const items = Array.from(formDetails.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const questionIds = items.map((q) => q.id);
    reorderQuestionsMutation.mutate({ formId: formDetails.id, questionIds });
  };
  
  const addOptionInput = () => {
    setOptionInputs([...optionInputs, ""]);
  };
  
  const removeOptionInput = (index: number) => {
    if (optionInputs.length > 1) {
      setOptionInputs(optionInputs.filter((_, i) => i !== index));
    }
  };
  
  const updateOptionInput = (index: number, value: string) => {
    const newOptions = [...optionInputs];
    newOptions[index] = value;
    setOptionInputs(newOptions);
  };
  
  const watchedQuestionType = form.watch("questionType");
  const needsOptions = watchedQuestionType === "single_choice" || watchedQuestionType === "multi_choice";
  
  if (formsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (!activeForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Intake Form</CardTitle>
          <CardDescription>
            Create a guided workflow to help users properly scope and submit tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No task intake form has been created yet. Create one to start building your conditional survey.
            </p>
            <Button onClick={handleCreateForm} disabled={createFormMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task Intake Form
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const questions = formDetails?.questions || [];
  const logicRules = formDetails?.logicRules || [];
  const assignmentRules = formDetails?.assignmentRules || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Task Intake Form</h3>
          <p className="text-muted-foreground">
            Build a step-by-step survey to guide users through task creation and ensure proper scoping.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={activeForm.isActive ? "default" : "secondary"}>
            {activeForm.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      
      <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>
        <AccordionItem value="questions">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Questions ({questions.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardDescription>
                    Each question appears on its own slide. Drag to reorder.
                  </CardDescription>
                  <Button size="sm" onClick={() => handleOpenQuestionDialog()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No questions yet. Add your first question to get started.
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="questions">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {questions.map((question, index) => {
                            const Icon = questionTypeIcons[question.questionType];
                            return (
                              <Draggable key={question.id} draggableId={question.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                      snapshot.isDragging ? "bg-accent" : "bg-background"
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <Badge variant="outline" className="shrink-0">
                                      {index + 1}
                                    </Badge>
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{question.questionText}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {questionTypeLabels[question.questionType]}
                                        {question.questionType === "client" && " • From active clients"}
                                        {question.questionType === "department" && " • From teams"}
                                        {question.options.length > 0 && question.questionType !== "client" && question.questionType !== "department" && ` • ${question.options.length} options`}
                                        {question.isRequired && " • Required"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenQuestionDialog(question)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteQuestionMutation.mutate(question.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
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
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="logic">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Logic Rules ({logicRules.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>
                  Define conditional navigation: if a user selects certain answers, skip to a specific question.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogicRulesBuilder
                  formId={activeForm.id}
                  questions={questions}
                  logicRules={logicRules}
                />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="assignment">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5" />
              Assignment Rules ({assignmentRules.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>
                  Automatically assign tasks to specific staff based on survey answers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssignmentRulesBuilder
                  formId={activeForm.id}
                  questions={questions}
                  assignmentRules={assignmentRules}
                  staffList={staffList || []}
                />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>
              Configure the question that will be shown on this step of the intake form.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitQuestion)} className="space-y-4">
              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., What department is this task for?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(questionTypeLabels).map(([value, label]) => {
                          const Icon = questionTypeIcons[value as QuestionType];
                          return (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {needsOptions && (
                <div className="space-y-3">
                  <Label>Answer Options</Label>
                  {optionInputs.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOptionInput(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOptionInput(index)}
                        disabled={optionInputs.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOptionInput}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              )}
              
              {watchedQuestionType === "client" && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">Client Selection</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Options will be automatically populated from your active clients list.
                  </p>
                </div>
              )}
              
              {watchedQuestionType === "department" && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">Department Selection</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Options will be automatically populated from your teams/departments in Staff settings.
                  </p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="helpText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Help Text (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Additional guidance shown below the question"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This text appears below the question to provide additional context.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Required</FormLabel>
                      <FormDescription>
                        User must answer this question to proceed.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {editingQuestion ? "Save Changes" : "Add Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogicRulesBuilder({
  formId,
  questions,
  logicRules,
}: {
  formId: string;
  questions: TaskIntakeQuestion[];
  logicRules: TaskIntakeLogicRule[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaskIntakeLogicRule | null>(null);
  
  const [sourceQuestionId, setSourceQuestionId] = useState<string>("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [targetQuestionId, setTargetQuestionId] = useState<string>("");
  const [isEndForm, setIsEndForm] = useState(false);
  
  // Fetch teams for department question type
  const { data: teams = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/teams"],
  });
  
  // Fetch clients for client question type
  const { data: clientsData } = useQuery<{ clients: { id: number; name: string; status: string }[] }>({
    queryKey: ["/api/clients"],
  });
  
  const activeClients = (clientsData?.clients || []).filter((c) => c.status === "active");
  
  const invalidateFormQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/task-intake-forms"] });
    queryClient.invalidateQueries({ queryKey: [`/api/task-intake-forms/${formId}`] });
  };
  
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/task-intake-forms/${formId}/logic-rules`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Logic rule added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add logic rule", variant: "destructive" });
    },
  });
  
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiRequest("DELETE", `/api/task-intake-logic-rules/${ruleId}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      toast({ title: "Success", description: "Logic rule deleted" });
    },
  });
  
  const resetForm = () => {
    setSourceQuestionId("");
    setSelectedOptionIds([]);
    setTargetQuestionId("");
    setIsEndForm(false);
    setEditingRule(null);
  };
  
  const sourceQuestion = questions.find((q) => q.id === sourceQuestionId);
  const choiceQuestions = questions.filter(
    (q) => q.questionType === "single_choice" || q.questionType === "multi_choice" || q.questionType === "department" || q.questionType === "client"
  );
  
  const handleSubmit = () => {
    if (!sourceQuestionId || selectedOptionIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a source question and at least one option",
        variant: "destructive",
      });
      return;
    }
    
    if (!isEndForm && !targetQuestionId) {
      toast({
        title: "Error",
        description: "Please select a target question or mark as end form",
        variant: "destructive",
      });
      return;
    }
    
    createRuleMutation.mutate({
      sourceQuestionId,
      conditions: selectedOptionIds.map((id) => ({ optionId: id })),
      targetQuestionId: isEndForm ? null : targetQuestionId,
      isEndForm,
    });
  };
  
  const toggleOptionSelection = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };
  
  if (choiceQuestions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Add choice questions first to create conditional logic rules.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {logicRules.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No logic rules yet. Add rules to create conditional navigation.
        </div>
      ) : (
        <div className="space-y-2">
          {logicRules.map((rule) => {
            const sourceQ = questions.find((q) => q.id === rule.sourceQuestionId);
            const targetQ = questions.find((q) => q.id === rule.targetQuestionId);
            const conditions = rule.conditions as { optionId: string }[];
            const selectedOptions = conditions
              .map((c) => sourceQ?.options.find((o) => o.id === c.optionId)?.optionText)
              .filter(Boolean);
            
            return (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">If</span> "{sourceQ?.questionText}" = {selectedOptions.join(" OR ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3 inline mr-1" />
                    {rule.isEndForm
                      ? "End form"
                      : `Go to: "${targetQ?.questionText || "Unknown"}"`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRuleMutation.mutate(rule.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      
      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Logic Rule
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Logic Rule</DialogTitle>
            <DialogDescription>
              Define when to skip to a different question based on user answers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>If this question...</Label>
              <Select value={sourceQuestionId} onValueChange={(v) => {
                setSourceQuestionId(v);
                setSelectedOptionIds([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent>
                  {choiceQuestions.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.questionText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {sourceQuestion && (
              <div className="space-y-2">
                <Label>...has any of these answers:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {sourceQuestion.questionType === "department" ? (
                    teams.map((team) => (
                      <div key={`team-${team.id}`} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`team-${team.id}`}
                          checked={selectedOptionIds.includes(`team-${team.id}`)}
                          onChange={() => toggleOptionSelection(`team-${team.id}`)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`team-${team.id}`} className="text-sm cursor-pointer">
                          {team.name}
                        </label>
                      </div>
                    ))
                  ) : sourceQuestion.questionType === "client" ? (
                    activeClients.map((client) => (
                      <div key={`client-${client.id}`} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`client-${client.id}`}
                          checked={selectedOptionIds.includes(`client-${client.id}`)}
                          onChange={() => toggleOptionSelection(`client-${client.id}`)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`client-${client.id}`} className="text-sm cursor-pointer">
                          {client.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    sourceQuestion.options.map((option) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={option.id}
                          checked={selectedOptionIds.includes(option.id)}
                          onChange={() => toggleOptionSelection(option.id)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={option.id} className="text-sm cursor-pointer">
                          {option.optionText}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={isEndForm} onCheckedChange={setIsEndForm} />
              <Label>End form (don't navigate, just submit)</Label>
            </div>
            
            {!isEndForm && (
              <div className="space-y-2">
                <Label>Then go to question:</Label>
                <Select value={targetQuestionId} onValueChange={setTargetQuestionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target question" />
                  </SelectTrigger>
                  <SelectContent>
                    {questions
                      .filter((q) => q.id !== sourceQuestionId)
                      .map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.questionText}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createRuleMutation.isPending}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentRulesBuilder({
  formId,
  questions,
  assignmentRules,
  staffList,
}: {
  formId: string;
  questions: TaskIntakeQuestion[];
  assignmentRules: TaskIntakeAssignmentRule[];
  staffList: any[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [ruleName, setRuleName] = useState("");
  const [conditions, setConditions] = useState<{ questionId: string; optionIds: string[] }[]>([]);
  const [assignToStaffId, setAssignToStaffId] = useState<string>("");
  const [priority, setPriority] = useState(0);
  
  // Fetch teams for department question type
  const { data: teams = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/teams"],
  });
  
  // Fetch clients for client question type
  const { data: clientsData } = useQuery<{ clients: { id: number; name: string; status: string }[] }>({
    queryKey: ["/api/clients"],
  });
  
  const activeClients = (clientsData?.clients || []).filter((c) => c.status === "active");
  
  const invalidateFormQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/task-intake-forms"] });
    queryClient.invalidateQueries({ queryKey: [`/api/task-intake-forms/${formId}`] });
  };
  
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/task-intake-forms/${formId}/assignment-rules`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Assignment rule added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add assignment rule", variant: "destructive" });
    },
  });
  
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiRequest("DELETE", `/api/task-intake-assignment-rules/${ruleId}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateFormQueries();
      toast({ title: "Success", description: "Assignment rule deleted" });
    },
  });
  
  const resetForm = () => {
    setRuleName("");
    setConditions([]);
    setAssignToStaffId("");
    setPriority(0);
  };
  
  const choiceQuestions = questions.filter(
    (q) => q.questionType === "single_choice" || q.questionType === "multi_choice" || q.questionType === "department" || q.questionType === "client"
  );
  
  const addCondition = () => {
    setConditions([...conditions, { questionId: "", optionIds: [] }]);
  };
  
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };
  
  const updateCondition = (index: number, field: "questionId" | "optionIds", value: any) => {
    const newConditions = [...conditions];
    if (field === "questionId") {
      newConditions[index] = { questionId: value, optionIds: [] };
    } else {
      newConditions[index] = { ...newConditions[index], optionIds: value };
    }
    setConditions(newConditions);
  };
  
  const toggleConditionOption = (conditionIndex: number, optionId: string) => {
    const condition = conditions[conditionIndex];
    const newOptionIds = condition.optionIds.includes(optionId)
      ? condition.optionIds.filter((id) => id !== optionId)
      : [...condition.optionIds, optionId];
    updateCondition(conditionIndex, "optionIds", newOptionIds);
  };
  
  const handleSubmit = () => {
    if (!ruleName.trim()) {
      toast({ title: "Error", description: "Please enter a rule name", variant: "destructive" });
      return;
    }
    
    if (!assignToStaffId) {
      toast({ title: "Error", description: "Please select a staff member to assign to", variant: "destructive" });
      return;
    }
    
    if (conditions.length === 0 || conditions.some((c) => !c.questionId || c.optionIds.length === 0)) {
      toast({ title: "Error", description: "Please configure at least one complete condition", variant: "destructive" });
      return;
    }
    
    createRuleMutation.mutate({
      name: ruleName,
      conditions,
      assignToStaffId,
      priority,
    });
  };
  
  if (choiceQuestions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Add choice questions first to create assignment rules.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {assignmentRules.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No assignment rules yet. Add rules to auto-assign tasks based on answers.
        </div>
      ) : (
        <div className="space-y-2">
          {assignmentRules.map((rule) => {
            const staff = staffList.find((s) => s.id === rule.assignToStaffId);
            const ruleConditions = rule.conditions as { questionId: string; optionIds: string[] }[];
            
            return (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ruleConditions.length} condition(s) → Assign to {staff?.firstName} {staff?.lastName}
                  </p>
                </div>
                <Badge variant="outline">Priority: {rule.priority}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRuleMutation.mutate(rule.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      
      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Assignment Rule
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Assignment Rule</DialogTitle>
            <DialogDescription>
              Define conditions that determine who gets assigned the task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g., Assign Marketing tasks to Sarah"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions (all must match)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Condition
                </Button>
              </div>
              
              {conditions.map((condition, index) => {
                const question = questions.find((q) => q.id === condition.questionId);
                return (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Condition {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Select
                      value={condition.questionId}
                      onValueChange={(v) => updateCondition(index, "questionId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question" />
                      </SelectTrigger>
                      <SelectContent>
                        {choiceQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.questionText}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {question && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          If answer is any of:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {question.questionType === "department" ? (
                            teams.map((team) => (
                              <div key={`team-${team.id}`} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`${index}-team-${team.id}`}
                                  checked={condition.optionIds.includes(`team-${team.id}`)}
                                  onChange={() => toggleConditionOption(index, `team-${team.id}`)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`${index}-team-${team.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {team.name}
                                </label>
                              </div>
                            ))
                          ) : question.questionType === "client" ? (
                            activeClients.map((client) => (
                              <div key={`client-${client.id}`} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`${index}-client-${client.id}`}
                                  checked={condition.optionIds.includes(`client-${client.id}`)}
                                  onChange={() => toggleConditionOption(index, `client-${client.id}`)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`${index}-client-${client.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {client.name}
                                </label>
                              </div>
                            ))
                          ) : (
                            question.options.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`${index}-${option.id}`}
                                  checked={condition.optionIds.includes(option.id)}
                                  onChange={() => toggleConditionOption(index, option.id)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`${index}-${option.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {option.optionText}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {conditions.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                  Click "Add Condition" to define when this rule applies
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignToStaffId} onValueChange={setAssignToStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList
                    .filter((s) => s.isActive !== false)
                    .map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority (higher = evaluated first)</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createRuleMutation.isPending}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
