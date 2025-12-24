import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'department-dropdown' | 'position-dropdown';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface OffboardingFormConfig {
  fields: FormField[];
}

const defaultFormFields: FormField[] = [
  { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Enter employee full name', required: true, order: 0 },
  { id: 'department_team', label: 'Department/Team', type: 'department-dropdown', required: true, order: 1 },
  { id: 'position', label: 'Position', type: 'position-dropdown', required: true, order: 2 },
  { id: 'employment_end_date', label: 'Employment END Date', type: 'date', required: true, order: 3 },
  { id: 'account_suspension_date', label: 'When should their accounts be suspended?', type: 'date', required: true, order: 4 },
  { id: 'pay_off_ramp', label: 'What is their pay Off-Ramp?', type: 'text', placeholder: 'Describe the pay off-ramp plan', required: false, order: 5 }
];

export default function OffboardingForm() {
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch form configuration
  const { data: configData, isLoading: configLoading } = useQuery<OffboardingFormConfig>({
    queryKey: ["/api/offboarding-form-config"],
    retry: false,
  });

  // Fetch departments
  const { data: departmentsData = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch all positions
  const { data: allPositionsData = [] } = useQuery<any[]>({
    queryKey: ["/api/positions"],
  });

  // Filter positions based on selected department
  const filteredPositions = selectedDepartmentId
    ? allPositionsData.filter(pos => pos.departmentId === selectedDepartmentId)
    : [];

  // Create dynamic form schema based on configuration
  const createFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (field.type) {
        case 'date':
          fieldSchema = z.string().min(1, 'Please select a date');
          break;
        case 'department-dropdown':
        case 'position-dropdown':
        case 'select':
          fieldSchema = z.string().min(1, `${field.label} is required`);
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
  }, {} as Record<string, any>);
  
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
      }, {} as Record<string, any>);
      form.reset(newDefaultValues);
    }
  }, [fields.map(f => f.id).join('|'), form]);

  // Watch department field to update positions
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'department_team' && value.department_team) {
        setSelectedDepartmentId(value.department_team);
        // Reset position when department changes
        form.setValue('position', '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      // Find department name from ID
      const selectedDept = departmentsData.find(dept => dept.id === formData.department_team);
      const selectedPos = allPositionsData.find(pos => pos.id === formData.position);

      // Map snake_case field IDs to camelCase property names expected by the schema
      const submissionData = {
        fullName: formData.full_name || '',
        departmentTeam: selectedDept?.name || null,
        position: selectedPos?.name || null,
        employmentEndDate: formData.employment_end_date || null,
        accountSuspensionDate: formData.account_suspension_date || null,
        payOffRamp: formData.pay_off_ramp || null,
        customFieldData: formData
      };

      return apiRequest('POST', '/api/offboarding-submissions', submissionData);
    },
    onSuccess: () => {
      setSubmissionComplete(true);
      form.reset();
      setSelectedDepartmentId('');
      queryClient.invalidateQueries({ queryKey: ['/api/offboarding-submissions'] });
      toast({
        title: "Success",
        variant: "success",
        description: "Offboarding form has been submitted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit offboarding form. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: Record<string, any>) => {
    submitMutation.mutate(data);
  };

  if (configLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading form...</p>
        </CardContent>
      </Card>
    );
  }

  if (submissionComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Offboarding Form Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              The offboarding form has been submitted successfully. It will be processed by the HR team.
            </p>
            <Button onClick={() => setSubmissionComplete(false)} data-testid="button-submit-another">
              Submit Another Offboarding Form
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offboarding Form</CardTitle>
        <CardDescription>Please fill out all required fields</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={field.id}
                  render={({ field: formField }) => (
                    <FormItem className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <FormLabel>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        {field.type === 'textarea' ? (
                          <Textarea
                            {...formField}
                            placeholder={field.placeholder}
                            data-testid={`input-${field.id}`}
                          />
                        ) : field.type === 'date' ? (
                          <Input
                            {...formField}
                            type="date"
                            data-testid={`input-${field.id}`}
                          />
                        ) : field.type === 'department-dropdown' ? (
                          <Select
                            value={formField.value}
                            onValueChange={formField.onChange}
                          >
                            <SelectTrigger data-testid={`select-${field.id}`}>
                              <SelectValue placeholder="Select Department/Team" />
                            </SelectTrigger>
                            <SelectContent>
                              {departmentsData.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'position-dropdown' ? (
                          <Select
                            value={formField.value}
                            onValueChange={formField.onChange}
                            disabled={!selectedDepartmentId}
                          >
                            <SelectTrigger data-testid={`select-${field.id}`}>
                              <SelectValue placeholder={selectedDepartmentId ? "Select Position" : "Select Department first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredPositions.map((pos: any) => (
                                <SelectItem key={pos.id} value={pos.id}>
                                  {pos.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'select' ? (
                          <Select
                            value={formField.value}
                            onValueChange={formField.onChange}
                          >
                            <SelectTrigger data-testid={`select-${field.id}`}>
                              <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options && field.options.length > 0 ? (
                                field.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))
                              ) : null}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            {...formField}
                            type="text"
                            placeholder={field.placeholder}
                            data-testid={`input-${field.id}`}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedDepartmentId('');
                }}
                data-testid="button-reset"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-submit"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Offboarding Form"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
