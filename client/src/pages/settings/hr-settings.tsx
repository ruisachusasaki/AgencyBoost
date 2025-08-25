import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  Users,
  CalendarDays,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for time off categories
const timeOffCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  defaultHours: z.number().min(0).max(24).default(8),
  isActive: z.boolean().default(true),
});

type TimeOffCategoryFormData = z.infer<typeof timeOffCategorySchema>;

interface TimeOffCategory {
  id: string;
  name: string;
  description?: string;
  defaultHours: number;
  isActive: boolean;
  createdAt: string;
}

export default function HRSettingsPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TimeOffCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default time off categories if none exist
  const defaultCategories: Omit<TimeOffCategory, 'id' | 'createdAt'>[] = [
    { name: "PTO", description: "Paid Time Off", defaultHours: 8, isActive: true },
    { name: "Sick Leave", description: "Medical leave for illness", defaultHours: 8, isActive: true },
    { name: "Unpaid Time Off", description: "Time off without pay", defaultHours: 8, isActive: true },
  ];

  // For now, we'll use static data since we don't have the backend routes yet
  const [categories, setCategories] = useState<TimeOffCategory[]>(
    defaultCategories.map((cat, index) => ({
      ...cat,
      id: `cat-${index + 1}`,
      createdAt: new Date().toISOString(),
    }))
  );

  const form = useForm<TimeOffCategoryFormData>({
    resolver: zodResolver(timeOffCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      defaultHours: 8,
      isActive: true,
    },
  });

  const handleOpenDialog = (category?: TimeOffCategory) => {
    if (category) {
      setEditingCategory(category);
      form.reset({
        name: category.name,
        description: category.description || "",
        defaultHours: category.defaultHours,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      form.reset({
        name: "",
        description: "",
        defaultHours: 8,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const onSubmit = (data: TimeOffCategoryFormData) => {
    if (editingCategory) {
      // Update existing category
      setCategories(prev => 
        prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...data }
            : cat
        )
      );
      toast({
        title: "Success",
        description: "Time off category updated successfully",
      });
    } else {
      // Create new category
      const newCategory: TimeOffCategory = {
        id: `cat-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: "Success",
        description: "Time off category created successfully",
      });
    }
    handleCloseDialog();
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Success",
        description: "Time off category deleted successfully",
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <span>HR Settings</span>
          </h1>
          <p className="text-slate-600">Configure HR policies and time off categories</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Time Off Categories
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General Settings
          </TabsTrigger>
        </TabsList>

        {/* Time Off Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Time Off Categories</h3>
              <p className="text-muted-foreground">
                Manage the types of time off employees can request.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <Card>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No time off categories configured. Add one to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Default Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {category.description || "—"}
                        </TableCell>
                        <TableCell>{category.defaultHours} hours</TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(category)}
                              data-testid={`button-edit-${category.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              data-testid={`button-delete-${category.id}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Time Off Policies</h3>
            <p className="text-muted-foreground">
              Configure approval workflows and time off accrual rules.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                Time off policies configuration coming soon. This will include approval workflows, 
                accrual rates, and carryover rules.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">General HR Settings</h3>
            <p className="text-muted-foreground">
              Configure global HR system settings and preferences.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                General HR settings coming soon. This will include working hours, 
                holidays, and notification preferences.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Time Off Category" : "Create Time Off Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the time off category details."
                : "Create a new category for time off requests."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., PTO, Sick Leave"
                        data-testid="input-name"
                        {...field}
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of this category"
                        data-testid="input-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Hours Per Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        placeholder="8"
                        data-testid="input-default-hours"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}