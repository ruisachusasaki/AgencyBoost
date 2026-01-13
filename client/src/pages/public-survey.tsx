import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ChevronRight, ChevronLeft, Check, Star, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublicSurveyProps {
  shortCode: string;
  embed?: boolean;
}

interface SurveySlide {
  id: string;
  surveyId: string;
  title: string;
  description?: string;
  order: number;
  buttonText: string;
}

interface SurveyField {
  id: string;
  surveyId: string;
  slideId: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: string[];
  settings?: any;
}

interface SurveyLogicRule {
  id: string;
  surveyId: string;
  fieldId: string;
  operator: string;
  value: string;
  actionType: string;
  targetFieldId?: string;
  targetSlideId?: string;
}

export default function PublicSurvey({ shortCode, embed = false }: PublicSurveyProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/public/surveys", shortCode],
    queryFn: async () => {
      const response = await fetch(`/api/public/surveys/${shortCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Survey not found");
        }
        throw new Error("Failed to load survey");
      }
      return response.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (submitData: { answers: { fieldId: string; value: any }[]; submitterEmail?: string; submitterName?: string }) => {
      const response = await fetch(`/api/public/surveys/${shortCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) throw new Error("Failed to submit survey");
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit survey. Please try again.", variant: "destructive" });
    },
  });

  const survey = data?.survey;
  const slides: SurveySlide[] = data?.slides || [];
  const fields: SurveyField[] = data?.fields || [];
  const logicRules: SurveyLogicRule[] = data?.logicRules || [];

  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
  const currentSlide = sortedSlides[currentSlideIndex];

  const currentSlideFields = fields
    .filter(f => f.slideId === currentSlide?.id && !hiddenFields.has(f.id))
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (logicRules.length === 0) {
      setHiddenFields(prev => prev.size === 0 ? prev : new Set());
      return;
    }

    const newHiddenFields = new Set<string>();
    
    // First pass: identify all fields with show_field rules (start hidden until condition met)
    logicRules.forEach(rule => {
      if (rule.actionType === "show_field" && rule.targetFieldId) {
        newHiddenFields.add(rule.targetFieldId);
      }
    });

    // Second pass: evaluate conditions and adjust visibility
    logicRules.forEach(rule => {
      const fieldValue = answers[rule.fieldId];
      let conditionMet = false;

      switch (rule.operator) {
        case "equals":
          conditionMet = String(fieldValue || '') === rule.value;
          break;
        case "not_equals":
          conditionMet = String(fieldValue || '') !== rule.value;
          break;
        case "contains":
          conditionMet = String(fieldValue || "").toLowerCase().includes(rule.value.toLowerCase());
          break;
        case "not_contains":
          conditionMet = !String(fieldValue || "").toLowerCase().includes(rule.value.toLowerCase());
          break;
        case "greater_than":
          conditionMet = Number(fieldValue) > Number(rule.value);
          break;
        case "less_than":
          conditionMet = Number(fieldValue) < Number(rule.value);
          break;
        case "is_empty":
          conditionMet = !fieldValue || fieldValue === "" || (Array.isArray(fieldValue) && fieldValue.length === 0);
          break;
        case "is_not_empty":
          conditionMet = fieldValue && fieldValue !== "" && !(Array.isArray(fieldValue) && fieldValue.length === 0);
          break;
      }

      if (rule.targetFieldId) {
        if (rule.actionType === "hide_field" && conditionMet) {
          newHiddenFields.add(rule.targetFieldId);
        } else if (rule.actionType === "show_field" && conditionMet) {
          newHiddenFields.delete(rule.targetFieldId);
        }
      }
    });

    // Only update state if hidden fields actually changed
    setHiddenFields(prevHidden => {
      const prevArray = [...prevHidden].sort();
      const newArray = [...newHiddenFields].sort();
      if (prevArray.length === newArray.length && prevArray.every((v, i) => v === newArray[i])) {
        return prevHidden; // No change, return same reference
      }
      return newHiddenFields;
    });
  }, [answers, logicRules]);

  const handleAnswer = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const current = answers[fieldId] || [];
    const updated = checked
      ? [...current, option]
      : current.filter((o: string) => o !== option);
    handleAnswer(fieldId, updated);
  };

  const handleRating = (fieldId: string, rating: number) => {
    handleAnswer(fieldId, rating);
  };

  const validateCurrentSlide = (): boolean => {
    for (const field of currentSlideFields) {
      if (field.required) {
        const value = answers[field.id];
        if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          toast({
            title: "Required field",
            description: `Please fill in "${field.label}"`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSlide()) return;

    // Check for jump-to-slide logic rules
    const jumpRule = logicRules.find(rule => {
      if (rule.actionType !== "jump_to_slide") return false;
      const fieldValue = answers[rule.fieldId];
      let conditionMet = false;
      
      switch (rule.operator) {
        case "equals":
          conditionMet = String(fieldValue || '') === rule.value;
          break;
        case "not_equals":
          conditionMet = String(fieldValue || '') !== rule.value;
          break;
        case "contains":
          conditionMet = String(fieldValue || "").toLowerCase().includes(rule.value.toLowerCase());
          break;
        case "not_contains":
          conditionMet = !String(fieldValue || "").toLowerCase().includes(rule.value.toLowerCase());
          break;
        case "greater_than":
          conditionMet = Number(fieldValue) > Number(rule.value);
          break;
        case "less_than":
          conditionMet = Number(fieldValue) < Number(rule.value);
          break;
        case "is_empty":
          conditionMet = !fieldValue || fieldValue === "";
          break;
        case "is_not_empty":
          conditionMet = fieldValue && fieldValue !== "";
          break;
      }
      return conditionMet;
    });

    let nextIndex = currentSlideIndex + 1;

    if (jumpRule && jumpRule.targetSlideId) {
      const targetIndex = sortedSlides.findIndex(s => s.id === jumpRule.targetSlideId);
      if (targetIndex !== -1) {
        // Loop protection: prevent jumping to already visited slide unless it's forward
        if (targetIndex > currentSlideIndex || !visitedSlides.has(targetIndex)) {
          nextIndex = targetIndex;
        }
      }
    }

    if (nextIndex < sortedSlides.length) {
      setCurrentSlideIndex(nextIndex);
      setVisitedSlides(prev => new Set([...prev, nextIndex]));
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateCurrentSlide()) return;

    // Filter out hidden fields from the submission
    const answerArray = Object.entries(answers)
      .filter(([fieldId]) => !hiddenFields.has(fieldId))
      .filter(([_, value]) => value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0))
      .map(([fieldId, value]) => ({
        fieldId,
        value,
      }));

    submitMutation.mutate({
      answers: answerArray,
      submitterEmail: submitterEmail || undefined,
      submitterName: submitterName || undefined,
    });
  };

  const isLastSlide = currentSlideIndex === sortedSlides.length - 1;
  const progress = sortedSlides.length > 0 ? ((currentSlideIndex + 1) / sortedSlides.length) * 100 : 0;

  const containerClass = embed 
    ? "flex items-center justify-center p-4" 
    : "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900";

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
            <p className="text-muted-foreground">
              This survey may have been removed or is no longer accepting responses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className={containerClass}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              Your response has been recorded. We appreciate your time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className={containerClass}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Survey Not Available</h2>
            <p className="text-muted-foreground">
              This survey has no questions to display.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={embed ? "bg-transparent p-4" : "min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4"}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">{survey?.name}</h1>
          {survey?.description && (
            <p className="text-center text-muted-foreground">{survey.description}</p>
          )}
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground mt-2">
            Step {currentSlideIndex + 1} of {sortedSlides.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentSlide.title}</CardTitle>
            {currentSlide.description && (
              <p className="text-muted-foreground">{currentSlide.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSlideFields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type === "heading" ? (
                  <div className="py-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {field.label}
                    </h3>
                    {field.helpText && (
                      <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
                    )}
                  </div>
                ) : (
                  <Label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                )}

                {field.type === "short_text" && (
                  <Input
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === "long_text" && (
                  <Textarea
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                  />
                )}

                {field.type === "email" && (
                  <Input
                    type="email"
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                    placeholder={field.placeholder || "email@example.com"}
                  />
                )}

                {field.type === "phone" && (
                  <Input
                    type="tel"
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                    placeholder={field.placeholder || "(555) 555-5555"}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    type="number"
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === "date" && (
                  <Input
                    type="date"
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                  />
                )}

                {field.type === "dropdown" && (
                  <Select
                    value={answers[field.id] || ""}
                    onValueChange={(value) => handleAnswer(field.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((option, i) => (
                        <SelectItem key={i} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "multiple_choice" && (
                  <RadioGroup
                    value={answers[field.id] || ""}
                    onValueChange={(value) => handleAnswer(field.id, value)}
                  >
                    {(field.options || []).map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${field.id}-${i}`} />
                        <Label htmlFor={`${field.id}-${i}`} className="font-normal cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {field.type === "checkboxes" && (
                  <div className="space-y-2">
                    {(field.options || []).map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.id}-${i}`}
                          checked={(answers[field.id] || []).includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange(field.id, option, checked as boolean)}
                        />
                        <Label htmlFor={`${field.id}-${i}`} className="font-normal cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {field.type === "rating" && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleRating(field.id, n)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 cursor-pointer transition-colors ${
                            n <= (answers[field.id] || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom field or unknown type - default to text input */}
                {(field.type === "custom_field" || !["short_text", "long_text", "email", "phone", "number", "date", "dropdown", "multiple_choice", "checkboxes", "rating"].includes(field.type)) && (
                  <Input
                    value={answers[field.id] || ""}
                    onChange={(e) => handleAnswer(field.id, e.target.value)}
                    placeholder={field.placeholder || ""}
                  />
                )}

                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {isLastSlide ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="bg-primary"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-primary">
                  {currentSlide.buttonText || "Next"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
