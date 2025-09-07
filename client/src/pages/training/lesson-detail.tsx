import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, CheckCircle, Clock, Download, 
  FileText, Video, FileIcon, PlayCircle
} from "lucide-react";

export default function LessonDetail() {
  const [match, params] = useRoute("/training/lessons/:id");
  const lessonId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const renderLessonContent = () => {
    if (!lesson) return null;

    switch (lesson.contentType) {
      case "video":
        if (lesson.videoEmbedId) {
          return (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
          return (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
        } else {
          return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <PlayCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Video content will be available soon</p>
              </div>
            </div>
          );
        }

      case "pdf":
        if (lesson.pdfUrl) {
          return (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <FileIcon className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="font-semibold">PDF Document</h3>
                    <p className="text-sm text-gray-600">{lesson.title}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button asChild>
                    <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 mr-2" />
                      View PDF
                    </a>
                  </Button>
                  {lesson.canDownload && (
                    <Button variant="outline" asChild>
                      <a href={lesson.pdfUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              {lesson.content && (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
              )}
            </div>
          );
        }
        break;

      case "article":
      case "assignment":
      case "quiz":
      default:
        if (lesson.content) {
          return (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          );
        } else {
          return (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>Content will be available soon</p>
            </div>
          );
        }
    }

    return (
      <div className="text-center text-gray-500 py-8">
        <FileText className="h-12 w-12 mx-auto mb-2" />
        <p>Content not available</p>
      </div>
    );
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
      <div className="flex items-center justify-between">
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

        <Button 
          onClick={() => completeLessonMutation.mutate()}
          disabled={completeLessonMutation.isPending}
          data-testid="button-mark-complete"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {completeLessonMutation.isPending ? "Marking Complete..." : "Mark Complete"}
        </Button>
      </div>

      {/* Lesson Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getContentIcon(lesson.contentType)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-lg text-gray-600">{lesson.description}</p>
            )}
          </div>
        </div>
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
        <Button variant="outline" asChild>
          <Link href={`/training/courses/${lesson.courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
        
        <Button 
          onClick={() => completeLessonMutation.mutate()}
          disabled={completeLessonMutation.isPending}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {completeLessonMutation.isPending ? "Marking Complete..." : "Complete Lesson"}
        </Button>
      </div>
    </div>
  );
}