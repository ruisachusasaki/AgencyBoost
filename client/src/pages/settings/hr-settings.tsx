import { useState, useEffect } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  MessageCircle,
  MoreHorizontal,
  GripVertical,
  Network
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JobApplicationFormEditor from "@/components/hr/job-application-form-editor";
import NewHireOnboardingFormEditor from "@/components/hr/new-hire-onboarding-form-editor";
import ExpenseReportFormEditor from "@/components/hr/expense-report-form-editor";
import OffboardingFormEditor from "@/components/hr/offboarding-form-editor";
import OrgChartStructureBuilder from "@/components/hr/org-chart-structure-builder";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

// Progression Status Manager Component
function ProgressionStatusManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any | null>(null);

  // Schema for progression status
  const progressionStatusSchema = z.object({
    value: z.string().min(1, "Value is required"),
    label: z.string().min(1, "Label is required"),
    color: z.string().min(1, "Color is required"),
    orderIndex: z.number().min(0).default(0),
    isActive: z.boolean().default(true),
  });

  type ProgressionStatusFormData = z.infer<typeof progressionStatusSchema>;

  // Fetch progression statuses
  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["/api/hr/one-on-one/progression-statuses"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProgressionStatusFormData) => {
      return await apiRequest("POST", "/api/hr/one-on-one/progression-statuses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/progression-statuses"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Progression status created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create progression status",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProgressionStatusFormData> }) => {
      return await apiRequest("PUT", `/api/hr/one-on-one/progression-statuses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/progression-statuses"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Progression status updated successfully",
      });
      setIsDialogOpen(false);
      setEditingStatus(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progression status",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/hr/one-on-one/progression-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/progression-statuses"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Progression status deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete progression status",
        variant: "destructive",
      });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedStatuses: any[]) => {
      // Update each status with new orderIndex
      const promises = reorderedStatuses.map((status, index) =>
        apiRequest("PUT", `/api/hr/one-on-one/progression-statuses/${status.id}`, { orderIndex: index })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/progression-statuses"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Progression statuses reordered successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder progression statuses",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProgressionStatusFormData>({
    resolver: zodResolver(progressionStatusSchema),
    defaultValues: {
      value: "",
      label: "",
      color: "bg-gray-100 text-gray-800",
      orderIndex: 0,
      isActive: true,
    },
  });

  const handleOpenDialog = (status?: any) => {
    if (status) {
      setEditingStatus(status);
      form.reset({
        value: status.value,
        label: status.label,
        color: status.color,
        orderIndex: status.orderIndex,
        isActive: status.isActive,
      });
    } else {
      setEditingStatus(null);
      form.reset({
        value: "",
        label: "",
        color: "bg-gray-100 text-gray-800",
        orderIndex: statuses.length,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStatus(null);
    form.reset();
  };

  const onSubmit = (data: ProgressionStatusFormData) => {
    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this progression status? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(statuses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update orderIndex for all items
    const reorderedStatuses = items.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    // Optimistically update UI
    queryClient.setQueryData(["/api/hr/one-on-one/progression-statuses"], reorderedStatuses);

    // Persist to backend
    reorderMutation.mutate(reorderedStatuses);
  };

  const colorOptions = [
    { value: "bg-red-100 text-red-800", label: "Red" },
    { value: "bg-orange-100 text-orange-800", label: "Orange" },
    { value: "bg-yellow-100 text-yellow-800", label: "Yellow" },
    { value: "bg-green-100 text-green-800", label: "Green" },
    { value: "bg-blue-100 text-blue-800", label: "Blue" },
    { value: "bg-purple-100 text-purple-800", label: "Purple" },
    { value: "bg-pink-100 text-pink-800", label: "Pink" },
    { value: "bg-gray-100 text-gray-800", label: "Gray" },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Loading progression statuses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Progression Status Options</h3>
          <p className="text-muted-foreground">
            Manage the progression status options available for 1v1 meetings
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-status">
          <Plus className="h-4 w-4 mr-2" />
          Add Status
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {statuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No progression statuses configured. Add one to get started.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <Droppable droppableId="progression-statuses">
                  {(provided) => (
                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                      {statuses.map((status: any, index: number) => (
                        <Draggable key={status.id} draggableId={status.id} index={index}>
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              data-testid={`row-status-${status.id}`}
                              className={snapshot.isDragging ? "bg-muted/50" : ""}
                            >
                              <TableCell {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                              <TableCell className="font-medium">{status.label}</TableCell>
                              <TableCell className="font-mono text-sm">{status.value}</TableCell>
                              <TableCell>
                                <Badge className={status.color}>{status.label}</Badge>
                              </TableCell>
                              <TableCell>{status.orderIndex}</TableCell>
                              <TableCell>
                                <Badge variant={status.isActive ? "default" : "secondary"}>
                                  {status.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(status)}
                                  data-testid={`button-edit-${status.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(status.id)}
                                  data-testid={`button-delete-${status.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Edit Progression Status" : "Create Progression Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? "Update the progression status details."
                : "Create a new progression status option for 1v1 meetings."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Ready for Promotion"
                        data-testid="input-label"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ready_for_promotion"
                        data-testid="input-value"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        data-testid="select-color"
                      >
                        {colorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        data-testid="input-order"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingStatus
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("time-off-types");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TimeOffCategory | null>(null);
  const [visibleTabsCount, setVisibleTabsCount] = useState(7);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Responsive tab visibility - adjusted for wider layout without max-width constraints
  useEffect(() => {
    const calculateVisibleTabs = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        setVisibleTabsCount(7); // Show all tabs on screens >= 1024px
      } else if (width >= 900) {
        setVisibleTabsCount(6);
      } else if (width >= 768) {
        setVisibleTabsCount(5);
      } else if (width >= 640) {
        setVisibleTabsCount(4);
      } else if (width >= 500) {
        setVisibleTabsCount(3);
      } else {
        setVisibleTabsCount(2);
      }
    };
    
    calculateVisibleTabs();
    window.addEventListener('resize', calculateVisibleTabs);
    
    return () => window.removeEventListener('resize', calculateVisibleTabs);
  }, []);

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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
        description: "Time off category deleted successfully",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
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
          <p className="text-slate-600">Configure time off categories and HR policies</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2">
            {(() => {
              const allTabs = [
                { id: "time-off-types", name: "Time Off Types", icon: CalendarDays },
                { id: "job-application-form", name: "Job Application Form", icon: Briefcase },
                { id: "new-hire-onboarding-form", name: "New Hire Onboarding Form", icon: Users },
                { id: "expense-report-form", name: "Expense Report Form", icon: Settings },
                { id: "offboarding-form", name: "Offboarding Form", icon: Users },
                { id: "one-on-one-settings", name: "1v1 Settings", icon: MessageCircle },
                { id: "org-chart", name: "Org Chart", icon: Network }
              ];
              
              const visibleTabs = allTabs.slice(0, visibleTabsCount);
              const overflowTabs = allTabs.slice(visibleTabsCount);
              
              return (
                <>
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                          activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.name}
                      </button>
                    );
                  })}
                  
                  {overflowTabs.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                            overflowTabs.some(tab => tab.id === activeTab)
                              ? "border-primary text-primary"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                          data-testid="tab-overflow-menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {overflowTabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <DropdownMenuItem
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center gap-2 ${
                                activeTab === tab.id ? "bg-primary/10 text-primary" : ""
                              }`}
                              data-testid={`dropdown-tab-${tab.id}`}
                            >
                              <Icon className="h-4 w-4" />
                              {tab.name}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              );
            })()}
          </nav>
        </div>

        {/* Time Off Types Tab - Simple global view of all types */}
        <TabsContent value="time-off-types" className="space-y-6">
          <GlobalTimeOffTypesManager />
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
          <ProgressionStatusManager />
        </TabsContent>

        {/* Org Chart Tab */}
        <TabsContent value="org-chart" className="space-y-6">
          <OrgChartStructureBuilder />
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

// Global Time Off Types Manager - Shows all types from all policies
function GlobalTimeOffTypesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch all policies to get a default policy for creating types
  const { data: policies = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/time-off-policies"],
  });

  // Fetch ALL time off types globally
  const { data: types = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/time-off-types"],
  });

  // Schema for time off type
  const timeOffTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    defaultDaysPerYear: z.coerce.number().min(0, "Default days must be 0 or greater"),
    allowCarryOver: z.boolean().default(false),
    maxCarryOverDays: z.coerce.number().min(0, "Max carry over days must be 0 or greater").default(0),
    color: z.string().min(1, "Color is required"),
    isActive: z.boolean().default(true),
  });

  type TimeOffTypeFormData = z.infer<typeof timeOffTypeSchema>;

  // Create mutation - uses first available policy as default
  const createMutation = useMutation({
    mutationFn: async (data: TimeOffTypeFormData) => {
      if (!policies[0]?.id) {
        throw new Error("No policy available. Please create a policy first.");
      }
      const orderIndex = types.length;
      return await apiRequest("POST", `/api/hr/time-off-policies/${policies[0].id}/types`, {
        ...data,
        orderIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-types"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Time off type created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create time off type",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeOffTypeFormData> }) => {
      return await apiRequest("PATCH", `/api/hr/time-off-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-types"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Time off type updated successfully",
      });
      setIsDialogOpen(false);
      setEditingType(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update time off type",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/hr/time-off-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-types"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Time off type deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time off type",
        variant: "destructive",
      });
    },
  });

  const form = useForm<TimeOffTypeFormData>({
    resolver: zodResolver(timeOffTypeSchema),
    defaultValues: {
      name: "",
      defaultDaysPerYear: 0,
      allowCarryOver: false,
      maxCarryOverDays: 0,
      color: "#00C9C6",
      isActive: true,
    },
  });

  const allowCarryOver = form.watch("allowCarryOver");

  const handleOpenDialog = (type?: any) => {
    if (type) {
      setEditingType(type);
      form.reset({
        name: type.name,
        defaultDaysPerYear: type.defaultDaysPerYear,
        allowCarryOver: type.allowCarryOver,
        maxCarryOverDays: type.maxCarryOverDays,
        color: type.color,
        isActive: type.isActive,
      });
    } else {
      setEditingType(null);
      form.reset({
        name: "",
        defaultDaysPerYear: 0,
        allowCarryOver: false,
        maxCarryOverDays: 0,
        color: "#00C9C6",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDeleteType = (type: any) => {
    setTypeToDelete({ id: type.id, name: type.name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (typeToDelete) {
      deleteMutation.mutate(typeToDelete.id);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
    }
  };

  const onSubmit = (data: TimeOffTypeFormData) => {
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading time off types...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Time Off Types</CardTitle>
              <CardDescription>
                Manage all time off categories for your company
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-type">
              <Plus className="w-4 h-4 mr-2" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-2">No time off types configured</p>
              <p className="text-sm text-muted-foreground">
                Add custom time off categories like Vacation Time, Sick Days, Personal Days, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {types.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  data-testid={`type-item-${type.id}`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{type.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {type.defaultDaysPerYear} days/year
                      {type.allowCarryOver && ` • Carry over up to ${type.maxCarryOverDays} days`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(type)}
                      data-testid={`button-edit-type-${type.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteType(type)}
                      data-testid={`button-delete-type-${type.id}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Time Off Type" : "Add Time Off Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the time off type details."
                : "Create a new time off category."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Vacation Time, Sick Days, Service Days"
                        data-testid="input-type-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultDaysPerYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Days Per Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="15"
                        data-testid="input-type-default-days"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        data-testid="input-type-color"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowCarryOver"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Carry Over</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Unused days can carry over to next year
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="checkbox-allow-carry-over"
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {allowCarryOver && (
                <FormField
                  control={form.control}
                  name="maxCarryOverDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Carry Over Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="5"
                          data-testid="input-max-carry-over"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save">
                  {editingType ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Off Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Time Off Types Manager Component
function TimeOffTypesManager({ policyId }: { policyId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{ id: string; name: string } | null>(null);

  // Schema for time off type
  const timeOffTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    defaultDaysPerYear: z.coerce.number().min(0, "Default days must be 0 or greater"),
    allowCarryOver: z.boolean().default(false),
    maxCarryOverDays: z.coerce.number().min(0, "Max carry over days must be 0 or greater").default(0),
    color: z.string().min(1, "Color is required"),
    isActive: z.boolean().default(true),
  });

  type TimeOffTypeFormData = z.infer<typeof timeOffTypeSchema>;

  // Fetch time off types
  const { data: types = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/hr/time-off-policies/${policyId}/types`],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TimeOffTypeFormData) => {
      const orderIndex = types.length;
      return await apiRequest("POST", `/api/hr/time-off-policies/${policyId}/types`, {
        ...data,
        orderIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/time-off-policies/${policyId}/types`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Time off type created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create time off type",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeOffTypeFormData> }) => {
      return await apiRequest("PATCH", `/api/hr/time-off-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/time-off-policies/${policyId}/types`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Time off type updated successfully",
      });
      setIsDialogOpen(false);
      setEditingType(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update time off type",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/hr/time-off-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/time-off-policies/${policyId}/types`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Time off type deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time off type",
        variant: "destructive",
      });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; orderIndex: number }>) => {
      return await apiRequest("PATCH", "/api/hr/time-off-types/reorder", { updates });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder time off types",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/hr/time-off-policies/${policyId}/types`] });
    },
  });

  const form = useForm<TimeOffTypeFormData>({
    resolver: zodResolver(timeOffTypeSchema),
    defaultValues: {
      name: "",
      defaultDaysPerYear: 0,
      allowCarryOver: false,
      maxCarryOverDays: 0,
      color: "#00C9C6",
      isActive: true,
    },
  });

  const allowCarryOver = form.watch("allowCarryOver");

  const handleOpenDialog = (type?: any) => {
    if (type) {
      setEditingType(type);
      form.reset({
        name: type.name,
        defaultDaysPerYear: type.defaultDaysPerYear,
        allowCarryOver: type.allowCarryOver,
        maxCarryOverDays: type.maxCarryOverDays,
        color: type.color,
        isActive: type.isActive,
      });
    } else {
      setEditingType(null);
      form.reset({
        name: "",
        defaultDaysPerYear: 0,
        allowCarryOver: false,
        maxCarryOverDays: 0,
        color: "#00C9C6",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    form.reset();
  };

  const onSubmit = (data: TimeOffTypeFormData) => {
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteType = (type: any) => {
    console.log("Deleting type:", type);
    console.log("Type ID:", type.id);
    console.log("Policy ID:", policyId);
    setTypeToDelete({ id: type.id, name: type.name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (typeToDelete) {
      console.log("Confirming delete for ID:", typeToDelete.id);
      deleteMutation.mutate(typeToDelete.id);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(types);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((item, index) => ({
      id: item.id,
      orderIndex: index,
    }));

    queryClient.setQueryData(["/api/hr/time-off-policies", policyId, "types"], items);
    reorderMutation.mutate(updates);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading time off types...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Time Off Types</CardTitle>
            <CardDescription>
              Configure custom time off categories with individual settings
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-type">
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">No time off types configured</p>
            <p className="text-sm text-muted-foreground">
              Add custom time off categories like Annual Leave, Sick Days, etc.
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="types">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {types.map((type, index) => (
                    <Draggable key={type.id} draggableId={type.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          data-testid={`type-item-${type.id}`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{type.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {type.defaultDaysPerYear} days/year
                              {type.allowCarryOver && ` • Carry over up to ${type.maxCarryOverDays} days`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(type)}
                              data-testid={`button-edit-type-${type.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteType(type)}
                              data-testid={`button-delete-type-${type.id}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Time Off Type" : "Add Time Off Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the time off type details."
                : "Create a new time off category with custom settings."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Annual Leave, Sick Days"
                        data-testid="input-type-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultDaysPerYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Days Per Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="15"
                          data-testid="input-type-default-days"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input
                          type="color"
                          data-testid="input-type-color"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowCarryOver"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Carry Over</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow unused days to carry over to next year
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="input-type-carry-over"
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {allowCarryOver && (
                <FormField
                  control={form.control}
                  name="maxCarryOverDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Carry Over Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="5"
                          data-testid="input-type-max-carry-over"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel-type"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-type"
                >
                  {editingType ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Off Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
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

  // Fetch time off types for the first policy
  const { data: types = [] } = useQuery<any[]>({
    queryKey: [`/api/hr/time-off-policies/${policies[0]?.id}/types`],
    enabled: !!policies[0]?.id,
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
        variant: "default",
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

  // Calculate aggregated metrics from types
  const hasTypes = types.length > 0;
  const totalDefaultDays = types.reduce((sum: number, type: any) => sum + (type.defaultDaysPerYear || 0), 0);
  const typesWithCarryOver = types.filter((type: any) => type.allowCarryOver);

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
        <>
          {!hasTypes && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Ready to Configure Time Off Types</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create custom time off categories below to replace the legacy vacation/sick/personal days structure. Each type can have individual carry-over settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{policies[0].name}</CardTitle>
              <CardDescription>{policies[0].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {hasTypes ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold" style={{ color: 'hsl(179, 100%, 39%)' }}>{types.length}</div>
                      <div className="text-sm text-muted-foreground">Time Off Types</div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold" style={{ color: 'hsl(179, 100%, 39%)' }}>{totalDefaultDays}</div>
                      <div className="text-sm text-muted-foreground">Total Annual Days</div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold" style={{ color: 'hsl(179, 100%, 39%)' }}>{typesWithCarryOver.length}</div>
                      <div className="text-sm text-muted-foreground">Allow Carry Over</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {types.slice(0, 5).map((type: any) => (
                      <Badge key={type.id} variant="secondary" className="gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                        {type.name}
                      </Badge>
                    ))}
                    {types.length > 5 && (
                      <Badge variant="outline">+{types.length - 5} more</Badge>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{policies[0].vacationDaysDefault}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-500">Annual Vacation Days (Legacy)</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{policies[0].sickDaysDefault}</div>
                      <div className="text-sm text-orange-700 dark:text-orange-500">Annual Sick Days (Legacy)</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{policies[0].personalDaysDefault}</div>
                      <div className="text-sm text-green-700 dark:text-green-500">Annual Personal Days (Legacy)</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Effective Date:</strong> {new Date(policies[0].effectiveDate).toLocaleDateString()}</p>
                    <p><strong>Carry Over:</strong> {policies[0].carryOverAllowed ? `Yes (Max ${policies[0].maxCarryOverDays} days)` : 'Not allowed'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {policies[0] && <TimeOffTypesManager policyId={policies[0].id} />}
        </>
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