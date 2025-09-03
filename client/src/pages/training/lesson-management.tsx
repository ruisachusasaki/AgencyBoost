import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Video, 
  FileText, 
  FileIcon, 
  CheckCircle, 
  GripVertical,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { Link } from "wouter";
import type { TrainingLesson, TrainingModule, InsertTrainingModule } from "@shared/schema";
import { insertTrainingModuleSchema } from "@shared/schema";

export default function LessonManagement() {
  const [match, params] = useRoute("/training/courses/:id/lessons");
  const courseId = params?.id;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/training/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch modules data
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/training/courses/${courseId}/modules`],
    enabled: !!courseId,
  });

  // Fetch lessons data
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/training/courses/${courseId}/lessons`],
    enabled: !!courseId,
  });

  // Module form
  const moduleForm = useForm<InsertTrainingModule>({
    resolver: zodResolver(insertTrainingModuleSchema.omit({
      courseId: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true
    })),
    defaultValues: {
      title: "",
      description: "",
      order: 0,
      isRequired: true
    },
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: (data: InsertTrainingModule) => 
      fetch(`/api/training/courses/${courseId}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create module");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/modules`] });
      setModuleDialogOpen(false);
      moduleForm.reset();
      toast({
        title: "Module created",
        description: "The module has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Module creation error:', error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to create module. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onCreateModule = (data: InsertTrainingModule) => {
    console.log('Creating module with data:', data);
    createModuleMutation.mutate(data);
  };

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTrainingModule> }) => 
      fetch(`/api/training/modules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update module");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/modules`] });
      setEditingModule(null);
      setModuleDialogOpen(false);
      moduleForm.reset();
      toast({
        title: "Module updated",
        description: "The module has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Module update error:', error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to update module. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => 
      fetch(`/api/training/modules/${moduleId}`, {
        method: "DELETE",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete module");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/modules`] });
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/lessons`] });
      setDeleteModuleId(null);
      toast({
        title: "Module deleted",
        description: "The module has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Module delete error:', error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to delete module. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onUpdateModule = (data: InsertTrainingModule) => {
    if (!editingModule) return;
    updateModuleMutation.mutate({ id: editingModule.id, data });
  };

  const onDeleteModule = () => {
    if (!deleteModuleId) return;
    deleteModuleMutation.mutate(deleteModuleId);
  };

  const openEditModule = (module: TrainingModule) => {
    setEditingModule(module);
    moduleForm.reset({
      title: module.title,
      description: module.description || "",
      order: module.order,
      isRequired: module.isRequired
    });
    setModuleDialogOpen(true);
  };

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => 
      fetch(`/api/training/lessons/${lessonId}`, {
        method: "DELETE",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete lesson");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training/courses/${courseId}/lessons`] });
      setDeleteLessonId(null);
      toast({
        title: "Lesson deleted",
        description: "The lesson has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Lesson delete error:', error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to delete lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDeleteLesson = () => {
    if (!deleteLessonId) return;
    deleteLessonMutation.mutate(deleteLessonId);
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

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

  // Group lessons by module
  const lessonsByModule = lessons.reduce((acc: Record<string, TrainingLesson[]>, lesson: TrainingLesson) => {
    const moduleId = lesson.moduleId || 'unorganized';
    if (!acc[moduleId]) acc[moduleId] = [];
    acc[moduleId].push(lesson);
    return acc;
  }, {});

  const unorganizedLessons = lessonsByModule['unorganized'] || [];

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
        
        <div className="flex gap-2">
          {/* Create/Edit Module Dialog */}
          <Dialog open={moduleDialogOpen} onOpenChange={(open) => {
            setModuleDialogOpen(open);
            if (!open) {
              setEditingModule(null);
              moduleForm.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-module">
                <Folder className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModule ? "Edit Module" : "Create New Module"}
                </DialogTitle>
              </DialogHeader>
              <Form {...moduleForm}>
                <form onSubmit={moduleForm.handleSubmit(editingModule ? onUpdateModule : onCreateModule)} className="space-y-4">
                  <FormField
                    control={moduleForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Introduction to Marketing" {...field} data-testid="input-module-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={moduleForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of this module..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setModuleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createModuleMutation.isPending || updateModuleMutation.isPending}>
                      {editingModule 
                        ? (updateModuleMutation.isPending ? "Updating..." : "Update Module")
                        : (createModuleMutation.isPending ? "Creating..." : "Create Module")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button asChild data-testid="button-add-lesson">
            <Link href={`/training/courses/${courseId}/lessons/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {lessonsLoading || modulesLoading ? (
        <div className="text-center py-8">Loading content...</div>
      ) : (
        <div className="space-y-4">
          {/* Modules */}
          {modules.map((module: TrainingModule) => {
            const moduleLessons = lessonsByModule[module.id] || [];
            const isExpanded = expandedModules.has(module.id);
            
            return (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => toggleModule(module.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Folder className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        {module.description && (
                          <CardDescription>{module.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {moduleLessons.length} lesson{moduleLessons.length !== 1 ? 's' : ''}
                      </Badge>
                      
                      {/* Module Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModule(module)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Module
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteModuleId(module.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Module
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    {moduleLessons.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No lessons in this module yet</p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <Link href={`/training/courses/${courseId}/lessons/create?moduleId=${module.id}`}>
                            Add First Lesson
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {moduleLessons.map((lesson: TrainingLesson, index: number) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500 font-mono">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              {getContentIcon(lesson.contentType)}
                              <div>
                                <h4 className="font-medium">{lesson.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.contentType}
                                  </Badge>
                                  {lesson.isRequired && (
                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/training/courses/${courseId}/lessons/${lesson.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDeleteLessonId(lesson.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Unorganized Lessons */}
          {unorganizedLessons.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <CardTitle className="text-lg">Unorganized Lessons</CardTitle>
                    <CardDescription>
                      Lessons not assigned to any module
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {unorganizedLessons.length} lesson{unorganizedLessons.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unorganizedLessons.map((lesson: TrainingLesson, index: number) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {getContentIcon(lesson.contentType)}
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {lesson.contentType}
                            </Badge>
                            {lesson.isRequired && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/training/courses/${courseId}/lessons/${lesson.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDeleteLessonId(lesson.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {modules.length === 0 && lessons.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-center text-gray-500">
                  <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Content Yet</h3>
                  <p className="mb-6">Start by creating your first module to organize your lessons.</p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => setModuleDialogOpen(true)}>
                      <Folder className="h-4 w-4 mr-2" />
                      Create Module
                    </Button>
                    <Button asChild>
                      <Link href={`/training/courses/${courseId}/lessons/create`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Module Confirmation */}
      <AlertDialog open={!!deleteModuleId} onOpenChange={() => setDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? This action cannot be undone. 
              All lessons in this module will become unorganized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteModule}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? "Deleting..." : "Delete Module"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Confirmation */}
      <AlertDialog open={!!deleteLessonId} onOpenChange={() => setDeleteLessonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone and 
              all lesson content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteLesson}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending ? "Deleting..." : "Delete Lesson"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}