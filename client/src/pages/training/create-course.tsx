import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { Link } from "wouter";
import { ThumbnailUpload } from "@/components/training/ThumbnailUpload";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  categoryId: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  thumbnailUrl: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Allow empty strings
    return val.startsWith("/") || val.match(/^https?:\/\//); // Allow relative URLs or full URLs
  }, "Invalid URL format"),
  isPublished: z.boolean(),
  tags: z.array(z.string()).default([]),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function CreateCourse() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/training/categories"],
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string }) =>
      fetch("/api/training/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: async (response) => {
      if (response.ok) {
        const newCategory = await response.json();
        toast({
          title: "Success",
          variant: "success",
          description: "Category created successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/training/categories"] });
        setCategoryDialogOpen(false);
        setNewCategoryName("");
        // Automatically select the new category
        form.setValue("categoryId", newCategory.id);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create category",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: `${newCategoryName.trim()} training courses`,
      color: "#3b82f6", // Default blue color
    });
  };

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      shortDescription: "",
      categoryId: "",
      difficulty: "beginner",
      estimatedDuration: undefined,
      thumbnailUrl: "",
      isPublished: false,
      tags: [],
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: CourseFormData) =>
      fetch("/api/training/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: async (response) => {
      if (response.ok) {
        const course = await response.json();
        toast({
          title: "Success",
          variant: "success",
          description: "Course created successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/training/courses"] });
        setLocation(`/training/courses/${course.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create course",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CourseFormData) => {
    createCourseMutation.mutate(data);
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6" data-testid="create-course-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href="/training">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Training
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Course</CardTitle>
            <CardDescription>
              Create a comprehensive training course for your team. Add lessons, quizzes, and assignments after creating the course.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter course title" {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief course summary for cards" {...field} data-testid="input-short-description" />
                          </FormControl>
                          <FormDescription>
                            A brief summary shown on course cards (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  data-testid="button-add-category"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create New Category</DialogTitle>
                                  <DialogDescription>
                                    Add a new training category to organize your courses.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <label htmlFor="category-name" className="text-sm font-medium">
                                      Category Name
                                    </label>
                                    <Input
                                      id="category-name"
                                      placeholder="e.g. Sales Training"
                                      value={newCategoryName}
                                      onChange={(e) => setNewCategoryName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleCreateCategory();
                                        }
                                      }}
                                      data-testid="input-category-name"
                                    />
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setCategoryDialogOpen(false);
                                      setNewCategoryName("");
                                    }}
                                    data-testid="button-cancel-category"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                                    data-testid="button-create-category"
                                  >
                                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-difficulty">
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Settings */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="60" 
                              {...field} 
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-duration"
                            />
                          </FormControl>
                          <FormDescription>
                            Total estimated time to complete the course
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="thumbnailUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ThumbnailUpload
                              value={field.value}
                              onChange={field.onChange}
                              onRemove={() => field.onChange("")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Publish Course</FormLabel>
                            <FormDescription>
                              Make this course visible to all users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-published"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of what students will learn in this course..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the course content and learning objectives
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div className="space-y-3">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      data-testid="input-new-tag"
                    />
                    <Button type="button" onClick={addTag} data-testid="button-add-tag">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {form.watch("tags").length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.watch("tags").map((tag) => (
                        <Badge key={tag} variant="secondary" className="pr-1" data-testid={`tag-${tag}`}>
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-gray-300 rounded p-0.5"
                            data-testid={`remove-tag-${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    Add tags to help users find your course
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/training">Cancel</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCourseMutation.isPending}
                    data-testid="button-create-course"
                  >
                    {createCourseMutation.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}