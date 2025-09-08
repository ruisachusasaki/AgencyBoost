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

  // Fetch all lessons in the course for navigation
  const { data: courseLessons } = useQuery({
    queryKey: [`/api/training/courses/${lesson?.courseId}/lessons`],
    enabled: !!lesson?.courseId,
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