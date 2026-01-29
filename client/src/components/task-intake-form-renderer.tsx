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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, AlertCircle, X, Loader2, ExternalLink, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

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
  return allSections.filter(section => 
    evaluateSectionVisibility(section, answers, allSections)
  );
}

function evaluateQuestionVisibility(
  question: IntakeQuestion,
  answers: Answers,
  sectionQuestions: IntakeQuestion[]
): boolean {
  const settings = question.settings || {};
  
  // Check hideWhen condition first - if met, hide the question
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
    // Special handling for client_select question
    if (question.internalLabel === "client_select") {
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
        const dateValue = value ? new Date(value as string) : undefined;
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
      <Label className="text-sm font-medium">
        {question.questionText}
        {question.isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
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

interface TaskIntakeFormRendererProps {
  isPreview?: boolean;
  onClose?: () => void;
  onSubmit?: (answers: Answers, visibleSections: IntakeSection[]) => Promise<void>;
  initialAnswers?: Answers;
}

export function TaskIntakeFormRenderer({
  isPreview = false,
  onClose,
  onSubmit,
  initialAnswers = {},
}: TaskIntakeFormRendererProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    taskId: string;
    taskUrl: string;
  } | null>(null);

  const { data: formData, isLoading, error } = useQuery<IntakeFormData>({
    queryKey: ["/api/task-intake/form"],
  });

  // Fetch clients for the client_select dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    select: (data) => data.map(c => ({ id: c.id, name: c.name, company: c.company })),
  });

  // Fetch departments/teams for the department dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const visibleSections = useMemo(() => {
    if (!formData?.sections) return [];
    return getVisibleSections(formData.sections, answers);
  }, [formData?.sections, answers]);

  const currentSection = visibleSections[currentSectionIndex];

  const visibleQuestions = useMemo(() => {
    if (!currentSection) return [];
    return currentSection.questions.filter(q => 
      evaluateQuestionVisibility(q, answers, currentSection.questions)
    );
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

    if (isPreview) {
      toast({
        title: "Preview Mode",
        description: "Form would be submitted here. This is just a preview.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        // Use provided onSubmit handler
        await onSubmit(answers, visibleSections);
        toast({
          title: "Success",
          description: "Form submitted successfully",
        });
      } else if (formData?.formId) {
        // Default API submission
        const visibleSectionIds = visibleSections.map(s => s.id);
        const response = await apiRequest("/api/task-intake/submit", {
          method: "POST",
          body: JSON.stringify({
            formId: formData.formId,
            answers,
            visibleSectionIds,
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          setSubmissionResult({
            taskId: result.taskId,
            taskUrl: result.taskUrl,
          });
          toast({
            title: "Task Created!",
            description: "Your task has been created successfully.",
          });
          // Auto-redirect after 2 seconds
          setTimeout(() => {
            setLocation(result.taskUrl);
          }, 2000);
        } else {
          throw new Error(result.error || "Failed to submit form");
        }
      }
    } catch (err: any) {
      // Handle validation errors from API
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
  }, [validateCurrentSection, visibleSections, answers, isPreview, onSubmit, toast, formData?.formId, setLocation]);

  if (isLoading) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !formData) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load the intake form. Please try again."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (visibleSections.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8 text-center text-muted-foreground">
          No form sections available.
        </CardContent>
      </Card>
    );
  }

  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === visibleSections.length - 1;

  // Show success state after submission
  if (submissionResult) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-12 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Task Created!</h2>
            <p className="text-muted-foreground">
              Your task has been created successfully. Redirecting...
            </p>
          </div>
          <Button onClick={() => setLocation(submissionResult.taskUrl)} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Task Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {isPreview && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <span>Preview Mode - submissions will not be saved</span>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />
                Close Preview
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>{formData.formName}</CardTitle>
            <Badge variant="outline">
              Section {currentSectionIndex + 1} of {visibleSections.length}
            </Badge>
          </div>
          
          <ProgressStepper
            sections={visibleSections}
            currentIndex={currentSectionIndex}
            completedIndices={completedSections}
            onNavigate={handleNavigate}
          />
        </CardHeader>

        <CardContent className="space-y-6">
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Submit
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
        </CardContent>
      </Card>
    </div>
  );
}
