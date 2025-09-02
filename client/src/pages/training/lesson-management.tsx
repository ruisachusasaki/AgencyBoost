import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Video, FileText, FileIcon, CheckCircle, GripVertical } from "lucide-react";
import { Link } from "wouter";

export default function LessonManagement() {
  const [match, params] = useRoute("/training/courses/:id/lessons");
  const courseId = params?.id;

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/training/courses", courseId],
    enabled: !!courseId,
  });

  // Fetch lessons data
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/training/courses", courseId, "lessons"],
    enabled: !!courseId,
  });

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case "video": return <Video className="h-4 w-4" />;
      case "article": return <FileText className="h-4 w-4" />;
      case "pdf": return <FileIcon className="h-4 w-4" />;
      case "quiz": return <CheckCircle className="h-4 w-4" />;
      case "assignment": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (courseLoading) {
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

  return (
    <div className="space-y-6" data-testid="lesson-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href={`/training/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Course Content</h1>
            <p className="text-gray-600">{course.title}</p>
          </div>
        </div>
        
        <Button asChild data-testid="button-add-lesson">
          <Link href={`/training/courses/${courseId}/lessons/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Link>
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Course Overview
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">
                {course.difficulty}
              </Badge>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Lessons:</span>
              <p className="font-medium">{lessons.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Estimated Duration:</span>
              <p className="font-medium">{course.estimatedDuration || 0} minutes</p>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <p className="font-medium">{course.categoryName || "Uncategorized"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Course Lessons</CardTitle>
          <CardDescription>
            {lessons.length === 0 
              ? "No lessons yet. Add your first lesson to get started."
              : `Manage and organize your ${lessons.length} lesson${lessons.length === 1 ? '' : 's'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lessonsLoading ? (
            <div className="py-8 text-center text-gray-500">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your course by adding your first lesson. You can add videos, articles, PDFs, quizzes, and assignments.
              </p>
              <Button asChild data-testid="button-add-first-lesson">
                <Link href={`/training/courses/${courseId}/lessons/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Lesson
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors" data-testid={`lesson-item-${lesson.id}`}>
                  {/* Drag Handle */}
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                  
                  {/* Lesson Number */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                    {index + 1}
                  </div>
                  
                  {/* Lesson Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getContentIcon(lesson.contentType)}
                      <h4 className="font-medium">{lesson.title}</h4>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {lesson.contentType}
                        </Badge>
                        {lesson.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {lesson.videoDuration && (
                        <span>{Math.round(lesson.videoDuration / 60)} min</span>
                      )}
                      {lesson.order && (
                        <>
                          <span>•</span>
                          <span>Order: {lesson.order}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      data-testid={`button-edit-lesson-${lesson.id}`}
                    >
                      <Link href={`/training/courses/${courseId}/lessons/${lesson.id}/edit`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-lesson-${lesson.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {lessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href={`/training/courses/${courseId}/lessons/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/training/courses/${courseId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course Info
                </Link>
              </Button>
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Preview Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}