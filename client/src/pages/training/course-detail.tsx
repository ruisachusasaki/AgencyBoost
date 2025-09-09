import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Clock, Users, BookOpen, CheckCircle, Lock, 
  ArrowLeft, Award, FileText, Video, FileIcon, Download,
  Edit, Plus, Settings, ChevronDown, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function CourseDetail() {
  const [match, params] = useRoute("/training/courses/:id");
  const courseId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for collapsible modules
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Fetch course data
  const { data: course, isLoading, error } = useQuery({
    queryKey: [`/api/training/courses/${courseId}`],
    enabled: !!courseId,
  });
  

  // Fetch modules and lessons separately for proper organization
  const { data: modules } = useQuery({
    queryKey: [`/api/training/courses/${courseId}/modules`],
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: [`/api/training/courses/${courseId}/lessons`],
    enabled: !!courseId,
  });

  // Group lessons by module
  const moduleStructure = modules ? modules.map(module => ({
    ...module,
    lessons: lessons ? lessons.filter(lesson => lesson.moduleId === module.id).sort((a, b) => (a.order || 0) - (b.order || 0)) : []
  })).sort((a, b) => (a.order || 0) - (b.order || 0)) : [];

  // Get lessons without modules (fallback)
  const lessonsWithoutModule = lessons ? lessons.filter(lesson => !lesson.moduleId) : [];

  const allLessons = lessons ? [...lessons].sort((a, b) => {
    // First sort by module order, then by lesson order
    const moduleA = modules?.find(m => m.id === a.moduleId);
    const moduleB = modules?.find(m => m.id === b.moduleId);
    const moduleOrderA = moduleA?.order || 0;
    const moduleOrderB = moduleB?.order || 0;
    
    if (moduleOrderA !== moduleOrderB) {
      return moduleOrderA - moduleOrderB;
    }
    
    // Then by lesson order within module
    const lessonOrderDiff = (a.order || 0) - (b.order || 0);
    if (lessonOrderDiff !== 0) {
      return lessonOrderDiff;
    }
    
    // If orders are equal, sort by creation date to ensure consistent ordering
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  }) : [];

  // Toggle module expansion
  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const isModuleExpanded = (moduleId: string) => expandedModules.has(moduleId);

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: () => fetch(`/api/training/courses/${courseId}/enroll`, { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully enrolled in the course!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/my-courses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    },
  });

  // Mark lesson complete mutation
  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: string) => 
      fetch(`/api/training/lessons/${lessonId}/complete`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/my-courses"] });
    },
  });

  // Mark lesson incomplete mutation
  const incompleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => 
      fetch(`/api/training/lessons/${lessonId}/incomplete`, { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lesson marked as incomplete",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/my-courses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark lesson as incomplete",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !modules || !lessons) {
    return <div className="p-6">Loading course...</div>;
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

  const isEnrolled = !!course.enrollment;
  const progressMap = new Map(course.progress?.map(p => [p.lessonId, p]) || []);

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case "video": return <Video className="h-4 w-4" />;
      case "article": return <FileText className="h-4 w-4" />;
      case "pdf": return <FileIcon className="h-4 w-4" />;
      case "quiz": return <CheckCircle className="h-4 w-4" />;
      case "assignment": return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    const progress = progressMap.get(lessonId);
    return progress?.status === "completed";
  };

  const canAccessLesson = (lessonIndex: number, allLessons: any[]) => {
    if (!isEnrolled) return false;
    
    const currentLesson = allLessons[lessonIndex];
    
    // Check manual lock first - if manually locked, deny access
    if (currentLesson?.isLocked) {
      return false;
    }
    
    // If lesson is manually unlocked (isLocked = false), allow access regardless of previous lesson completion
    // This means the lock toggle controls both manual lock AND sequential completion requirement
    if (currentLesson?.isLocked === false) {
      return true;
    }
    
    // For lessons with undefined/null lock status, use default sequential behavior
    // First lesson is always accessible
    if (lessonIndex === 0) return true;
    
    // For other lessons, check if previous lesson is completed (sequential lock)
    const previousLesson = allLessons[lessonIndex - 1];
    return isLessonCompleted(previousLesson.id);
  };

  return (
    <div className="space-y-6" data-testid="course-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild data-testid="button-back">
          <Link href="/training">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training
          </Link>
        </Button>
        
        {/* Course Management Actions - Show for course creators/admins */}
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-edit-course">
            <Link href={`/training/courses/${courseId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Course
            </Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-manage-lessons">
            <Link href={`/training/courses/${courseId}/lessons`}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Content
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 mb-3">
                {course.categoryName && (
                  <Badge variant="secondary" style={{ backgroundColor: course.categoryColor + "20", color: course.categoryColor }}>
                    {course.categoryName}
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {course.difficulty}
                </Badge>
                {course.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
              
              <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {allLessons.length} lessons
                </div>
                
                {course.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.round(course.estimatedDuration / 60)}h duration
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrollmentCount || 0} enrolled
                </div>
              </div>
            </CardHeader>
          </Card>


          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                {isEnrolled 
                  ? "Click on any lesson to start learning" 
                  : "Enroll to access course content"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allLessons.length === 0 ? (
                  <div className="py-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
                    <p className="text-gray-600 mb-4">
                      This course doesn't have any lessons yet. 
                    </p>
                    <Button variant="outline" asChild>
                      <Link href={`/training/courses/${courseId}/lessons`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lessons
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Display modules with their lessons */}
                    {moduleStructure.map((module, moduleIndex) => {
                      if (module.lessons.length === 0) return null;
                      const expanded = isModuleExpanded(module.id);
                      
                      return (
                        <div key={module.id} className="space-y-3">
                          {/* Module Header */}
                          <div 
                            className="flex items-center gap-3 pb-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors"
                            onClick={() => toggleModuleExpansion(module.id)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">{moduleIndex + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{module.title}</h3>
                                {module.description && (
                                  <p className="text-sm text-gray-600">{module.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</span>
                              {expanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                          
                          {/* Module Lessons - Only show when expanded */}
                          {expanded && (
                            <div className="space-y-3 pl-4">
                            {module.lessons.map((lesson) => {
                              const globalLessonIndex = allLessons.findIndex(l => l.id === lesson.id);
                              const progress = progressMap.get(lesson.id);
                              const isCompleted = isLessonCompleted(lesson.id);
                              const canAccess = canAccessLesson(globalLessonIndex, allLessons);

                              return (
                                <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50" data-testid={`lesson-${lesson.id}`}>
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="flex items-center gap-2">
                                      {isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : canAccess ? (
                                        getContentIcon(lesson.contentType)
                                      ) : (
                                        <Lock className="h-4 w-4 text-gray-400" />
                                      )}
                                      <span className="text-sm text-gray-600">
                                        {globalLessonIndex + 1}.
                                      </span>
                                    </div>
                                    
                                    <div className="flex-1">
                                      <h4 className={`font-medium ${!canAccess ? "text-gray-400" : ""}`}>
                                        {lesson.title}
                                      </h4>
                                      {lesson.description && (
                                        <p className="text-sm text-gray-600">{lesson.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span className="capitalize">{lesson.contentType}</span>
                                        {lesson.videoDuration && (
                                          <>
                                            <span>•</span>
                                            <span>{Math.round(lesson.videoDuration / 60)} min</span>
                                          </>
                                        )}
                                        {lesson.isRequired && (
                                          <>
                                            <span>•</span>
                                            <span>Required</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => incompleteLessonMutation.mutate(lesson.id)}
                                        disabled={incompleteLessonMutation.isPending}
                                        data-testid={`button-mark-incomplete-${lesson.id}`}
                                      >
                                        Mark Incomplete
                                      </Button>
                                    )}
                                    
                                    {canAccess ? (
                                      <Button size="sm" asChild data-testid={`button-start-lesson-${lesson.id}`}>
                                        <Link href={`/training/lessons/${lesson.id}`}>
                                          {isCompleted ? "Review" : "Start"}
                                        </Link>
                                      </Button>
                                    ) : (
                                      <Button size="sm" disabled>
                                        <Lock className="h-4 w-4 mr-1" />
                                        Locked
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Display lessons without modules (fallback) */}
                    {lessonsWithoutModule.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-gray-600">Other Lessons</h3>
                        {lessonsWithoutModule.map((lesson) => {
                          const globalLessonIndex = allLessons.findIndex(l => l.id === lesson.id);
                          const progress = progressMap.get(lesson.id);
                          const isCompleted = isLessonCompleted(lesson.id);
                          const canAccess = canAccessLesson(globalLessonIndex, allLessons);

                          return (
                            <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`lesson-${lesson.id}`}>
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : canAccess ? (
                                    getContentIcon(lesson.contentType)
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-sm text-gray-600">
                                    {globalLessonIndex + 1}.
                                  </span>
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className={`font-medium ${!canAccess ? "text-gray-400" : ""}`}>
                                    {lesson.title}
                                  </h4>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-600">{lesson.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span className="capitalize">{lesson.contentType}</span>
                                    {lesson.videoDuration && (
                                      <>
                                        <span>•</span>
                                        <span>{Math.round(lesson.videoDuration / 60)} min</span>
                                      </>
                                    )}
                                    {lesson.isRequired && (
                                      <>
                                        <span>•</span>
                                        <span>Required</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isCompleted && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => incompleteLessonMutation.mutate(lesson.id)}
                                    disabled={incompleteLessonMutation.isPending}
                                    data-testid={`button-mark-incomplete-${lesson.id}`}
                                  >
                                    Mark Incomplete
                                  </Button>
                                )}
                                
                                {canAccess ? (
                                  <Button size="sm" asChild data-testid={`button-start-lesson-${lesson.id}`}>
                                    <Link href={`/training/lessons/${lesson.id}`}>
                                      {isCompleted ? "Review" : "Start"}
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button size="sm" disabled>
                                    <Lock className="h-4 w-4 mr-1" />
                                    Locked
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEnrolled ? (
                <Button 
                  className="w-full" 
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  data-testid="button-enroll"
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center text-green-600 font-medium">
                    ✓ You're enrolled in this course
                  </div>
                  <Button 
                    className="w-full" 
                    asChild
                    data-testid="button-continue-learning"
                  >
                    <Link href={`/training/lessons/${allLessons[0]?.id || ''}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Link>
                  </Button>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="capitalize font-medium">{course.difficulty}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Lessons:</span>
                  <span className="font-medium">{allLessons.length}</span>
                </div>
                
                {course.estimatedDuration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{Math.round(course.estimatedDuration / 60)}h</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created by:</span>
                  <span className="font-medium">{course.creatorName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Progress */}
          {isEnrolled && course.enrollment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Course Progress</span>
                      <span>{course.enrollment.progress || 0}%</span>
                    </div>
                    <Progress value={course.enrollment.progress || 0} className="h-3" />
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Lessons:</span>
                      <span className="font-medium">{course.enrollment.completedLessons || 0} of {course.enrollment.totalLessons || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{course.enrollment.status?.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Course Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Enrolled:</span>
                <span className="font-medium">{course.enrollmentCount || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}