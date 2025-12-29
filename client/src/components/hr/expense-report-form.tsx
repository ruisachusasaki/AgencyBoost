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
import { CheckCircle, DollarSign, Upload, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'currency' | 'file' | 'user-dropdown';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface ExpenseReportFormConfig {
  fields: FormField[];
}

const defaultFormFields: FormField[] = [
  { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', required: true, order: 0 },
  { id: 'supervisor', label: 'Your Supervisor', type: 'user-dropdown', required: true, order: 1 },
  { id: 'purpose', label: 'Purpose of the Expense', type: 'text', placeholder: 'Enter the purpose of this expense', required: true, order: 2 },
  { id: 'expense_type', label: 'Expense Type', type: 'select', required: true, options: ['Hotel', 'Fuel', 'Travel', 'Meals', 'Education/Training', 'Other'], order: 3 },
  { id: 'expense_date', label: 'Expense Date', type: 'date', required: true, order: 4 },
  { id: 'expense_total', label: 'Expense(s) Total', type: 'currency', placeholder: '0.00', required: true, order: 5 },
  { id: 'department_team', label: 'Department/Team', type: 'select', required: true, order: 6 },
  { id: 'client', label: 'Client', type: 'select', required: false, order: 7 },
  { id: 'reimbursement', label: 'Reimbursement', type: 'select', required: true, options: ['Yes', 'No', 'Not Sure'], order: 8 },
  { id: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: ["Joe's Card", "Che's Card", "Personal Card"], order: 9 },
  { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Add any additional notes or details', required: false, order: 10 },
  { id: 'receipts', label: 'Receipt(s)', type: 'file', required: false, order: 11 }
];

export default function ExpenseReportForm() {
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch form configuration
  const { data: configData, isLoading: configLoading } = useQuery<ExpenseReportFormConfig>({
    queryKey: ["/api/expense-report-form-config"],
    retry: false,
  });

  // Fetch staff for supervisor dropdown
  const { data: staffData = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch teams for department dropdown
  const { data: teamsData = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch clients for client dropdown
  const { data: clientsData } = useQuery<any>({
    queryKey: ["/api/clients"],
  });

  const clients = clientsData?.clients || [];

  // Create dynamic form schema based on configuration
  const createFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (field.type) {
        case 'currency':
          fieldSchema = z.string().refine(
            (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
            'Please enter a valid amount'
          );
          break;
        case 'date':
          fieldSchema = z.string().min(1, 'Please select a date');
          break;
        case 'user-dropdown':
        case 'select':
          fieldSchema = z.string().min(1, `${field.label} is required`);
          break;
        case 'file':
          fieldSchema = z.any();
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

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      const submissionData = {
        fullName: formData.full_name || '',
        supervisor: formData.supervisor || null,
        purpose: formData.purpose || '',
        expenseType: formData.expense_type || null,
        expenseDate: formData.expense_date ? new Date(formData.expense_date) : null,
        expenseTotal: formData.expense_total || null,
        departmentTeam: formData.department_team || null,
        client: formData.client || null,
        reimbursement: formData.reimbursement || null,
        paymentMethod: formData.payment_method || null,
        notes: formData.notes || null,
        receipts: formData.receipts || null,
        customFieldData: formData
      };

      return apiRequest('POST', '/api/expense-report-submissions', submissionData);
    },
    onSuccess: () => {
      setSubmissionComplete(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/expense-report-submissions'] });
      toast({
        title: "Success",
        variant: "success",
        description: "Your expense report has been submitted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit expense report. Please try again.",
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
            <h3 className="text-xl font-semibold mb-2">Expense Report Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              Your expense report has been submitted successfully. It will be reviewed by the accounting team.
            </p>
            <Button onClick={() => setSubmissionComplete(false)} data-testid="button-submit-another">
              Submit Another Expense Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Report Form</CardTitle>
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
                                {formField.value ? format(new Date(formField.value), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formField.value ? new Date(formField.value) : undefined}
                                onSelect={(date) => formField.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : field.type === 'currency' ? (
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...formField}
                              type="text"
                              placeholder={field.placeholder}
                              className="pl-8"
                              data-testid={`input-${field.id}`}
                            />
                          </div>
                        ) : field.type === 'file' ? (
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <Input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              className="max-w-sm mx-auto"
                              data-testid={`input-${field.id}`}
                            />
                            <p className="text-sm text-muted-foreground mt-2">Upload receipts (images or PDF)</p>
                          </div>
                        ) : field.type === 'user-dropdown' ? (
                          <Select
                            value={formField.value}
                            onValueChange={formField.onChange}
                          >
                            <SelectTrigger data-testid={`select-${field.id}`}>
                              <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {staffData.map((staff: any) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.firstName} {staff.lastName}
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
                                // Use configured options from Settings
                                field.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))
                              ) : field.id === 'department_team' ? (
                                // Fallback to teams data if no options configured
                                teamsData.map((team: any) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))
                              ) : field.id === 'client' ? (
                                // Fallback to clients data if no options configured
                                clients.map((client: any) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.company || client.name}
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
                onClick={() => form.reset()}
                data-testid="button-reset"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Expense Report"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
