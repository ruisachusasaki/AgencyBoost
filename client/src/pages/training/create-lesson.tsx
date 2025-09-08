import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload, FileText } from "lucide-react";
import { Link } from "wouter";

const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  contentType: z.enum(["video", "article", "pdf", "quiz", "assignment"]),
  contentUrl: z.string().url().optional().or(z.literal("")),
  duration: z.number().min(0, "Duration must be positive").optional(),
  order: z.number().min(0, "Order must be positive").default(0),
  isRequired: z.boolean().default(true),
  moduleId: z.string().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

export default function CreateLesson() {
  const [match, params] = useRoute("/training/courses/:id/lessons/create");
  const courseId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/training/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch modules for the course
  const { data: modules = [] } = useQuery({
    queryKey: [`/api/training/courses/${courseId}/modules`],
    enabled: !!courseId,
  });

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      contentType: "video",
      contentUrl: "",
      duration: 0,
      order: 0,
      isRequired: true,
    },
  });

  // Check for moduleId in URL params and set form value
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleId = urlParams.get('moduleId');
    if (moduleId) {
      form.setValue('moduleId', moduleId);
    }
  }, [form]);

  const createLessonMutation = useMutation({
    mutationFn: (data: LessonFormData) =>
      fetch(`/api/training/courses/${courseId}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create lesson");
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Lesson created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/lessons`] });
      setLocation(`/training/courses/${courseId}/lessons`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  // PDF upload function
  const handlePdfUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingPdf(true);
    
    try {
      // Get upload URL from server
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file directly to object storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadFileResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      // Set object ACL policy and get final URL
      const finalResponse = await fetch('/api/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageURL: uploadURL.split('?')[0], // Remove query parameters
        }),
      });

      if (!finalResponse.ok) {
        throw new Error('Failed to finalize PDF upload');
      }

      const { objectPath } = await finalResponse.json();
      const pdfUrl = `${window.location.origin}${objectPath}`;

      // Set the PDF URL in the form
      form.setValue('contentUrl', pdfUrl);

      toast({
        title: "PDF uploaded",
        description: "PDF file has been uploaded successfully"
      });

    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const onSubmit = (data: LessonFormData) => {
    // Convert "unorganized" to undefined/null for backend
    const submitData = {
      ...data,
      moduleId: data.moduleId === "unorganized" ? undefined : data.moduleId,
    };
    createLessonMutation.mutate(submitData);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The requested course could not be found.</p>
          <Button asChild>
            <Link href="/training">Back to Training</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="create-lesson-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild data-testid="button-back">
          <Link href={`/training/courses/${courseId}/lessons`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Lesson</h1>
          <p className="text-gray-600">{course.title}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>
            Create a new lesson for this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lesson title..." {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-content-type">
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter lesson description..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of what this lesson covers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-module">
                          <SelectValue placeholder="Select a module or leave unorganized" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unorganized">No Module (Unorganized)</SelectItem>
                        {modules.map((module: any) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Group this lesson under a module for better organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contentUrl"
                  render={({ field }) => {
                    const contentType = form.watch('contentType');
                    
                    return (
                      <FormItem>
                        <FormLabel>
                          {contentType === 'pdf' ? 'PDF Document' : 'Content URL'}
                        </FormLabel>
                        <FormControl>
                          {contentType === 'pdf' ? (
                            <div className="space-y-3">
                              {/* PDF Upload Button */}
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'application/pdf';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handlePdfUpload(file);
                                    };
                                    input.click();
                                  }}
                                  disabled={isUploadingPdf}
                                  className="flex-shrink-0"
                                  data-testid="button-pdf-upload"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {isUploadingPdf ? 'Uploading...' : 'Upload PDF'}
                                </Button>
                                
                                {field.value && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FileText className="h-4 w-4" />
                                    <span>PDF uploaded</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Hidden input to store PDF URL */}
                              <Input 
                                {...field} 
                                className="sr-only" 
                                data-testid="input-pdf-url" 
                              />
                            </div>
                          ) : (
                            <Input 
                              placeholder="https://youtube.com/watch?v=..." 
                              {...field} 
                              data-testid="input-content-url"
                            />
                          )}
                        </FormControl>
                        <FormDescription>
                          {contentType === 'pdf' ? 
                            'Upload a PDF file (max 10MB)' : 
                            'URL for video, document, or external content'
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormDescription>
                        Estimated time to complete this lesson
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter lesson content..."
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      The main content of the lesson (rich text with formatting)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={`/training/courses/${courseId}/lessons`}>Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLessonMutation.isPending}
                  data-testid="button-save"
                >
                  {createLessonMutation.isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Lesson
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