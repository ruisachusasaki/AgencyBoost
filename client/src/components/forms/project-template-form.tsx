import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertProjectTemplateSchema, type ProjectTemplate, type InsertProjectTemplate } from "@shared/schema";

interface ProjectTemplateFormProps {
  template?: ProjectTemplate | null;
  onSuccess?: () => void;
}

const categories = [
  "General",
  "Marketing Campaign", 
  "Website Development",
  "SEO Audit",
  "Social Media Management",
  "Content Creation",
  "Brand Identity",
  "Email Marketing",
  "PPC Campaign",
  "Analytics Setup",
  "E-commerce Setup",
  "Mobile App Development"
];

export default function ProjectTemplateForm({ template, onSuccess }: ProjectTemplateFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertProjectTemplate>({
    resolver: zodResolver(insertProjectTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      category: template?.category || "General",
      priority: template?.priority || "medium",
      estimatedDuration: template?.estimatedDuration || undefined,
      estimatedBudget: template?.estimatedBudget || "",
      isActive: template?.isActive ?? true,
      createdBy: "current-user", // This should be set by the backend
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertProjectTemplate) => {
      await apiRequest("POST", "/api/project-templates", data);
    },
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "The project template has been successfully created.",
      });
      onSuccess?.();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: InsertProjectTemplate) => {
      await apiRequest("PUT", `/api/project-templates/${template!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "The project template has been successfully updated.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isEditing = !!template;
  const mutation = isEditing ? updateTemplateMutation : createTemplateMutation;

  const onSubmit = (data: InsertProjectTemplate) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Marketing Campaign Setup"
                    {...field}
                    data-testid="input-template-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what this template is used for and what it includes..."
                    className="resize-none"
                    rows={3}
                    {...field}
                    data-testid="textarea-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 30"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      data-testid="input-duration"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Budget</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 10000"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-budget"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            data-testid="button-save-template"
          >
            {mutation.isPending ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}