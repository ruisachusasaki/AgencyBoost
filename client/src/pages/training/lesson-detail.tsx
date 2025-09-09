import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, CheckCircle, Clock, Download, Upload,
  FileText, Video, FileIcon, PlayCircle
} from "lucide-react";
import { QuizTaker } from "@/components/quiz-taker";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function LessonDetail() {
  const [match, params] = useRoute("/training/lessons/:id");
  const lessonId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Assignment submission state
  const [submissionText, setSubmissionText] = useState("");
  const [submittedFiles, setSubmittedFiles] = useState<any[]>([]);

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery({
    queryKey: [`/api/training/lessons/${lessonId}`],
    enabled: !!lessonId,
  });

  // Fetch course data to get course title and navigation
  const { data: course } = useQuery({
    queryKey: [`/api/training/courses/${lesson?.courseId}`],
    enabled: !!lesson?.courseId,
  });

  // Fetch all lessons in the course for navigation
  const { data: courseLessons } = useQuery({
    queryKey: [`/api/training/courses/${lesson?.courseId}/lessons`],
    enabled: !!lesson?.courseId,
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

  // Fetch assignment submission for current user
  const { data: submission, refetch: refetchSubmission } = useQuery({
    queryKey: [`/api/training/assignments/${assignment?.id}/submission`],
    enabled: !!assignment?.id,
  });

  // Find current lesson index and navigation
  const currentLessonIndex = courseLessons?.findIndex(l => l.id === lessonId) ?? -1;
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < (courseLessons?.length - 1) ? courseLessons[currentLessonIndex + 1] : null;

  // Mark lesson as completed
  const completeLessonMutation = useMutation({
    mutationFn: () => 
      fetch(`/api/training/lessons/${lessonId}/complete`, { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Great job!",
        description: "Lesson marked as completed!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${lesson?.courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/my-courses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark lesson as completed",
        variant: "destructive",
      });
    },
  });

  // Submit assignment
  const submitAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!assignment?.id) throw new Error("No assignment found");
      
      const response = await fetch(`/api/training/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionText,
          files: submittedFiles,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to submit assignment");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Assignment submitted successfully!",
      });
      refetchSubmission();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    },
  });

  // Load existing submission data when available
  useEffect(() => {
    if (submission) {
      setSubmissionText(submission.submissionText || "");
      setSubmittedFiles(submission.files || []);
    }
  }, [submission]);

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case "video": return <Video className="h-5 w-5 text-blue-600" />;
      case "article": return <FileText className="h-5 w-5 text-green-600" />;
      case "pdf": return <FileIcon className="h-5 w-5 text-red-600" />;
      case "quiz": return <CheckCircle className="h-5 w-5 text-purple-600" />;
      case "assignment": return <FileText className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  // Helper function to extract YouTube video ID from URL
  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Helper function to extract Loom video ID from URL
  const extractLoomId = (url: string) => {
    if (!url) return null;
    const regex = /loom\.com\/share\/([a-f0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const renderLessonContent = () => {
    if (!lesson) return null;

    const contentComponents = [];

    // Handle video content first (if available)
    if (lesson.contentType === "video") {
      // First try to use videoEmbedId if available
      if (lesson.videoEmbedId) {
        contentComponents.push(
          <div key="video" className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <iframe
              src={`https://www.youtube.com/embed/${lesson.videoEmbedId}`}
              title={lesson.title}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      } else if (lesson.videoUrl) {
        // Try to extract YouTube ID from videoUrl
        const youtubeId = extractYouTubeId(lesson.videoUrl);
        const loomId = extractLoomId(lesson.videoUrl);
        
        if (youtubeId) {
          contentComponents.push(
            <div key="video" className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={lesson.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          );
        } else if (loomId) {
          contentComponents.push(
            <div key="video" className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <iframe
                src={`https://www.loom.com/embed/${loomId}`}
                title={lesson.title}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          );
        } else {
          // Fallback to HTML5 video for other URLs
          contentComponents.push(
            <div key="video" className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full"
                poster={lesson.thumbnailUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        }
      }
    }

    // Handle PDF content
    if (lesson.contentType === "pdf" && lesson.videoUrl) {
      contentComponents.push(
        <div key="pdf" className="border rounded-lg p-4 bg-gray-50 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FileIcon className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="font-semibold">PDF Document</h3>
              <p className="text-sm text-gray-600">{lesson.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                <FileIcon className="h-4 w-4 mr-2" />
                View PDF
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={lesson.videoUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </div>
      );
    }

    // Handle quiz content
    if (lesson.contentType === "quiz" && quiz) {
      contentComponents.push(
        <div key="quiz">
          <QuizTaker 
            quiz={quiz} 
            onComplete={() => {
              // Optionally mark lesson as completed when quiz is passed
              // completeLessonMutation.mutate();
            }}
          />
        </div>
      );
    } else if (lesson.contentType === "quiz" && !quiz) {
      contentComponents.push(
        <div key="quiz-loading" className="text-center text-gray-500 py-8">
          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
          <p>Loading quiz...</p>
        </div>
      );
    }

    // Handle assignment content
    if (lesson.contentType === "assignment" && assignment) {
      contentComponents.push(
        <div key="assignment" className="space-y-6">
          {/* Assignment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Assignment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: assignment.instructions?.replace(/\n/g, '<br/>') || 'No instructions provided.' 
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Template Files for Download */}
          {assignment.templateFiles && assignment.templateFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Assignment Template Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Download these template files, complete them, and upload your finished work below.
                </p>
                <div className="grid gap-3">
                  {assignment.templateFiles.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">{file.name}</p>
                          <p className="text-sm text-blue-700">
                            {file.size ? `${Math.round(file.size / 1024)}KB` : 'Template file'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Status */}
          {submission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Your Submission
                  <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.submissionText && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                      {submission.submissionText}
                    </div>
                  </div>
                )}
                
                {submission.files && submission.files.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted Files:</label>
                    <div className="mt-1 space-y-2">
                      {submission.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                          <FileIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name || `File ${index + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {submission.grade && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Grade:</label>
                    <div className="mt-1">
                      <Badge variant="default" className="text-lg">
                        {submission.grade}%
                      </Badge>
                    </div>
                  </div>
                )}

                {submission.feedback && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Instructor Feedback:</label>
                    <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      {submission.feedback}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  {submission.gradedAt && (
                    <span> • Graded: {new Date(submission.gradedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-orange-600" />
                Submit Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Answer */}
              <div>
                <label className="text-sm font-medium text-gray-700">Your Answer</label>
                <Textarea
                  placeholder="Type your answer here..."
                  className="min-h-[120px] mt-2"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {submissionText.length} / 2000 characters
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium text-gray-700">Upload Assignment Files</label>
                <div className="mt-2">
                  <ObjectUploader
                    maxNumberOfFiles={assignment.maxFiles || 1}
                    maxFileSize={(assignment.maxFileSize || 10) * 1024 * 1024} // Convert MB to bytes
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
                        }));
                        setSubmittedFiles(prev => [...prev, ...newFiles]);
                      }
                    }}
                    buttonClassName="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </ObjectUploader>
                </div>

                {/* File Type Info */}
                <div className="text-xs text-gray-500 mt-2">
                  Allowed types: {assignment.allowedFileTypes?.join(', ') || 'All files'} • 
                  Max {assignment.maxFiles || 1} file(s) • 
                  Max {assignment.maxFileSize || 10}MB each
                </div>

                {/* Uploaded Files List */}
                {submittedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Ready to Submit:</label>
                    {submittedFiles.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSubmittedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => submitAssignmentMutation.mutate()}
                  disabled={submitAssignmentMutation.isPending || (!submissionText.trim() && submittedFiles.length === 0)}
                  className="px-6"
                >
                  {submitAssignmentMutation.isPending ? (
                    <>Submitting...</>
                  ) : submission ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Update Submission
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (lesson.contentType === "assignment" && !assignment) {
      contentComponents.push(
        <div key="assignment-loading" className="text-center text-gray-500 py-8">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p>Loading assignment...</p>
        </div>
      );
    }

    // Always show text content if available (regardless of contentType)
    if (lesson.content) {
      contentComponents.push(
        <div key="content" className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
        </div>
      );
    }

    // If no content components, show placeholder
    if (contentComponents.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p>Content not available</p>
        </div>
      );
    }

    return <div className="space-y-6">{contentComponents}</div>;
  };

  if (isLoading) {
    return <div className="p-6">Loading lesson...</div>;
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
    <div className="space-y-6" data-testid="lesson-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild data-testid="button-back-to-course">
          <Link href={`/training/courses/${lesson.courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
        
        {course && (
          <div className="text-sm text-gray-600">
            <Link href={`/training/courses/${lesson.courseId}`} className="hover:text-primary">
              {course.title}
            </Link>
          </div>
        )}
      </div>

      {/* Lesson Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          {getContentIcon(lesson.contentType)}
          <Badge variant="secondary" className="capitalize">
            {lesson.contentType}
          </Badge>
          {lesson.isRequired && (
            <Badge variant="outline">Required</Badge>
          )}
          {lesson.videoDuration && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {Math.round(lesson.videoDuration / 60)} min
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-lg text-gray-600">{lesson.description}</p>
        )}
      </div>

      {/* Lesson Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderLessonContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex gap-3">
          {previousLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/training/lessons/${previousLesson.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous: {previousLesson.title}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/training/courses/${lesson.courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Link>
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => completeLessonMutation.mutate()}
            disabled={completeLessonMutation.isPending}
            variant="outline"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {completeLessonMutation.isPending ? "Completing..." : "Mark Complete"}
          </Button>
          
          {nextLesson && (
            <Button asChild>
              <Link href={`/training/lessons/${nextLesson.id}`}>
                Next: {nextLesson.title}
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}