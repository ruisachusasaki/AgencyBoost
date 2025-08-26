import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, MapPin, DollarSign, Clock, Briefcase, Mail, Phone, User, Link as LinkIcon, Send, Loader } from "lucide-react";
import { insertJobApplicationSchema, type InsertJobApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Utility function to strip HTML tags and convert to plain text
function stripHtml(html: string): string {
  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

interface JobApplicationFormProps {
  onSuccess?: () => void;
  preSelectedPosition?: string;
}

interface JobOpening {
  id: string;
  positionTitle: string;
  departmentName: string;
  employmentType: string;
  location?: string;
  compensation?: number;
  compensationType?: string;
  jobDescription?: string;
  benefits?: string;
}

export default function JobApplicationForm({ onSuccess, preSelectedPosition }: JobApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch available job openings
  const { data: jobOpenings, isLoading: jobOpeningsLoading } = useQuery<JobOpening[]>({
    queryKey: ["/api/job-openings/public"],
    retry: false,
  });

  // Fetch form configuration
  const { data: formConfig, isLoading: formConfigLoading } = useQuery({
    queryKey: ["/api/job-application-form-config"],
    retry: false,
  });

  // Backend already filters for open and approved positions
  const openPositions = jobOpenings || [];
  
  const form = useForm<InsertJobApplication>({
    resolver: zodResolver(insertJobApplicationSchema),
    defaultValues: {
      positionId: preSelectedPosition || "",
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      resumeUrl: "",
      coverLetterUrl: "",
      portfolioUrl: "",
      experience: "",
      salaryExpectation: "",
      notes: "",
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: InsertJobApplication) => {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your job application has been submitted successfully. We'll be in touch soon!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Application submission error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertJobApplication) => {
    console.log("Submitting application data:", data);
    
    // Map the form data to include custom fields
    const formValues = form.getValues();
    console.log("All form values:", formValues);
    
    // Extract custom field values
    const customFieldData: Record<string, any> = {};
    configuredFields.forEach((field: any) => {
      if (field.id.startsWith('field_') || !['job_opening', 'full_name', 'email', 'phone', 'resume_url', 'cover_letter_url', 'portfolio_url', 'experience_level', 'salary_expectation', 'notes'].includes(field.id)) {
        const value = formValues[field.id as keyof typeof formValues];
        if (value) {
          customFieldData[field.id] = value;
        }
      }
    });
    
    console.log("Custom field data:", customFieldData);
    
    const submitData = {
      ...data,
      customFieldData
    };
    
    console.log("Final submit data:", submitData);
    submitApplicationMutation.mutate(submitData);
  };

  // Get selected position details
  const selectedPositionId = form.watch("positionId");
  const selectedPosition = openPositions.find(p => p.id === selectedPositionId);

  if (jobOpeningsLoading || formConfigLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Loading job openings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get configured form fields, sorted by order
  const configuredFields = (formConfig?.fields || []).sort((a: any, b: any) => a.order - b.order);

  console.log("Form configuration:", formConfig);
  console.log("Configured fields:", configuredFields);

  return (
    <div className="space-y-6">
      {/* Selected Position Details */}
      {selectedPosition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {selectedPosition.positionTitle}
            </CardTitle>
            <CardDescription>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <Badge variant="secondary">{selectedPosition.departmentName}</Badge>
                <Badge variant="outline">{selectedPosition.employmentType}</Badge>
                {selectedPosition.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {selectedPosition.location}
                  </div>
                )}
                {selectedPosition.compensation && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    {selectedPosition.compensation} {selectedPosition.compensationType === 'hourly' ? '/hour' : '/year'}
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          
          {(selectedPosition.jobDescription || selectedPosition.benefits) && (
            <CardContent className="space-y-4">
              {selectedPosition.jobDescription && (
                <div>
                  <h4 className="font-semibold mb-2">Job Description</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {stripHtml(selectedPosition.jobDescription)}
                  </div>
                </div>
              )}
              
              {selectedPosition.benefits && (
                <div>
                  <h4 className="font-semibold mb-2">Benefits</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPosition.benefits}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Job Application</CardTitle>
          <CardDescription>
            Please select a position and fill out the form below. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dynamic Form Fields */}
              {configuredFields.map((field: any, index: number) => {
                // Render form field based on configured type
                return (
                  <div key={field.id} className="space-y-4">
                    {field.type === 'job_selection' && (
                      <FormField
                        control={form.control}
                        name="positionId"
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              {field.label} {field.required && '*'}
                            </FormLabel>
                            <Select onValueChange={formField.onChange} value={formField.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-position">
                                  <SelectValue placeholder="Select a position to apply for" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {openPositions.length > 0 ? (
                                  openPositions.map((position) => (
                                    <SelectItem key={position.id} value={position.id}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{position.positionTitle}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {position.departmentName} • {position.employmentType}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-positions" disabled>
                                    No open positions available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'phone') && (
                      <FormField
                        control={form.control}
                        name={field.id === 'full_name' ? 'applicantName' : 
                              field.id === 'email' ? 'applicantEmail' : 
                              field.id === 'phone' ? 'applicantPhone' : 
                              field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              {field.id === 'full_name' && <User className="h-4 w-4" />}
                              {field.id === 'email' && <Mail className="h-4 w-4" />}
                              {field.id === 'phone' && <Phone className="h-4 w-4" />}
                              {field.label} {field.required && '*'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                {...formField}
                                value={formField.value || ""} 
                                data-testid={`input-${field.id}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.type === 'url' && (
                      <FormField
                        control={form.control}
                        name={field.id === 'resume_url' ? 'resumeUrl' : 
                              field.id === 'cover_letter' ? 'coverLetterUrl' : 
                              field.id === 'portfolio_url' ? 'portfolioUrl' : 
                              field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <LinkIcon className="h-4 w-4" />
                              {field.label} {field.required && '*'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="url"
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} URL`}
                                {...formField}
                                value={formField.value || ""} 
                                data-testid={`input-${field.id}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <FormField
                        control={form.control}
                        name={field.id === 'notes' ? 'notes' : field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>
                              {field.label} {field.required && '*'}
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                className="min-h-[100px]"
                                {...formField}
                                value={formField.value || ""} 
                                data-testid={`textarea-${field.id}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.type === 'select' && (
                      <FormField
                        control={form.control}
                        name={field.id === 'experience_level' ? 'experience' : field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>
                              {field.label} {field.required && '*'}
                            </FormLabel>
                            <Select onValueChange={formField.onChange} value={formField.value}>
                              <FormControl>
                                <SelectTrigger data-testid={`select-${field.id}`}>
                                  <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {field.options?.map((option: string) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.type === 'number' && (
                      <FormField
                        control={form.control}
                        name={field.id === 'salary_expectation' ? 'salaryExpectation' : field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              {field.label} {field.required && '*'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                {...formField}
                                value={formField.value || ""} 
                                data-testid={`input-${field.id}`}
                                onChange={(e) => formField.onChange(e.target.value || "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Add separator between fields (not after last field) */}
                    {index < configuredFields.length - 1 && (
                      <div className="border-t pt-4 mt-6" />
                    )}
                  </div>
                );
              })}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={submitApplicationMutation.isPending}
                  className="min-w-[120px]"
                  data-testid="button-submit-application"
                >
                  {submitApplicationMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Submit Application</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}