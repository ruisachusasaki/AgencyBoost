import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, MapPin, DollarSign, Clock, Briefcase, Mail, Phone, User, Link as LinkIcon } from "lucide-react";
import { insertJobApplicationSchema, type InsertJobApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobApplicationFormProps {
  position: {
    id: string;
    title: string;
    department: string;
    employmentType: string;
    location?: string;
    compensation?: string;
    compensationType?: string;
    jobDescription?: string;
    benefits?: string;
  };
  onSuccess?: () => void;
}

export default function JobApplicationForm({ position, onSuccess }: JobApplicationFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertJobApplication>({
    resolver: zodResolver(insertJobApplicationSchema),
    defaultValues: {
      positionId: position.id,
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

  return (
    <div className="space-y-6">
      {/* Position Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {position.title}
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Badge variant="secondary">{position.department}</Badge>
              <Badge variant="outline">{position.employmentType}</Badge>
              {position.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {position.location}
                </div>
              )}
              {position.compensation && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {position.compensation} {position.compensationType === 'hourly' ? '/hour' : '/year'}
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        
        {(position.jobDescription || position.benefits) && (
          <CardContent className="space-y-4">
            {position.jobDescription && (
              <div>
                <h4 className="font-semibold mb-2">Job Description</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {position.jobDescription}
                </div>
              </div>
            )}
            
            {position.benefits && (
              <div>
                <h4 className="font-semibold mb-2">Benefits</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {position.benefits}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Separator />

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Apply for this Position</CardTitle>
          <CardDescription>
            Fill out the form below to submit your application. All required fields are marked with *.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="applicantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Full Name *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field} 
                          data-testid="input-applicant-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your@email.com" 
                          {...field} 
                          data-testid="input-applicant-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="applicantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-applicant-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-experience">
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                          <SelectItem value="mid">Mid-level (2-5 years)</SelectItem>
                          <SelectItem value="senior">Senior (5+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Documents and Links */}
              <div className="space-y-4">
                <h4 className="font-semibold">Documents & Links</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="resumeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Resume/CV URL
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://..." 
                            {...field}
                            value={field.value || ""} 
                            data-testid="input-resume-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverLetterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
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
                </div>

                <FormField
                  control={form.control}
                  name="portfolioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
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

              {/* Salary and Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salaryExpectation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Salary Expectation
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
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

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How did you hear about us?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-source">
                            <SelectValue placeholder="Select a source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="website">Company Website</SelectItem>
                          <SelectItem value="referral">Employee Referral</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="job_board">Job Board</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={submitApplicationMutation.isPending}
                  data-testid="button-submit-application"
                  className="min-w-32"
                >
                  {submitApplicationMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    "Submit Application"
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