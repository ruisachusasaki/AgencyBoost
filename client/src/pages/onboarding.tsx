import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, Clock, UserPlus, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface OnboardingFormConfig {
  fields: FormField[];
}

export default function OnboardingPage() {
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const { toast } = useToast();

  // Fetch form configuration
  const { data: configData, isLoading } = useQuery<OnboardingFormConfig>({
    queryKey: ["/api/new-hire-onboarding-form-config"],
    retry: false,
  });

  // Create dynamic form schema based on configuration
  const createFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach(field => {
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

  const fields = configData?.fields?.sort((a, b) => a.order - b.order) || [];
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

  const onSubmit = (data: Record<string, string>) => {
    submitMutation.mutate(data);
  };

  const renderFormField = (field: FormField) => {
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
              ) : (
                <Input
                  type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-green-600" />
          <p className="text-gray-600">Loading onboarding form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Welcome to the Team!</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're excited to have you join us! Please complete the onboarding form below 
              to help us get everything set up for your first day.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submissionComplete ? (
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Onboarding Information Submitted!</h2>
              </div>
              <p className="text-gray-600 text-lg mb-6">
                Thank you for completing your onboarding form. Our HR team will review your information 
                and contact you with next steps.
              </p>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">What happens next?</p>
                <ul className="text-green-700 mt-2 text-left list-disc list-inside space-y-1">
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
                <Building2 className="h-6 w-6 text-green-600" />
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
                      className="w-full bg-green-600 hover:bg-green-700" 
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
                          Submit Onboarding Information
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