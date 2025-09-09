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
import { ArrowLeft, Save, Upload, FileText, FileIcon, X, Plus, Link2, Download, Edit, Trash2, GripVertical } from "lucide-react";
import { QuizBuilder } from "@/components/quiz-builder";
import { ObjectUploader } from "@/components/ObjectUploader";
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
});

type LessonFormData = z.infer<typeof lessonSchema>;

export default function EditLesson() {
  const [match, params] = useRoute("/training/courses/:courseId/lessons/:id/edit");
  const lessonId = params?.id;
  const courseId = params?.courseId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [resourceForm, setResourceForm] = useState({
    type: 'download' as 'download' | 'link',
    title: '',
    description: '',
    url: '',
    fileName: '',
    fileSize: 0
  });
  const [isUploadingResource, setIsUploadingResource] = useState(false);

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery({
    queryKey: [`/api/training/lessons/${lessonId}`],
    enabled: !!lessonId,
  });

  // Fetch quiz data if lesson is a quiz
  const { data: quiz } = useQuery({
    queryKey: [`/api/training/lessons/${lessonId}/quiz`],
    enabled: !!lessonId && lesson?.contentType === 'quiz',
  });

  // Fetch assignment data if lesson is an assignment
  const { data: assignment } = useQuery({
    queryKey: [`/api/training/lessons/${lessonId}/assignment`],
    enabled: !!lessonId && lesson?.contentType === 'assignment',
  });

  // Fetch lesson resources (available for all lesson types)
  const { data: resources = [], refetch: refetchResources } = useQuery({
    queryKey: [`/api/training/lessons/${lessonId}/resources`],
    enabled: !!lessonId,
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

  // Update form when lesson data loads
  useEffect(() => {
    if (lesson) {
      form.reset({
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        contentType: lesson.contentType || "video",
        contentUrl: lesson.videoUrl || "", // Map videoUrl from API to contentUrl for form
        duration: lesson.duration || 0,
        order: lesson.order || 0,
        isRequired: lesson.isRequired ?? true,
      });
    }
  }, [lesson, form]);

  // Update quiz data when quiz loads
  useEffect(() => {
    if (quiz) {
      setQuizData(quiz);
    }
  }, [quiz]);

  // Update assignment data when assignment loads
  useEffect(() => {
    if (assignment) {
      setAssignmentData(assignment);
    }
  }, [assignment]);

  // Don't automatically show quiz builder - we'll render it inline now

  const updateLessonMutation = useMutation({
    mutationFn: (data: LessonFormData) =>
      fetch(`/api/training/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update lesson");
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Lesson updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training/lessons/${lessonId}`] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/lessons`] });
        setLocation(`/training/courses/${courseId}/lessons`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lesson. Please try again.",
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

  const handleQuizSave = async (quizDataToSave: any) => {
    try {
      // Update lesson first
      const lessonData = {
        title: form.getValues('title'),
        description: form.getValues('description'),
        content: form.getValues('content'),
        contentType: 'quiz' as const,
        contentUrl: '',
        duration: form.getValues('duration'),
        order: form.getValues('order'),
        isRequired: form.getValues('isRequired'),
      };

      const lessonResponse = await fetch(`/api/training/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lessonData),
      });

      if (!lessonResponse.ok) throw new Error("Failed to update lesson");

      // Then update quiz
      const quizResponse = await fetch(`/api/training/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizDataToSave),
      });

      if (!quizResponse.ok) throw new Error("Failed to update quiz");

      toast({
        title: "Success!",
        description: "Lesson and quiz updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training/lessons/${lessonId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/training/lessons/${lessonId}/quiz`] });
      setShowQuizBuilder(false);
      setLocation(`/training/courses/${courseId}/lessons`);
    } catch (error) {
      console.error('Error updating lesson with quiz:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson and quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: LessonFormData) => {
    // For quiz lessons, the quiz builder handles the saving
    if (data.contentType === 'quiz') {
      return;
    }

    // For assignment lessons, the assignment builder handles the saving
    if (data.contentType === 'assignment') {
      return;
    }

    updateLessonMutation.mutate(data);
  };

  // Resource management functions
  const createResourceMutation = useMutation({
    mutationFn: (resourceData: any) =>
      fetch(`/api/training/lessons/${lessonId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceData),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create resource");
        return res.json();
      }),
    onSuccess: () => {
      refetchResources();
      setShowAddResource(false);
      setResourceForm({
        type: 'download',
        title: '',
        description: '',
        url: '',
        fileName: '',
        fileSize: 0
      });
      toast({
        title: "Success!",
        description: "Resource added successfully.",
      });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, ...resourceData }: any) =>
      fetch(`/api/training/lessons/${lessonId}/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceData),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update resource");
        return res.json();
      }),
    onSuccess: () => {
      refetchResources();
      setEditingResource(null);
      setResourceForm({
        type: 'download',
        title: '',
        description: '',
        url: '',
        fileName: '',
        fileSize: 0
      });
      toast({
        title: "Success!",
        description: "Resource updated successfully.",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) =>
      fetch(`/api/training/lessons/${lessonId}/resources/${resourceId}`, {
        method: "DELETE",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete resource");
        return res.json();
      }),
    onSuccess: () => {
      refetchResources();
      toast({
        title: "Success!",
        description: "Resource deleted successfully.",
      });
    },
  });

  const handleResourceSave = () => {
    if (editingResource) {
      updateResourceMutation.mutate({
        id: editingResource.id,
        ...resourceForm
      });
    } else {
      createResourceMutation.mutate(resourceForm);
    }
  };

  const handleResourceEdit = (resource: any) => {
    setEditingResource(resource);
    setResourceForm({
      type: resource.type,
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      fileName: resource.fileName || '',
      fileSize: resource.fileSize || 0
    });
    setShowAddResource(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingResource(true);
    
    try {
      // Get upload URL
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to get upload URL: ${uploadResponse.status}`);
      }
      
      const { uploadURL } = await uploadResponse.json();

      // Upload file directly to object storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadFileResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadFileResponse.status}`);
      }

      // Set ACL policy for the uploaded file
      const finalResponse = await fetch('/api/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageURL: uploadURL.split('?')[0] }),
      });
      
      if (!finalResponse.ok) {
        throw new Error(`Failed to finalize upload: ${finalResponse.status}`);
      }
      
      const { objectPath } = await finalResponse.json();
      const downloadUrl = `${window.location.origin}${objectPath}`;
      
      // Auto-populate title with filename (without extension) if title is empty
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      
      setResourceForm(prev => ({
        ...prev,
        url: downloadUrl,
        fileName: file.name,
        fileSize: file.size,
        title: prev.title.trim() || nameWithoutExt
      }));
      
      toast({
        title: "File uploaded successfully!",
        description: "You can edit the title and click 'Save Resource' to save."
      });
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingResource(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!lesson) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h1>
          <p className="text-gray-600 mb-4">The requested lesson could not be found.</p>
          <Button asChild>
            <Link href="/training">Back to Training</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="edit-lesson-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild data-testid="button-back">
          <Link href={`/training/courses/${courseId}/lessons`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Lesson</h1>
          <p className="text-gray-600">{lesson.title}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>
            Update the lesson information
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
                      <Select onValueChange={field.onChange} value={field.value}>
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

              {form.watch('contentType') !== 'quiz' && form.watch('contentType') !== 'assignment' && (
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
              )}

              {/* Quiz Builder for quiz lessons */}
              {form.watch('contentType') === 'quiz' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Quiz Configuration</h3>
                    <p className="text-gray-600">Configure your quiz questions and settings</p>
                  </div>
                  <QuizBuilder
                    initialQuiz={quizData || {
                      title: `${form.getValues('title')} Quiz`,
                      description: "Complete this quiz to test your understanding of the lesson content."
                    }}
                    onSave={handleQuizSave}
                    onCancel={() => {
                      form.setValue('contentType', 'article');
                    }}
                  />
                </div>
              )}

              {/* Assignment Builder for assignment lessons */}
              {form.watch('contentType') === 'assignment' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Assignment Configuration</h3>
                    <p className="text-gray-600">Configure your assignment instructions and file upload settings</p>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Assignment Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Assignment Instructions */}
                      <div>
                        <label className="text-sm font-medium">Instructions</label>
                        <Textarea
                          placeholder="Enter detailed assignment instructions..."
                          className="min-h-[120px] mt-2"
                          value={assignmentData?.instructions || ''}
                          onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
                        />
                      </div>
                      
                      {/* Instructor Template Files */}
                      <div>
                        <label className="text-sm font-medium">Template Files for Students</label>
                        <p className="text-xs text-gray-500 mb-3">Upload documents that students can download, complete, and re-upload</p>
                        
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <ObjectUploader
                            maxNumberOfFiles={5}
                            maxFileSize={50 * 1024 * 1024} // 50MB
                            onGetUploadParameters={async () => {
                              const response = await fetch("/api/objects/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                              });
                              const data = await response.json();
                              return {
                                method: "PUT" as const,
                                url: data.uploadURL,
                              };
                            }}
                            onComplete={(result) => {
                              if (result.successful && result.successful.length > 0) {
                                const newFiles = result.successful.map((file: any) => ({
                                  name: file.name,
                                  url: file.uploadURL,
                                  size: file.size,
                                }));
                                setAssignmentData(prev => ({ 
                                  ...prev, 
                                  templateFiles: [...(prev?.templateFiles || []), ...newFiles]
                                }));
                              }
                            }}
                            buttonClassName="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Template Files
                          </ObjectUploader>
                          
                          {/* Show uploaded template files */}
                          {assignmentData?.templateFiles && assignmentData.templateFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm font-medium">Uploaded Template Files:</p>
                              {assignmentData.templateFiles.map((file: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white border rounded">
                                  <div className="flex items-center gap-3">
                                    <FileIcon className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <p className="text-sm font-medium">{file.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {file.size ? `${Math.round(file.size / 1024)}KB` : 'Unknown size'}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setAssignmentData(prev => ({
                                        ...prev,
                                        templateFiles: prev?.templateFiles?.filter((_, i) => i !== index) || []
                                      }));
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Students will be able to download these files, complete them, and upload their completed work.
                          </p>
                        </div>
                      </div>
                      
                      {/* File Upload Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Max Files</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={assignmentData?.maxFiles || 1}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, maxFiles: parseInt(e.target.value) || 1 }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Max File Size (MB)</label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={assignmentData?.maxFileSize || 10}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 10 }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Allowed File Types</label>
                          <Input
                            placeholder="pdf,doc,docx,txt"
                            value={assignmentData?.allowedFileTypes?.join(',') || 'pdf,doc,docx,txt'}
                            onChange={(e) => setAssignmentData(prev => ({ 
                              ...prev, 
                              allowedFileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                            }))}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      
                      {/* Save Assignment Button */}
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={async () => {
                            try {
                              // First update lesson
                              const lessonData = {
                                title: form.getValues('title'),
                                description: form.getValues('description'),
                                contentType: 'assignment' as const,
                                contentUrl: '',
                                duration: form.getValues('duration'),
                                order: form.getValues('order'),
                                isRequired: form.getValues('isRequired'),
                              };

                              const lessonResponse = await fetch(`/api/training/lessons/${lessonId}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(lessonData),
                              });

                              if (!lessonResponse.ok) throw new Error("Failed to update lesson");

                              // Then update assignment
                              const assignmentDataToSave = {
                                title: form.getValues('title'),
                                description: form.getValues('description'),
                                instructions: assignmentData?.instructions || '',
                                allowedFileTypes: assignmentData?.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt'],
                                maxFileSize: assignmentData?.maxFileSize || 10,
                                maxFiles: assignmentData?.maxFiles || 1,
                                isRequired: form.getValues('isRequired'),
                                templateFiles: assignmentData?.templateFiles || [],
                              };

                              const assignmentResponse = await fetch(`/api/training/lessons/${lessonId}/assignment`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(assignmentDataToSave),
                              });

                              if (!assignmentResponse.ok) throw new Error("Failed to update assignment");

                              toast({
                                title: "Success!",
                                description: "Assignment updated successfully.",
                              });
                              
                              queryClient.invalidateQueries({ queryKey: [`/api/training/lessons/${lessonId}`] });
                              queryClient.invalidateQueries({ queryKey: [`/api/training/lessons/${lessonId}/assignment`] });
                              setLocation(`/training/courses/${courseId}/lessons`);
                            } catch (error) {
                              console.error('Error updating assignment:', error);
                              toast({
                                title: "Error",
                                description: "Failed to update assignment. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="w-auto px-6"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Assignment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Resources Section - Available for ALL lesson types */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5" />
                    Lesson Resources
                  </CardTitle>
                  <CardDescription>
                    Add downloadable files and helpful links for students to access with this lesson.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Existing Resources */}
                    {resources.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Current Resources</h4>
                        {resources.map((resource: any) => (
                          <div key={resource.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  {resource.type === 'download' ? (
                                    <Download className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Link2 className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium">{resource.title}</h5>
                                  {resource.description && (
                                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span className="capitalize">{resource.type}</span>
                                    {resource.fileSize > 0 && <span>Size: {Math.round(resource.fileSize / 1024)}KB</span>}
                                  </div>
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                                    >
                                      {resource.type === 'download' ? 'Download File' : 'Open Link'}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResourceEdit(resource)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this resource?')) {
                                      deleteResourceMutation.mutate(resource.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Resource Button */}
                    {!showAddResource && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAddResource(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    )}

                    {/* Add/Edit Resource Form */}
                    {showAddResource && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-medium mb-4">
                          {editingResource ? 'Edit Resource' : 'Add New Resource'}
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Resource Type Selection */}
                          <div>
                            <label className="text-sm font-medium">Resource Type</label>
                            <Select
                              value={resourceForm.type}
                              onValueChange={(value: 'download' | 'link') => 
                                setResourceForm(prev => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="download">Download (File Upload)</SelectItem>
                                <SelectItem value="link">Link (External URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Title */}
                          <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input
                              value={resourceForm.title}
                              onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter resource title"
                              className="mt-2"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              value={resourceForm.description}
                              onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Optional description"
                              className="mt-2"
                              rows={2}
                            />
                          </div>

                          {/* Download Type - File Upload */}
                          {resourceForm.type === 'download' && (
                            <div>
                              <label className="text-sm font-medium">Upload File</label>
                              <div className="mt-2">
                                {!resourceForm.fileName ? (
                                  <div className="space-y-2">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                      <input
                                        type="file"
                                        onChange={handleFileSelect}
                                        disabled={isUploadingResource}
                                        className="w-full"
                                        id="resource-file-input"
                                        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
                                      />
                                      <p className="text-xs text-gray-500 mt-2">
                                        Supported: PDF, Word, Excel, PowerPoint, Images (max 50MB)
                                      </p>
                                    </div>
                                    {isUploadingResource && (
                                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                        📤 Uploading file, please wait...
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-sm text-green-800 font-medium mb-1">
                                        ✓ File uploaded successfully: {resourceForm.fileName}
                                      </p>
                                      <p className="text-xs text-green-700">
                                        Title has been auto-filled from filename. You can edit it above if needed.
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setResourceForm(prev => ({
                                          ...prev,
                                          url: '',
                                          fileName: '',
                                          fileSize: 0,
                                          title: ''
                                        }));
                                      }}
                                      className="w-full"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Different File
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Link Type - URL Input */}
                          {resourceForm.type === 'link' && (
                            <div>
                              <label className="text-sm font-medium">URL *</label>
                              <Input
                                type="url"
                                value={resourceForm.url}
                                onChange={(e) => setResourceForm(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://example.com"
                                className="mt-2"
                              />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddResource(false);
                                setEditingResource(null);
                                setResourceForm({
                                  type: 'download',
                                  title: '',
                                  description: '',
                                  url: '',
                                  fileName: '',
                                  fileSize: 0
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleResourceSave}
                              disabled={
                                !resourceForm.title.trim() || 
                                (resourceForm.type === 'link' && !resourceForm.url.trim()) ||
                                (resourceForm.type === 'download' && !resourceForm.url.trim()) ||
                                createResourceMutation.isPending ||
                                updateResourceMutation.isPending
                              }
                              className={resourceForm.fileName ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {createResourceMutation.isPending || updateResourceMutation.isPending 
                                ? 'Saving...' 
                                : editingResource 
                                  ? 'Update Resource' 
                                  : resourceForm.fileName 
                                    ? '✓ Save Resource' 
                                    : 'Add Resource'
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Only show Update Lesson button for non-quiz and non-assignment lessons */}
              {form.watch('contentType') !== 'quiz' && form.watch('contentType') !== 'assignment' && (
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/training/courses/${lesson.courseId}/lessons`}>Cancel</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateLessonMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateLessonMutation.isPending ? (
                      <>Updating...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Lesson
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* For quiz lessons, show a note that the QuizBuilder handles saving */}
              {form.watch('contentType') === 'quiz' && (
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/training/courses/${lesson.courseId}/lessons`}>Cancel</Link>
                  </Button>
                  <p className="text-sm text-gray-600 flex items-center">
                    Use the "Save Quiz" button above to save your changes
                  </p>
                </div>
              )}

              {/* For assignment lessons, show a note that the Assignment Builder handles saving */}
              {form.watch('contentType') === 'assignment' && (
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/training/courses/${lesson.courseId}/lessons`}>Cancel</Link>
                  </Button>
                  <p className="text-sm text-gray-600 flex items-center">
                    Use the "Save Assignment" button above to save your changes
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quiz Builder is now inline above, no modal needed */}
    </div>
  );
}