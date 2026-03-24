import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, AlertCircle, Loader2, CalendarIcon, Info, Repeat, Upload, FileText, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface IntakeOption {
  id: string;
  optionText: string;
  order: number;
}

interface IntakeQuestion {
  id: string;
  questionText: string;
  questionType: string;
  helpText: string | null;
  tooltip: string | null;
  internalLabel: string | null;
  isRequired: boolean;
  order: number;
  settings: Record<string, any>;
  options: IntakeOption[];
}

interface VisibilityCondition {
  questionId: string;
  operator: string;
  value: string;
}

interface VisibilityConditions {
  operator: "AND" | "OR";
  conditions: VisibilityCondition[];
}

interface IntakeSection {
  id: string;
  sectionName: string;
  internalLabel: string | null;
  orderIndex: number;
  visibilityConditions: VisibilityConditions | null;
  descriptionTemplate: string | null;
  questions: IntakeQuestion[];
}

interface IntakeFormData {
  formId: string;
  formName: string;
  sections: IntakeSection[];
}

type Answers = Record<string, string | string[] | number | null>;
type ValidationErrors = Record<string, string>;

function evaluateCondition(
  condition: VisibilityCondition,
  answers: Answers
): boolean {
  const answer = answers[condition.questionId];
  
  if (answer === undefined || answer === null) {
    return false;
  }

  switch (condition.operator) {
    case "equals":
      if (Array.isArray(answer)) {
        return answer.includes(condition.value);
      }
      return String(answer) === condition.value;
    
    case "not_equals":
      if (Array.isArray(answer)) {
        return !answer.includes(condition.value);
      }
      return String(answer) !== condition.value;
    
    case "includes":
      if (Array.isArray(answer)) {
        return answer.includes(condition.value);
      }
      return String(answer).includes(condition.value);
    
    case "not_empty":
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return String(answer).trim() !== "";
    
    default:
      return false;
  }
}

function evaluateSectionVisibility(
  section: IntakeSection,
  answers: Answers,
  allSections: IntakeSection[]
): boolean {
  if (!section.visibilityConditions) {
    return true;
  }

  const { operator, conditions } = section.visibilityConditions;
  
  if (!conditions || conditions.length === 0) {
    return true;
  }

  const conditionResults = conditions.map(condition => {
    const triggerQuestion = allSections
      .flatMap(s => s.questions)
      .find(q => q.id === condition.questionId);
    
    if (!triggerQuestion) {
      return false;
    }

    const triggerSection = allSections.find(s => 
      s.questions.some(q => q.id === condition.questionId)
    );
    
    if (triggerSection && triggerSection.id !== section.id) {
      const triggerSectionVisible = evaluateSectionVisibility(
        triggerSection, 
        answers, 
        allSections
      );
      if (!triggerSectionVisible) {
        return false;
      }
    }

    return evaluateCondition(condition, answers);
  });

  if (operator === "AND") {
    return conditionResults.every(result => result);
  } else {
    return conditionResults.some(result => result);
  }
}

function getVisibleSections(
  allSections: IntakeSection[],
  answers: Answers
): IntakeSection[] {
  return allSections
    .filter(section => evaluateSectionVisibility(section, answers, allSections))
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

function evaluateQuestionVisibility(
  question: IntakeQuestion,
  answers: Answers,
  sectionQuestions: IntakeQuestion[]
): boolean {
  const settings = question.settings || {};
  
  if (settings.hideWhen) {
    const { triggerQuestionId, requiredValues } = settings.hideWhen;
    const answer = answers[triggerQuestionId];
    
    if (answer !== undefined && answer !== null) {
      const answerStr = Array.isArray(answer) ? answer : [String(answer)];
      const shouldHide = requiredValues.some((val: string) => answerStr.includes(val));
      if (shouldHide) {
        return false;
      }
    }
  }
  
  if (settings.showWhen) {
    const { questionInternalLabel, operator, value } = settings.showWhen;
    const triggerQuestion = sectionQuestions.find(q => 
      q.internalLabel?.includes(questionInternalLabel)
    );
    
    if (triggerQuestion) {
      const answer = answers[triggerQuestion.id];
      
      switch (operator) {
        case "equals":
          if (Array.isArray(answer)) {
            return answer.includes(value);
          }
          return String(answer || "") === value;
        case "not_equals":
          if (Array.isArray(answer)) {
            return !answer.includes(value);
          }
          return String(answer || "") !== value;
        case "includes":
          if (Array.isArray(answer)) {
            return answer.includes(value);
          }
          return String(answer || "").includes(value);
        case "not_empty":
          if (answer === undefined || answer === null) {
            return false;
          }
          if (Array.isArray(answer)) {
            return answer.length > 0;
          }
          return String(answer).trim() !== "";
        default:
          return true;
      }
    }
  }

  const internalLabel = question.internalLabel?.toLowerCase() || "";
  if (internalLabel.includes("_other") || internalLabel.endsWith("other")) {
    const questionIndex = sectionQuestions.findIndex(q => q.id === question.id);
    if (questionIndex > 0) {
      const prevQuestion = sectionQuestions[questionIndex - 1];
      const prevAnswer = answers[prevQuestion.id];
      if (Array.isArray(prevAnswer)) {
        return prevAnswer.some(v => v.toLowerCase().includes("other"));
      }
      return String(prevAnswer || "").toLowerCase().includes("other");
    }
  }

  if (internalLabel.includes("urgent_reason")) {
    const priorityQuestion = sectionQuestions.find(q => 
      q.internalLabel?.includes("priority_level")
    );
    if (priorityQuestion) {
      return String(answers[priorityQuestion.id] || "") === "Urgent";
    }
  }

  return true;
}

function validateQuestion(
  question: IntakeQuestion,
  answer: string | string[] | number | null | undefined
): string | null {
  if (question.isRequired) {
    if (answer === undefined || answer === null) {
      return "This field is required";
    }
    if (typeof answer === "string" && answer.trim() === "") {
      return "This field is required";
    }
    if (Array.isArray(answer) && answer.length === 0) {
      return "Please select at least one option";
    }
  }

  if (answer === undefined || answer === null || answer === "") {
    return null;
  }

  const settings = question.settings || {};

  switch (question.questionType) {
    case "text":
    case "textarea":
      const strValue = String(answer);
      if (settings.minLength && strValue.length < settings.minLength) {
        return `Minimum ${settings.minLength} characters required`;
      }
      if (settings.maxLength && strValue.length > settings.maxLength) {
        return `Maximum ${settings.maxLength} characters allowed`;
      }
      break;

    case "number":
      const numValue = Number(answer);
      if (isNaN(numValue)) {
        return "Please enter a valid number";
      }
      if (settings.min !== undefined && numValue < settings.min) {
        return `Minimum value is ${settings.min}`;
      }
      if (settings.max !== undefined && numValue > settings.max) {
        return `Maximum value is ${settings.max}`;
      }
      break;

    case "url":
      const urlValue = String(answer);
      try {
        new URL(urlValue);
      } catch {
        return "Please enter a valid URL (include https://)";
      }
      break;

    case "upload":
      break;
  }

  return null;
}

interface QuestionRendererProps {
  question: IntakeQuestion;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number | null) => void;
  error?: string;
  disabled?: boolean;
  clients?: Client[];
  departments?: Department[];
}

function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  disabled = false,
  clients = [],
  departments = [],
}: QuestionRendererProps) {
  const settings = question.settings || {};

  const renderInput = () => {
    if (question.internalLabel === "client_select" || question.questionType === "client") {
      return (
        <Select
          value={String(value || "")}
          onValueChange={(val) => onChange(val)}
          disabled={disabled}
        >
          <SelectTrigger className={cn("w-full max-w-md", error && "border-destructive")}>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_client">No client (internal task)</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}{client.company ? ` - ${client.company}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    switch (question.questionType) {
      case "text":
        return (
          <Input
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={settings.placeholder || "Enter your answer"}
            maxLength={settings.maxLength}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={settings.placeholder || "Enter your answer"}
            maxLength={settings.maxLength}
            rows={settings.rows || 4}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === "" ? null : Number(val));
            }}
            min={settings.min}
            max={settings.max}
            step={settings.step || 1}
            disabled={disabled}
            className={cn("w-40", error && "border-destructive")}
          />
        );

      case "date":
        const dateValue = value ? parseISO(value as string) : undefined;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full max-w-xs pl-3 text-left font-normal mt-1",
                  !value && "text-muted-foreground",
                  error && "border-destructive"
                )}
              >
                {dateValue ? (
                  format(dateValue, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  onChange(date ? format(date, "yyyy-MM-dd") : null);
                }}
                disabled={disabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "url":
        return (
          <Input
            type="url"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com"
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        );

      case "single_choice":
        const singleOptions = question.options || [];
        const displayType = settings.displayType || (singleOptions.length <= 4 ? "radio" : "dropdown");

        if (displayType === "dropdown" || singleOptions.length > 4) {
          return (
            <Select
              value={String(value || "")}
              onValueChange={(val) => onChange(val)}
              disabled={disabled}
            >
              <SelectTrigger className={cn("w-full max-w-md", error && "border-destructive")}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {singleOptions.map((option) => (
                  <SelectItem key={option.id} value={option.optionText}>
                    {option.optionText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return (
          <RadioGroup
            value={String(value || "")}
            onValueChange={(val) => onChange(val)}
            disabled={disabled}
            className="space-y-2"
          >
            {singleOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.optionText} id={option.id} />
                <Label htmlFor={option.id} className="font-normal cursor-pointer">
                  {option.optionText}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multi_choice":
        const multiOptions = question.options || [];
        const selectedValues = Array.isArray(value) ? value : [];

        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
            {multiOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedValues.includes(option.optionText)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option.optionText]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option.optionText));
                    }
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={option.id} className="font-normal cursor-pointer">
                  {option.optionText}
                </Label>
              </div>
            ))}
          </div>
        );

      case "department":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(val) => onChange(val)}
            disabled={disabled}
          >
            <SelectTrigger className={cn("w-full max-w-md", error && "border-destructive")}>
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "upload": {
        const uploadedFiles: Array<{url: string; name: string; size: number; type: string}> = (() => {
          try {
            if (typeof value === 'string' && value) return JSON.parse(value);
          } catch {}
          return [];
        })();
        const formatSize = (bytes: number) => {
          if (bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        };
        return (
          <div className="space-y-3">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors",
                error ? "border-destructive" : "border-slate-300 dark:border-slate-600"
              )}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = settings.acceptedTypes || '*/*';
                input.onchange = async (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files || files.length === 0) return;
                  const newFiles = [...uploadedFiles];
                  for (const file of Array.from(files)) {
                    try {
                      const uploadRes = await fetch('/api/objects/upload', {
                        method: 'POST',
                        credentials: 'include',
                      });
                      const uploadData = await uploadRes.json();
                      await fetch(uploadData.uploadURL, {
                        method: 'PUT',
                        body: file,
                        headers: { 'Content-Type': file.type },
                      });
                      const permanentUrl = uploadData.uploadURL.split('?')[0];
                      newFiles.push({
                        url: permanentUrl,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      });
                    } catch (err) {
                      console.error('File upload failed:', err);
                    }
                  }
                  onChange(JSON.stringify(newFiles));
                };
                input.click();
              }}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Click to upload files
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {settings.acceptedTypes ? `Accepted: ${settings.acceptedTypes}` : 'Any file type accepted'}
              </p>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = uploadedFiles.filter((_, i) => i !== idx);
                        onChange(updated.length > 0 ? JSON.stringify(updated) : null);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <Input
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">
          {question.questionText}
          {question.isRequired && <span className="text-destructive ml-1 mr-2">*</span>}
        </Label>
        {question.tooltip && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{question.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {question.helpText && (
        <p className="text-sm text-muted-foreground">{question.helpText}</p>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface ProgressStepperProps {
  sections: IntakeSection[];
  currentIndex: number;
  completedIndices: number[];
  onNavigate: (index: number) => void;
}

function ProgressStepper({
  sections,
  currentIndex,
  completedIndices,
  onNavigate,
}: ProgressStepperProps) {
  const progressPercent = sections.length > 0 
    ? ((currentIndex + 1) / sections.length) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <Progress value={progressPercent} className="h-2" />
      
      <div className="flex flex-wrap gap-2">
        {sections.map((section, index) => {
          const isCompleted = completedIndices.includes(index);
          const isCurrent = index === currentIndex;
          const isAccessible = index <= currentIndex || isCompleted;

          return (
            <button
              key={section.id}
              onClick={() => isAccessible && onNavigate(index)}
              disabled={!isAccessible}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                isCurrent && "bg-primary text-primary-foreground",
                isCompleted && !isCurrent && "bg-primary/20 text-primary hover:bg-primary/30",
                !isCurrent && !isCompleted && isAccessible && "bg-muted hover:bg-muted/80",
                !isAccessible && "bg-muted/50 text-muted-foreground cursor-not-allowed"
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-background/50 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline max-w-[150px] truncate">
                {section.sectionName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TaskIntakeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  parentTaskId?: string;
  onSuccess?: () => void;
  defaultClientId?: string;
  defaultLeadId?: string;
}

export function TaskIntakeDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  parentTaskId,
  onSuccess,
  defaultClientId,
  defaultLeadId,
}: TaskIntakeDialogProps) {
  // Support both controlled and uncontrolled usage
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Answers>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringUnit, setRecurringUnit] = useState<"hours" | "days" | "weeks" | "months" | "years">("days");
  const [recurringEndType, setRecurringEndType] = useState<"never" | "after_occurrences" | "on_date">("never");
  const [recurringEndOccurrences, setRecurringEndOccurrences] = useState(10);
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [recurringEndDateOpen, setRecurringEndDateOpen] = useState(false);

  const { data: formData, isLoading, error } = useQuery<IntakeFormData>({
    queryKey: ["/api/task-intake/form"],
    enabled: open,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: open,
    select: (data: any) => {
      const clientsList = data?.clients || [];
      return clientsList
        .filter((c: any) => c.status?.toLowerCase() === "active")
        .map((c: any) => ({ id: String(c.id), name: c.name, company: c.company }));
    },
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/task-intake/departments"],
    enabled: open,
  });

  const { data: taskCategories = [] } = useQuery<{ id: string; name: string; color: string | null }[]>({
    queryKey: ["/api/task-categories"],
    enabled: open,
  });

  const visibleSections = useMemo(() => {
    if (!formData?.sections) return [];
    return getVisibleSections(formData.sections, answers);
  }, [formData?.sections, answers]);

  const isPersonalTask = useMemo(() => {
    if (!formData?.sections) return false;
    for (const section of formData.sections) {
      const taskScopeQuestion = section.questions.find(
        q => q.internalLabel?.toLowerCase().replace(/^trigger\s*-\s*/, '') === 'task_scope'
      );
      if (taskScopeQuestion) {
        const answer = answers[taskScopeQuestion.id];
        return String(answer || '').toLowerCase().includes('personal');
      }
    }
    return false;
  }, [formData?.sections, answers]);

  const currentSection = visibleSections[currentSectionIndex];

  const visibleQuestions = useMemo(() => {
    if (!currentSection) return [];
    return currentSection.questions
      .filter(q => evaluateQuestionVisibility(q, answers, currentSection.questions))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
  }, [currentSection, answers]);

  const handleAnswerChange = useCallback((questionId: string, value: string | string[] | number | null) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  }, []);

  const validateCurrentSection = useCallback((): boolean => {
    if (!currentSection) return true;

    const errors: ValidationErrors = {};
    
    visibleQuestions.forEach(question => {
      const error = validateQuestion(question, answers[question.id]);
      if (error) {
        errors[question.id] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentSection, visibleQuestions, answers]);

  const handleNext = useCallback(() => {
    if (!validateCurrentSection()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
      });
      return;
    }

    setCompletedSections(prev => 
      prev.includes(currentSectionIndex) ? prev : [...prev, currentSectionIndex]
    );

    if (currentSectionIndex < visibleSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  }, [validateCurrentSection, currentSectionIndex, visibleSections.length, toast]);

  const handleBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  }, [currentSectionIndex]);

  const handleNavigate = useCallback((index: number) => {
    if (index < currentSectionIndex || completedSections.includes(index)) {
      setCurrentSectionIndex(index);
    }
  }, [currentSectionIndex, completedSections]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentSection()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < visibleSections.length; i++) {
      const section = visibleSections[i];
      const sectionQuestions = section.questions.filter(q =>
        evaluateQuestionVisibility(q, answers, section.questions)
      );
      
      for (const question of sectionQuestions) {
        const error = validateQuestion(question, answers[question.id]);
        if (error) {
          setCurrentSectionIndex(i);
          setValidationErrors({ [question.id]: error });
          toast({
            title: "Validation Error",
            description: `Please fix errors in "${section.sectionName}"`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      if (formData?.formId) {
        const visibleSectionIds = visibleSections.map(s => s.id);
        const recurringData = isRecurring ? {
          isRecurring: true,
          recurringInterval,
          recurringUnit,
          recurringEndType,
          recurringEndDate: recurringEndType === 'on_date' && recurringEndDate ? recurringEndDate.toISOString() : null,
          recurringEndOccurrences: recurringEndType === 'after_occurrences' ? recurringEndOccurrences : null,
        } : {};

        const response = await apiRequest("POST", "/api/task-intake/submit", {
          formId: formData.formId,
          answers,
          visibleSectionIds,
          parentTaskId: parentTaskId || null,
          categoryId: selectedCategoryId || null,
          ...recurringData,
        });
        
        const result = await response.json().catch(() => ({ error: "Unexpected server error" }));
        
        if (result.success) {
          toast({
            title: parentTaskId ? "Sub-task Created!" : "Task Created!",
            description: parentTaskId 
              ? "Your sub-task has been created successfully."
              : "Your task has been created successfully.",
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          if (parentTaskId) {
            queryClient.invalidateQueries({ queryKey: [`/api/tasks/${parentTaskId}/subtasks`] });
            queryClient.invalidateQueries({ queryKey: [`/api/tasks/${parentTaskId}`] });
          }
          
          resetForm();
          onOpenChange(false);
          onSuccess?.();
          
          if (!parentTaskId) {
            setLocation(result.taskUrl);
          }
        } else {
          throw new Error(result.error || "Failed to submit form");
        }
      }
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        const errorMap: ValidationErrors = {};
        err.errors.forEach((e: { questionId: string; message: string }) => {
          errorMap[e.questionId] = e.message;
        });
        setValidationErrors(errorMap);
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentSection, visibleSections, answers, formData?.formId, parentTaskId, toast, onOpenChange, onSuccess, setLocation, isRecurring, recurringInterval, recurringUnit, recurringEndType, recurringEndDate, recurringEndOccurrences, selectedCategoryId]);

  const resetForm = useCallback(() => {
    setAnswers({});
    setCurrentSectionIndex(0);
    setValidationErrors({});
    setCompletedSections([]);
    setSelectedCategoryId("");
    setIsRecurring(false);
    setRecurringInterval(1);
    setRecurringUnit("days");
    setRecurringEndType("never");
    setRecurringEndOccurrences(10);
    setRecurringEndDate(null);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetForm]);

  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === visibleSections.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {parentTaskId ? "Add Sub-task" : "Add New Task"}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error || !formData ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load the intake form. Please try again."}
            </AlertDescription>
          </Alert>
        ) : visibleSections.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No form sections available.
          </div>
        ) : (
          <div className="space-y-6">
            <ProgressStepper
              sections={visibleSections}
              currentIndex={currentSectionIndex}
              completedIndices={completedSections}
              onNavigate={handleNavigate}
            />

            {currentSection && (
              <>
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold">{currentSection.sectionName}</h3>
                  {currentSection.internalLabel && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentSection.internalLabel}
                    </p>
                  )}
                </div>

                <div className="space-y-6">
                  {visibleQuestions.map((question) => (
                    <QuestionRenderer
                      key={question.id}
                      question={question}
                      value={answers[question.id] ?? null}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      error={validationErrors[question.id]}
                      disabled={isSubmitting}
                      clients={clients}
                      departments={departments}
                    />
                  ))}

                  {isLastSection && taskCategories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category</Label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger data-testid="select-task-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No Category</SelectItem>
                          {taskCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                {cat.color && (
                                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                                )}
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isLastSection && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium">Recurring Task</Label>
                        </div>
                        <Switch
                          checked={isRecurring}
                          onCheckedChange={setIsRecurring}
                          disabled={isSubmitting}
                          data-testid="switch-recurring"
                        />
                      </div>

                      {isRecurring && (
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-sm">Repeat Every</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  type="number"
                                  min={1}
                                  value={recurringInterval}
                                  onChange={(e) => setRecurringInterval(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-20"
                                  disabled={isSubmitting}
                                  data-testid="input-recurring-interval"
                                />
                                <Select value={recurringUnit} onValueChange={(val: any) => setRecurringUnit(val)}>
                                  <SelectTrigger className="w-32" data-testid="select-recurring-unit">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                    <SelectItem value="years">Years</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Frequency</Label>
                            <Select value={recurringEndType} onValueChange={(val: any) => setRecurringEndType(val)}>
                              <SelectTrigger className="mt-1" data-testid="select-recurring-end-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">No End Date</SelectItem>
                                <SelectItem value="after_occurrences">After No. of Occurrences</SelectItem>
                                <SelectItem value="on_date">Specific Date</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {recurringEndType === "after_occurrences" && (
                            <div>
                              <Label className="text-sm">Number of Occurrences</Label>
                              <Input
                                type="number"
                                min={1}
                                value={recurringEndOccurrences}
                                onChange={(e) => setRecurringEndOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1 w-32"
                                disabled={isSubmitting}
                                data-testid="input-recurring-occurrences"
                              />
                            </div>
                          )}

                          {recurringEndType === "on_date" && (
                            <div>
                              <Label className="text-sm">End Date</Label>
                              <Popover open={recurringEndDateOpen} onOpenChange={setRecurringEndDateOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "mt-1 w-full justify-start text-left font-normal",
                                      !recurringEndDate && "text-muted-foreground"
                                    )}
                                    disabled={isSubmitting}
                                    data-testid="button-recurring-end-date"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {recurringEndDate ? format(recurringEndDate, "PPP") : "Pick an end date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={recurringEndDate || undefined}
                                    onSelect={(date) => {
                                      setRecurringEndDate(date || null);
                                      setRecurringEndDateOpen(false);
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isFirstSection || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {isLastSection ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Create {parentTaskId ? "Sub-task" : "Task"}
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
