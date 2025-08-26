import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, MapPin, DollarSign, Clock, Briefcase, Mail, Phone, User, Link as LinkIcon, Send, Loader } from "lucide-react";
import { insertJobApplicationSchema, type InsertJobApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobApplicationFormProps {
  onSuccess?: () => void;
}

interface JobOpening {
  id: string;
  departmentName: string;
  positionTitle: string;
  employmentType: string;
  location?: string;
  compensation?: string;
  compensationType?: string;
  jobDescription?: string;
  benefits?: string;
  status: string;
  approvalStatus: string;
}

export default function JobApplicationForm({ onSuccess }: JobApplicationFormProps) {
  const { toast } = useToast();
  
  // Fetch available job openings
  const { data: jobOpenings, isLoading: jobOpeningsLoading } = useQuery<JobOpening[]>({
    queryKey: ["/api/job-openings/public"],
    retry: false,
  });

  const openPositions = jobOpenings?.filter(
    (job) => job.status === "open" && job.approvalStatus === "approved"
  ) || [];
  
  const form = useForm<InsertJobApplication>({
    resolver: zodResolver(insertJobApplicationSchema),
    defaultValues: {
      positionId: "",
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      resumeUrl: "",
      coverLetterUrl: "",
      portfolioUrl: "",
      salaryExpectation: null,
      experience: "",
      source: "website",
      notes: "",
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: InsertJobApplication) => {
      const response = await fetch(`/api/job-applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully. We'll be in touch soon!",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
      console.error("Application submission error:", error);
    },
  });

  const onSubmit = (data: InsertJobApplication) => {
    console.log("Submitting application:", data);
    submitApplicationMutation.mutate(data);
  };

  // Get selected position details
  const selectedPositionId = form.watch("positionId");
  const selectedPosition = openPositions.find(p => p.id === selectedPositionId);

  if (jobOpeningsLoading) {
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
                    {selectedPosition.jobDescription}
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
              {/* Position Selection - FIRST FIELD */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Briefcase className="h-4 w-4" />
                  <h3 className="font-semibold">Position Selection</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="positionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Position Applied For *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
              </div>

              <Separator />

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-4 w-4" />
                  <h3 className="font-semibold">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-applicant-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="applicantEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your.email@example.com" 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-applicant-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="applicantPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 123-4567" 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-applicant-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Experience Level */}
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-experience">
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Entry Level">Entry Level (0-2 years)</SelectItem>
                            <SelectItem value="Mid Level">Mid Level (3-5 years)</SelectItem>
                            <SelectItem value="Senior Level">Senior Level (6+ years)</SelectItem>
                            <SelectItem value="Executive Level">Executive Level</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Document Links Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-semibold">Documents & Portfolio</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Resume URL */}
                  <FormField
                    control={form.control}
                    name="resumeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Resume/CV URL *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://drive.google.com/..." 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-resume-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cover Letter URL */}
                  <FormField
                    control={form.control}
                    name="coverLetterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Cover Letter URL
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://..." 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-cover-letter-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Portfolio URL */}
                  <FormField
                    control={form.control}
                    name="portfolioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Portfolio/Website URL
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://..." 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-portfolio-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Additional Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="font-semibold">Additional Information</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Salary Expectation */}
                  <FormField
                    control={form.control}
                    name="salaryExpectation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Salary Expectation (Annual USD)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="75000" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            data-testid="input-salary-expectation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us why you're interested in this position or any additional information you'd like us to know..."
                            rows={4}
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={submitApplicationMutation.isPending || !selectedPositionId}
                  className="min-w-[140px]"
                  data-testid="button-submit-application"
                >
                  {submitApplicationMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
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