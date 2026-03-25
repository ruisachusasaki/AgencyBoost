import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, Clock, UserPlus, Building2, Download, Upload, FileText, X, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select' | 'file';
  placeholder?: string;
  required: boolean;
  options?: string[];
  templateFileUrl?: string;
  templateFileName?: string;
  acceptedFileTypes?: string;
  order: number;
}

interface OnboardingBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  welcomeHeading: string;
  welcomeDescription: string;
  submitButtonText: string;
  successHeading: string;
  successDescription: string;
}

interface OnboardingFormConfig {
  fields: FormField[];
  branding?: OnboardingBranding;
}

const defaultBranding: OnboardingBranding = {
  companyName: '',
  logoUrl: '',
  primaryColor: '#16a34a',
  welcomeHeading: 'Welcome to the Team!',
  welcomeDescription: "We're excited to have you join us! Please complete the onboarding form below to help us get everything set up for your first day.",
  submitButtonText: 'Submit Onboarding Information',
  successHeading: 'Onboarding Information Submitted!',
  successDescription: 'Thank you for completing your onboarding form. Our HR team will review your information and contact you with next steps.',
};

const lightenColor = (hex: string, amount: number): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Default fields that match the form editor defaults
const defaultFormFields: FormField[] = [
  {
    id: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
    order: 0
  },
  {
    id: 'address',
    label: 'Address',
    type: 'textarea',
    placeholder: 'Enter your full address',
    required: true,
    order: 1
  },
  {
    id: 'phone_number',
    label: 'Phone Number',
    type: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: true,
    order: 2
  },
  {
    id: 'date_of_birth',
    label: 'Date of Birth',
    type: 'date',
    required: true,
    order: 3
  },
  {
    id: 'start_date',
    label: 'Start Date',
    type: 'date',
    required: true,
    order: 4
  },
  {
    id: 'emergency_contact_name',
    label: 'Emergency Contact Name',
    type: 'text',
    placeholder: 'Enter emergency contact name',
    required: true,
    order: 5
  },
  {
    id: 'emergency_contact_number',
    label: 'Emergency Contact Number',
    type: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: true,
    order: 6
  },
  {
    id: 'emergency_contact_relationship',
    label: 'Emergency Contact Relationship',
    type: 'select',
    required: true,
    options: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'],
    order: 7
  },
  {
    id: 'tshirt_size',
    label: 'T-shirt Size',
    type: 'select',
    required: true,
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    order: 8
  },
  {
    id: 'payment_platform',
    label: 'Preferred Payment Platform',
    type: 'select',
    required: true,
    options: ['Direct Deposit', 'PayPal', 'Venmo', 'Zelle', 'Check'],
    order: 9
  },
  {
    id: 'payment_email',
    label: 'Payment Email (if applicable)',
    type: 'email',
    placeholder: 'Enter email for PayPal, Venmo, etc.',
    required: false,
    order: 10
  }
];

export default function OnboardingPage() {
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [fileUploads, setFileUploads] = useState<Record<string, { url: string; name: string }>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Fetch form configuration
  const { data: configData, isLoading } = useQuery<OnboardingFormConfig>({
    queryKey: ["/api/new-hire-onboarding-form-config"],
    retry: false,
  });

  const branding: OnboardingBranding = configData?.branding
    ? { ...defaultBranding, ...configData.branding }
    : defaultBranding;

  // Create dynamic form schema based on configuration
  const createFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach(field => {
      if (field.type === 'file') {
        // File fields are validated separately via fileUploads state
        // We still store the URL as a string in the form data
        let fieldSchema: z.ZodTypeAny = z.string();
        if (!field.required) {
          fieldSchema = fieldSchema.optional().or(z.literal(''));
        }
        schemaFields[field.id] = fieldSchema;
        return;
      }

      let fieldSchema: z.ZodTypeAny;
      
      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Please enter a valid email address');
          break;
        case 'phone':
          fieldSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number');
          break;
        case 'date':
          fieldSchema = z.string().min(1, 'Please select a date');
          break;
        default:
          fieldSchema = z.string().min(1, `${field.label} is required`);
      }
      
      if (!field.required) {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
      
      schemaFields[field.id] = fieldSchema;
    });
    
    return z.object(schemaFields);
  };

  const fields = (configData?.fields && configData.fields.length > 0) 
    ? configData.fields.sort((a, b) => a.order - b.order) 
    : defaultFormFields;
  const formSchema = createFormSchema(fields);
  
  // Create form with proper defaultValues and resolver
  const defaultValues = fields.reduce((acc, field) => {
    acc[field.id] = '';
    return acc;
  }, {} as Record<string, string>);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Reset form when fields change (after config loads)
  useEffect(() => {
    if (fields.length > 0) {
      const newDefaultValues = fields.reduce((acc, field) => {
        acc[field.id] = '';
        return acc;
      }, {} as Record<string, string>);
      form.reset(newDefaultValues);
    }
  }, [fields.map(f => f.id).join('|'), form]);

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      // Map form data to database schema
      const submissionData = {
        name: formData.name || '',
        address: formData.address || null,
        phoneNumber: formData.phone_number || null,
        dateOfBirth: formData.date_of_birth ? new Date(formData.date_of_birth) : null,
        startDate: formData.start_date ? new Date(formData.start_date) : null,
        emergencyContactName: formData.emergency_contact_name || null,
        emergencyContactNumber: formData.emergency_contact_number || null,
        emergencyContactRelationship: formData.emergency_contact_relationship || null,
        tshirtSize: formData.tshirt_size || null,
        paymentPlatform: formData.payment_platform || null,
        paymentEmail: formData.payment_email || null,
        customFieldData: formData // Store all form data for custom fields
      };

      return apiRequest('POST', '/api/new-hire-onboarding-submissions', submissionData);
    },
    onSuccess: () => {
      setSubmissionComplete(true);
      toast({
        title: "Success",
        variant: "default",
        description: "Your onboarding information has been submitted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit onboarding information. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (fieldId: string, file: File) => {
    setUploadingFields(prev => ({ ...prev, [fieldId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/onboarding-file-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      setFileUploads(prev => ({ ...prev, [fieldId]: { url: result.fileUrl, name: file.name } }));
      form.setValue(fieldId, result.fileUrl);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const removeFileUpload = (fieldId: string) => {
    setFileUploads(prev => {
      const updated = { ...prev };
      delete updated[fieldId];
      return updated;
    });
    form.setValue(fieldId, '');
  };

  const onSubmit = (data: Record<string, string>) => {
    // Validate required file fields
    const fileFields = fields.filter(f => f.type === 'file' && f.required);
    for (const field of fileFields) {
      if (!fileUploads[field.id]) {
        toast({
          title: "Missing Upload",
          description: `Please upload a file for "${field.label}"`,
          variant: "destructive",
        });
        return;
      }
    }

    // Merge file upload URLs into form data
    const mergedData = { ...data };
    Object.entries(fileUploads).forEach(([fieldId, upload]) => {
      mergedData[fieldId] = upload.url;
      mergedData[`${fieldId}_filename`] = upload.name;
    });

    submitMutation.mutate(mergedData);
  };

  const renderFormField = (field: FormField) => {
    if (field.type === 'file') {
      return (
        <div key={field.id} className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium flex items-center gap-1">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.templateFileUrl && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Download className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">
                  Download the template, fill it out, then upload it below
                </p>
                <a
                  href={`/api/onboarding-template-download?fileUrl=${encodeURIComponent(field.templateFileUrl)}`}
                  download={field.templateFileName || 'template'}
                  className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 mt-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {field.templateFileName || 'Download Template'}
                </a>
              </div>
            </div>
          )}

          {fileUploads[field.id] ? (
            <div className="flex items-center gap-2 p-3 border border-green-200 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-800 flex-1 truncate">
                {fileUploads[field.id].name}
              </span>
              <button
                type="button"
                onClick={() => removeFileUpload(field.id)}
                className="p-1 hover:bg-green-100 rounded"
              >
                <X className="h-4 w-4 text-green-600" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                className="hidden"
                accept={field.acceptedFileTypes || '.pdf,.doc,.docx,.jpg,.png'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(field.id, file);
                  e.target.value = '';
                }}
                disabled={uploadingFields[field.id]}
              />
              <div className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors">
                {uploadingFields[field.id] ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">
                      {field.placeholder || 'Click to upload your file'}
                    </span>
                  </>
                )}
              </div>
            </label>
          )}
        </div>
      );
    }

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.id}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  rows={3}
                  data-testid={`input-${field.id}`}
                  {...formField}
                />
              ) : field.type === 'select' ? (
                <Select 
                  value={formField.value} 
                  onValueChange={formField.onChange}
                  data-testid={`select-${field.id}`}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Please select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'date' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formField.value && "text-muted-foreground"
                      )}
                      data-testid={`input-${field.id}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formField.value
                        ? format(new Date(formField.value + "T00:00:00"), "MMM d, yyyy")
                        : field.placeholder || "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value ? new Date(formField.value + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        formField.onChange(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      captionLayout="dropdown-buttons"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                      classNames={{ caption_label: "hidden" }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  type={field.type === 'email' ? 'email' : 'text'}
                  placeholder={field.placeholder}
                  data-testid={`input-${field.id}`}
                  {...formField}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
          <p className="text-gray-600">Loading onboarding form...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${lightenColor(branding.primaryColor, 210)} 0%, ${lightenColor(branding.primaryColor, 190)} 100%)`
      }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            {(branding.logoUrl || branding.companyName) && (
              <div className="flex items-center justify-center gap-3 mb-4">
                {branding.logoUrl && (
                  <img src={branding.logoUrl} alt="Company logo" className="h-12 w-auto object-contain" />
                )}
                {branding.companyName && (
                  <span className="text-xl font-semibold text-gray-800">{branding.companyName}</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: lightenColor(branding.primaryColor, 200) }}
              >
                <UserPlus className="h-8 w-8" style={{ color: branding.primaryColor }} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{branding.welcomeHeading}</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {branding.welcomeDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submissionComplete ? (
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 mb-4" style={{ color: branding.primaryColor }}>
                <CheckCircle className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">{branding.successHeading}</h2>
              </div>
              <p className="text-gray-600 text-lg mb-6">
                {branding.successDescription}
              </p>
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: lightenColor(branding.primaryColor, 220),
                  borderColor: lightenColor(branding.primaryColor, 180),
                }}
              >
                <p className="font-medium" style={{ color: branding.primaryColor }}>What happens next?</p>
                <ul className="mt-2 text-left list-disc list-inside space-y-1" style={{ color: branding.primaryColor }}>
                  <li>HR will review your information within 1-2 business days</li>
                  <li>You'll receive an email with your account setup instructions</li>
                  <li>We'll schedule your first day orientation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" style={{ color: branding.primaryColor }} />
                New Hire Onboarding Form
              </CardTitle>
              <CardDescription>
                Please fill out all required fields to complete your onboarding process. 
                This information will help us set up your account and prepare for your arrival.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fields.map(field => renderFormField(field))}
                  </div>
                  
                  <div className="pt-6 border-t">
                    <Button 
                      type="submit" 
                      className="w-full text-white" 
                      style={{ backgroundColor: branding.primaryColor }}
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-onboarding"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          {branding.submitButtonText}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}