import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, Upload, X, Save } from "lucide-react";

function formatInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);
    const match = boldMatch && italicMatch
      ? (boldMatch.index! <= italicMatch.index! ? boldMatch : italicMatch)
      : boldMatch || italicMatch;
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }
    if (match.index > 0) parts.push(remaining.slice(0, match.index));
    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else {
      parts.push(<em key={key++}>{match[1]}</em>);
    }
    remaining = remaining.slice(match.index + match[0].length);
  }
  return parts;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round((255 - (num >> 16)) * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * percent / 100));
  const b = Math.min(255, (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  fields: { customFieldId: string; required: boolean; type?: "field" | "text_block"; textContent?: string }[];
}

interface OnboardingBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  welcomeHeading: string;
  welcomeDescription: string;
  successHeading: string;
  successDescription: string;
}

export default function ClientOnboarding() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fileUploading, setFileUploading] = useState<string | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/client-onboarding', token],
    queryFn: async () => {
      const res = await fetch(`/api/client-onboarding/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load');
      }
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (data && !progressLoaded) {
      if (data.savedProgress && typeof data.savedProgress === 'object') {
        setValues(data.savedProgress as Record<string, any>);
      }
      if (data.savedStep && typeof data.savedStep === 'number') {
        const steps = (data.config?.steps as any[]) || [];
        const maxStep = Math.max(0, steps.length - 1);
        setCurrentStep(Math.min(Math.max(0, data.savedStep), maxStep));
      }
      setProgressLoaded(true);
    }
  }, [data, progressLoaded]);

  const submitMutation = useMutation({
    mutationFn: async (formValues: Record<string, any>) => {
      const res = await fetch(`/api/client-onboarding/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: formValues }),
      });
      if (!res.ok) throw new Error('Submission failed');
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/client-onboarding/${token}/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values, currentStep }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    },
    onSuccess: () => {
      setSaveMessage("Progress saved! You can close this page and come back later.");
      setTimeout(() => setSaveMessage(null), 5000);
    },
    onError: () => {
      setSaveMessage(null);
      alert("Failed to save progress. Please check your connection and try again.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    const errMsg = (error as Error).message;
    const isCompleted = errMsg.includes('already been completed');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            {isCompleted ? (
              <>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h2 className="text-xl font-semibold mb-2">Onboarding Already Completed</h2>
                <p className="text-muted-foreground">You've already submitted your onboarding information. Thank you!</p>
              </>
            ) : (
              <>
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Link Not Found</h2>
                <p className="text-muted-foreground">{errMsg}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { client, config, customFields } = data;
  const steps: StepConfig[] = config.steps || [];
  const branding: OnboardingBranding = {
    companyName: '',
    logoUrl: '',
    primaryColor: '#00C9C6',
    welcomeHeading: 'Welcome! Let\'s Get You Started',
    welcomeDescription: 'Please complete this onboarding form so we can get started.',
    successHeading: 'Onboarding Complete!',
    successDescription: 'Thank you for completing your onboarding form.',
    ...(config.branding || {}),
  };
  if (branding.logoUrl) {
    branding.logoUrl = '/api/public/onboarding-logo';
  }

  const primaryColor = branding.primaryColor || '#00C9C6';
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const getFieldById = (id: string) => customFields?.find((f: any) => f.id === id);

  const validateCurrentStep = (): boolean => {
    if (currentStep >= steps.length) return true;
    const step = steps[currentStep];
    const newErrors: Record<string, string> = {};
    step.fields.filter(fc => fc.type !== 'text_block').forEach(fc => {
      if (fc.required) {
        const val = values[fc.customFieldId];
        const field = getFieldById(fc.customFieldId);
        const label = field?.name || 'This field';
        let isEmpty = false;
        if (val === undefined || val === null || val === '') {
          isEmpty = true;
        } else if (typeof val === 'string' && !val.trim()) {
          isEmpty = true;
        } else if (Array.isArray(val) && val.length === 0) {
          isEmpty = true;
        } else if (typeof val === 'object' && !Array.isArray(val) && Object.values(val).every(v => !v)) {
          isEmpty = true;
        }
        if (isEmpty) {
          newErrors[fc.customFieldId] = `${label} is required`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (isLastStep) {
      submitMutation.mutate(values);
    } else {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    window.scrollTo(0, 0);
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    setFileUploading(fieldId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/onboarding-file-upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      setValues(prev => ({ ...prev, [fieldId]: result.fileUrl || result.url }));
    } catch {
      setErrors(prev => ({ ...prev, [fieldId]: 'File upload failed' }));
    } finally {
      setFileUploading(null);
    }
  };

  const renderField = (fieldConfig: { customFieldId: string; required: boolean }) => {
    const field = getFieldById(fieldConfig.customFieldId);
    if (!field) return null;

    const value = values[fieldConfig.customFieldId] || '';
    const error = errors[fieldConfig.customFieldId];

    const onChange = (val: any) => {
      setValues(prev => ({ ...prev, [fieldConfig.customFieldId]: val }));
      if (errors[fieldConfig.customFieldId]) {
        setErrors(prev => { const n = { ...prev }; delete n[fieldConfig.customFieldId]; return n; });
      }
    };

    return (
      <div key={fieldConfig.customFieldId} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.name}
          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.type === 'text' && (
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${field.name.toLowerCase()}`} />
        )}
        {field.type === 'email' && (
          <Input type="email" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter email`} />
        )}
        {field.type === 'phone' && (
          <Input type="tel" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter phone number`} />
        )}
        {field.type === 'number' && (
          <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${field.name.toLowerCase()}`} />
        )}
        {field.type === 'currency' && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="pl-7" placeholder="0.00" />
          </div>
        )}
        {field.type === 'multiline' && (
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${field.name.toLowerCase()}`} rows={4} />
        )}
        {field.type === 'date' && (
          <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        {field.type === 'url' && (
          <Input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://" />
        )}
        {field.type === 'dropdown' && (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {field.type === 'dropdown_multiple' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(value) ? value : []).map((v: string) => (
                <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  {v}
                  <button type="button" onClick={() => onChange((Array.isArray(value) ? value : []).filter((x: string) => x !== v))} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Select onValueChange={(v) => {
              const current = Array.isArray(value) ? value : [];
              if (!current.includes(v)) onChange([...current, v]);
            }}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).filter((opt: string) => !(Array.isArray(value) ? value : []).includes(opt)).map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {(field.options || []).map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(Array.isArray(value) ? value : []).includes(opt)}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(e.target.checked ? [...current, opt] : current.filter((x: string) => x !== opt));
                  }}
                  className="rounded"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'radio' && (
          <div className="space-y-2">
            {(field.options || []).map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={fieldConfig.customFieldId}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'file_upload' && (
          <div>
            {value ? (
              <div className="flex items-center gap-2 p-2 border rounded">
                <span className="text-sm truncate flex-1">File uploaded</span>
                <Button variant="ghost" size="sm" onClick={() => onChange('')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(fieldConfig.customFieldId, f);
                  }}
                  disabled={fileUploading === fieldConfig.customFieldId}
                />
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                  {fileUploading === fieldConfig.customFieldId ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    </>
                  )}
                </div>
              </label>
            )}
          </div>
        )}
        {field.type === 'contact_card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/30">
            <Input
              value={(value && typeof value === 'object' ? value.name : '') || ''}
              onChange={(e) => onChange({ ...(typeof value === 'object' ? value : {}), name: e.target.value })}
              placeholder="Contact Name"
            />
            <Input
              value={(value && typeof value === 'object' ? value.email : '') || ''}
              onChange={(e) => onChange({ ...(typeof value === 'object' ? value : {}), email: e.target.value })}
              placeholder="Email"
            />
            <Input
              value={(value && typeof value === 'object' ? value.phone : '') || ''}
              onChange={(e) => onChange({ ...(typeof value === 'object' ? value : {}), phone: e.target.value })}
              placeholder="Phone"
            />
            <Input
              value={(value && typeof value === 'object' ? value.title : '') || ''}
              onChange={(e) => onChange({ ...(typeof value === 'object' ? value : {}), title: e.target.value })}
              placeholder="Title/Role"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${lightenColor(primaryColor, 90)} 0%, ${lightenColor(primaryColor, 95)} 50%, white 100%)` }}>
        <div className="max-w-2xl mx-auto px-4 py-16">
          {branding.logoUrl && (
            <div className="flex justify-center mb-6">
              <img src={branding.logoUrl} alt={branding.companyName} className="h-16 object-contain" />
            </div>
          )}
          {branding.companyName && (
            <p className="text-center text-sm font-medium uppercase tracking-wider mb-2" style={{ color: primaryColor }}>
              {branding.companyName}
            </p>
          )}
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-6" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold mb-3">{branding.successHeading}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">{branding.successDescription}</p>
            </CardContent>
          </Card>
          <div className="text-center mt-8 text-xs text-muted-foreground">
            Powered by AgencyBoost
          </div>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Onboarding Form Not Configured</h2>
            <p className="text-muted-foreground">The onboarding form hasn't been set up yet. Please contact your account manager.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepConfig = steps[currentStep];

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${lightenColor(primaryColor, 90)} 0%, ${lightenColor(primaryColor, 95)} 50%, white 100%)` }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {branding.logoUrl && (
            <div className="flex justify-center mb-4">
              <img src={branding.logoUrl} alt={branding.companyName} className="h-14 object-contain" />
            </div>
          )}
          {branding.companyName && (
            <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: primaryColor }}>
              {branding.companyName}
            </p>
          )}
          <h1 className="text-2xl font-bold">{branding.welcomeHeading}</h1>
          {currentStep === 0 && (
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{branding.welcomeDescription}</p>
          )}
          {client.name && (
            <p className="text-sm text-muted-foreground mt-1">
              Prepared for <strong>{client.name}</strong>{client.company ? ` · ${client.company}` : ''}
            </p>
          )}
        </div>

        {/* Progress Stepper */}
        {totalSteps > 1 && (
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      idx < currentStep
                        ? 'text-white'
                        : idx === currentStep
                          ? 'text-white ring-4 ring-offset-2'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                    style={
                      idx <= currentStep
                        ? { backgroundColor: primaryColor, ...(idx === currentStep ? { ringColor: lightenColor(primaryColor, 70) } : {}) }
                        : {}
                    }
                  >
                    {idx < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-xs mt-1 max-w-[80px] text-center truncate ${idx === currentStep ? 'font-semibold' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {idx < totalSteps - 1 && (
                  <div
                    className="w-12 h-0.5 mx-1 mt-[-16px]"
                    style={{ backgroundColor: idx < currentStep ? primaryColor : '#e5e7eb' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="pt-8 pb-6 px-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{currentStepConfig.title}</h2>
              {currentStepConfig.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentStepConfig.description}</p>
              )}
            </div>

            <div className="space-y-5">
              {currentStepConfig.fields.map((fc, idx) => {
                if (fc.type === 'text_block') {
                  return (
                    <div key={fc.customFieldId || `text-block-${idx}`} className="prose prose-sm max-w-none">
                      {(fc.textContent || '').split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-2" />;
                        const h3Match = trimmed.match(/^###\s*(.+?)(?:\s*###)?$/);
                        if (h3Match) return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{h3Match[1]}</h4>;
                        const h2Match = trimmed.match(/^##\s*(.+?)(?:\s*##)?$/);
                        if (h2Match) return <h3 key={i} className="text-lg font-semibold mt-4 mb-1">{h2Match[1]}</h3>;
                        const h1Match = trimmed.match(/^#\s*(.+?)(?:\s*#)?$/);
                        if (h1Match) return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{h1Match[1]}</h2>;
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-gray-700">{formatInline(trimmed.slice(2))}</li>;
                        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{formatInline(trimmed)}</p>;
                      })}
                    </div>
                  );
                }
                return renderField(fc);
              })}
            </div>

            {currentStepConfig.fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No fields configured for this step.
              </div>
            )}

            {saveMessage && (
              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {saveMessage}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => saveProgressMutation.mutate()}
                  disabled={saveProgressMutation.isPending}
                >
                  {saveProgressMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save & Continue Later
                </Button>
                {totalSteps > 1 && (
                  <span className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                )}
                <Button
                  onClick={handleNext}
                  disabled={submitMutation.isPending}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white hover:opacity-90"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {isLastStep ? 'Submit' : 'Continue'}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-xs text-muted-foreground">
          Powered by AgencyBoost
        </div>
      </div>
    </div>
  );
}
