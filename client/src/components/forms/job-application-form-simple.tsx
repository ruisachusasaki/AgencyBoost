import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin, DollarSign, Clock, Briefcase, Send, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Utility function to strip HTML tags
function stripHtml(html: string): string {
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

export default function JobApplicationFormSimple({ onSuccess, preSelectedPosition }: JobApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({
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
  });
  
  // Fetch available job openings
  const { data: jobOpenings, isLoading: jobOpeningsLoading } = useQuery<JobOpening[]>({
    queryKey: ["/api/job-openings/public"],
    retry: false,
  });

  // Fetch form configuration
  const { data: formConfig, isLoading: formConfigLoading } = useQuery<{id: string, fields: any[]}>({
    queryKey: ["/api/job-application-form-config"],
    retry: false,
  });

  const openPositions = jobOpenings || [];
  
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting application:", data);
      const response = await fetch("/api/job-applications", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
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
      setFormData({
        positionId: "",
        applicantName: "",
        applicantEmail: "",
        applicantPhone: "",
        resumeUrl: "",
        coverLetterUrl: "",
        portfolioUrl: "",
        experience: "",
        salaryExpectation: "",
        notes: "",
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted!", formData);
    
    // Extract custom field values
    const customFieldData: Record<string, any> = {};
    const configuredFields = (formConfig?.fields || []).sort((a: any, b: any) => a.order - b.order);
    
    configuredFields.forEach((field: any) => {
      if (field.id.startsWith('field_')) {
        const value = formData[field.id];
        if (value) {
          customFieldData[field.id] = value;
        }
      }
    });
    
    const submitData = {
      ...formData,
      customFieldData
    };
    
    console.log("Final submit data:", submitData);
    submitApplicationMutation.mutate(submitData);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Get selected position details
  const selectedPosition = openPositions.find(p => p.id === formData.positionId);

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

  const configuredFields = (formConfig?.fields || []).sort((a: any, b: any) => a.order - b.order);

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Form Fields */}
            {configuredFields.map((field: any, index: number) => (
              <div key={field.id} className="space-y-4">
                {field.type === 'job_selection' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Briefcase className="h-4 w-4 inline mr-2" />
                      {field.label} {field.required && '*'}
                    </label>
                    <Select 
                      value={formData.positionId} 
                      onValueChange={(value) => handleFieldChange('positionId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position to apply for" />
                      </SelectTrigger>
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
                  </div>
                )}

                {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    <Input
                      type={field.type === 'phone' ? 'tel' : field.type}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={formData[
                        field.id === 'full_name' ? 'applicantName' : 
                        field.id === 'email' ? 'applicantEmail' : 
                        field.id === 'phone' ? 'applicantPhone' : 
                        field.id === 'resume_url' ? 'resumeUrl' :
                        field.id === 'cover_letter_url' ? 'coverLetterUrl' :
                        field.id === 'portfolio_url' ? 'portfolioUrl' : 
                        field.id
                      ] || ""}
                      onChange={(e) => handleFieldChange(
                        field.id === 'full_name' ? 'applicantName' : 
                        field.id === 'email' ? 'applicantEmail' : 
                        field.id === 'phone' ? 'applicantPhone' : 
                        field.id === 'resume_url' ? 'resumeUrl' :
                        field.id === 'cover_letter_url' ? 'coverLetterUrl' :
                        field.id === 'portfolio_url' ? 'portfolioUrl' : 
                        field.id,
                        e.target.value
                      )}
                      required={field.required}
                    />
                  </div>
                )}

                {field.type === 'textarea' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    <Textarea
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={formData[field.id === 'notes' ? 'notes' : field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id === 'notes' ? 'notes' : field.id, e.target.value)}
                      required={field.required}
                    />
                  </div>
                )}

                {field.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    <Select 
                      value={formData[field.id === 'experience_level' ? 'experience' : field.id] || ""} 
                      onValueChange={(value) => handleFieldChange(field.id === 'experience_level' ? 'experience' : field.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {field.type === 'number' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <DollarSign className="h-4 w-4 inline mr-2" />
                      {field.label} {field.required && '*'}
                    </label>
                    <Input
                      type="number"
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={formData[field.id === 'salary_expectation' ? 'salaryExpectation' : field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id === 'salary_expectation' ? 'salaryExpectation' : field.id, e.target.value)}
                      required={field.required}
                    />
                  </div>
                )}

                {/* Add separator between fields (not after last field) */}
                {index < configuredFields.length - 1 && (
                  <div className="border-t pt-4 mt-6" />
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                disabled={submitApplicationMutation.isPending}
                className="min-w-[120px]"
                onClick={() => console.log("Submit button clicked - simple form!")}
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
        </CardContent>
      </Card>
    </div>
  );
}