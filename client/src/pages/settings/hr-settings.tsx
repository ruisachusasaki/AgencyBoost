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
  Clock,
  Briefcase,
  ArrowLeft,
  MessageCircle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JobApplicationFormEditor from "@/components/hr/job-application-form-editor";
import NewHireOnboardingFormEditor from "@/components/hr/new-hire-onboarding-form-editor";
import ExpenseReportFormEditor from "@/components/hr/expense-report-form-editor";
import OffboardingFormEditor from "@/components/hr/offboarding-form-editor";
import { Link } from "wouter";

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
      {/* Back to Settings */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="categories" className="flex items-center gap-1.5 px-2">
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Time Off Categories</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-1.5 px-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Policies</span>
          </TabsTrigger>
          <TabsTrigger value="job-application-form" className="flex items-center gap-1.5 px-2">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Job Application Form</span>
          </TabsTrigger>
          <TabsTrigger value="new-hire-onboarding-form" className="flex items-center gap-1.5 px-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">New Hire Onboarding Form</span>
          </TabsTrigger>
          <TabsTrigger value="expense-report-form" className="flex items-center gap-1.5 px-2">
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Expense Report Form</span>
          </TabsTrigger>
          <TabsTrigger value="offboarding-form" className="flex items-center gap-1.5 px-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Offboarding Form</span>
          </TabsTrigger>
          <TabsTrigger value="one-on-one-settings" className="flex items-center gap-1.5 px-2">
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">1v1 Settings</span>
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
          <TimeOffPolicyManager />
        </TabsContent>

        {/* Job Application Form Tab */}
        <TabsContent value="job-application-form" className="space-y-6">
          <JobApplicationFormEditor />
        </TabsContent>

        {/* New Hire Onboarding Form Tab */}
        <TabsContent value="new-hire-onboarding-form" className="space-y-6">
          <NewHireOnboardingFormEditor />
        </TabsContent>

        {/* Expense Report Form Tab */}
        <TabsContent value="expense-report-form" className="space-y-6">
          <ExpenseReportFormEditor />
        </TabsContent>

        {/* Offboarding Form Tab */}
        <TabsContent value="offboarding-form" className="space-y-6">
          <OffboardingFormEditor />
        </TabsContent>

        {/* 1v1 Settings Tab */}
        <TabsContent value="one-on-one-settings" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">1v1 Meeting Settings</h3>
            <p className="text-muted-foreground">
              Configure settings for 1v1 meetings between managers and direct reports.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Configuration</CardTitle>
              <CardDescription>
                Customize how 1v1 meetings are scheduled and tracked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Settings for 1v1 meetings will be configured here.
              </p>
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

// Time Off Policy Manager Component
function TimeOffPolicyManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch policies
  const { data: policies = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/time-off-policies"],
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/hr/time-off-policies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-policies"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Time off policy saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save policy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "Standard Company Policy",
      description: "Default company time off policy",
      vacationDaysDefault: 15,
      sickDaysDefault: 10,
      personalDaysDefault: 3,
      carryOverAllowed: false,
      maxCarryOverDays: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      policyDocument: ""
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Time Off Policies</h3>
          <p className="text-muted-foreground">
            Configure company-wide time off allocations and policies
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {policies.length > 0 ? "Edit Policy" : "Create Policy"}
        </Button>
      </div>

      {policies.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{policies[0].name}</CardTitle>
            <CardDescription>{policies[0].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{policies[0].vacationDaysDefault}</div>
                <div className="text-sm text-blue-700">Annual Vacation Days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{policies[0].sickDaysDefault}</div>
                <div className="text-sm text-orange-700">Annual Sick Days</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{policies[0].personalDaysDefault}</div>
                <div className="text-sm text-green-700">Annual Personal Days</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Effective Date:</strong> {new Date(policies[0].effectiveDate).toLocaleDateString()}</p>
              <p><strong>Carry Over:</strong> {policies[0].carryOverAllowed ? `Yes (Max ${policies[0].maxCarryOverDays} days)` : 'Not allowed'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No time off policy configured</p>
            <p className="text-sm text-muted-foreground mb-4">Create a policy to set default time off allocations for all employees</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Time Off Policy</DialogTitle>
            <DialogDescription>
              Configure default time off allocations for all employees
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                      <Textarea {...field} placeholder="Brief description of this policy" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vacationDaysDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vacation Days (Annual)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sickDaysDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sick Days (Annual)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalDaysDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Days (Annual)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Policy"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}