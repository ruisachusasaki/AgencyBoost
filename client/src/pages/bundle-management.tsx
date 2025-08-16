import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Settings, Calendar, Play, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema for bundle task templates
const bundleTaskTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: z.string().optional(),
  dayOffset: z.number().default(0),
});

// Schema for client bundle assignment
const clientBundleSchema = z.object({
  bundleId: z.string().min(1, 'Bundle is required'),
  projectId: z.string().min(1, 'Project is required'),
  status: z.enum(['active', 'paused', 'completed']).default('active'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

// Schema for task generation
const taskGenerationSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
});

type BundleTaskTemplate = z.infer<typeof bundleTaskTemplateSchema>;
type ClientBundle = z.infer<typeof clientBundleSchema>;
type TaskGeneration = z.infer<typeof taskGenerationSchema>;

export default function BundleManagement() {
  const [selectedBundle, setSelectedBundle] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch bundles
  const { data: bundles = [] } = useQuery({
    queryKey: ['/api/product-bundles'],
  }) as { data: any[] };

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['/api/clients'],
  });
  const clients = (clientsData as any)?.clients || [];

  // Fetch projects for selected client
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!selectedClient,
  }) as { data: any[] };

  // Fetch staff members
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
  }) as { data: any[] };

  // Fetch bundle templates
  const { data: templates = [] } = useQuery({
    queryKey: [`/api/bundles/${selectedBundle}/task-templates`],
    enabled: !!selectedBundle,
  }) as { data: any[] };

  // Fetch client bundles
  const { data: clientBundles = [] } = useQuery({
    queryKey: [`/api/clients/${selectedClient}/bundles`],
    enabled: !!selectedClient,
  }) as { data: any[] };

  // Template form
  const templateForm = useForm<BundleTaskTemplate>({
    resolver: zodResolver(bundleTaskTemplateSchema),
    defaultValues: {
      title: '',
      description: '',
      quantity: 1,
      priority: 'medium',
      assignedTo: '',
      dayOffset: 0,
    },
  });

  // Assignment form
  const assignmentForm = useForm<ClientBundle>({
    resolver: zodResolver(clientBundleSchema),
    defaultValues: {
      bundleId: '',
      projectId: '',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  // Generation form
  const generationForm = useForm<TaskGeneration>({
    resolver: zodResolver(taskGenerationSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: BundleTaskTemplate) =>
      fetch(`/api/bundles/${selectedBundle}/task-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bundles/${selectedBundle}/task-templates`] });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
      toast({ title: 'Success', description: 'Task template created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: (data: BundleTaskTemplate) =>
      fetch(`/api/bundles/${selectedBundle}/task-templates/${editingTemplate?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bundles/${selectedBundle}/task-templates`] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
      toast({ title: 'Success', description: 'Task template updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      fetch(`/api/bundles/${selectedBundle}/task-templates/${templateId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bundles/${selectedBundle}/task-templates`] });
      toast({ title: 'Success', description: 'Task template deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Assign bundle mutation
  const assignBundleMutation = useMutation({
    mutationFn: (data: ClientBundle) =>
      fetch(`/api/clients/${selectedClient}/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${selectedClient}/bundles`] });
      setIsAssignmentDialogOpen(false);
      assignmentForm.reset();
      toast({ title: 'Success', description: 'Bundle assigned to client successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Generate tasks mutation
  const generateTasksMutation = useMutation({
    mutationFn: (data: TaskGeneration) =>
      fetch('/api/generate-monthly-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsGenerationDialogOpen(false);
      generationForm.reset();
      toast({ 
        title: 'Success', 
        description: `Generated ${data.tasksCreated} tasks for ${data.month}/${data.year}` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleTemplateSubmit = (data: BundleTaskTemplate) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate(data);
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset({
      title: template.title,
      description: template.description || '',
      quantity: template.quantity,
      priority: template.priority,
      assignedTo: template.assignedTo || '',
      dayOffset: template.dayOffset,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this task template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6" data-testid="bundle-management-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Bundle Management</h1>
          <p className="text-muted-foreground">
            Manage marketing service bundles and automate recurring task generation
          </p>
        </div>
        <Button
          onClick={() => setIsGenerationDialogOpen(true)}
          className="flex items-center gap-2"
          data-testid="button-generate-tasks"
        >
          <Play className="h-4 w-4" />
          Generate Monthly Tasks
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">Bundle Templates</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">Client Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Task Templates</CardTitle>
              <CardDescription>
                Define what tasks each bundle creates when assigned to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                  <SelectTrigger className="w-[300px]" data-testid="select-bundle">
                    <SelectValue placeholder="Select a bundle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bundles.map((bundle: any) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={!selectedBundle}
                      className="flex items-center gap-2"
                      data-testid="button-add-template"
                    >
                      <Plus className="h-4 w-4" />
                      Add Task Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'Edit' : 'Add'} Task Template
                      </DialogTitle>
                      <DialogDescription>
                        Define a task that will be created automatically when this bundle is assigned
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...templateForm}>
                      <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-4">
                        <FormField
                          control={templateForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Title</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="e.g., Blog Post #{sequence}"
                                  data-testid="input-task-title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Task description..."
                                  data-testid="input-task-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={templateForm.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    min={1}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-task-quantity"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={templateForm.control}
                            name="dayOffset"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Day Offset</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    min={0}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-task-day-offset"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={templateForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-task-priority">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="assignedTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned To</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-task-assignee">
                                    <SelectValue placeholder="Select assignee (optional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
                                  {staff.map((member: any) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.firstName} {member.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsTemplateDialogOpen(false);
                              setEditingTemplate(null);
                              templateForm.reset();
                            }}
                            data-testid="button-cancel-template"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                            data-testid="button-save-template"
                          >
                            {editingTemplate ? 'Update' : 'Create'} Template
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {selectedBundle && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Task Templates for {bundles.find((b: any) => b.id === selectedBundle)?.name}
                  </h3>
                  {templates.length === 0 ? (
                    <p className="text-muted-foreground" data-testid="text-no-templates">
                      No task templates defined for this bundle yet.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {templates.map((template: any) => (
                        <Card key={template.id} data-testid={`card-template-${template.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{template.title}</h4>
                                  <Badge className={getPriorityColor(template.priority)}>
                                    {template.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {template.quantity}x
                                  </Badge>
                                </div>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {template.description}
                                  </p>
                                )}
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  {template.assignedTo && (
                                    <span>
                                      Assigned: {staff.find((s: any) => s.id === template.assignedTo)?.firstName} {staff.find((s: any) => s.id === template.assignedTo)?.lastName}
                                    </span>
                                  )}
                                  <span>Due: +{template.dayOffset} days</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditTemplate(template)}
                                  data-testid={`button-edit-template-${template.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  data-testid={`button-delete-template-${template.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Bundle Assignments</CardTitle>
              <CardDescription>
                Assign bundles to clients for automatic monthly task generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-[300px]" data-testid="select-client">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company || `${client.firstName} ${client.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={!selectedClient}
                      className="flex items-center gap-2"
                      data-testid="button-assign-bundle"
                    >
                      <Plus className="h-4 w-4" />
                      Assign Bundle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Bundle to Client</DialogTitle>
                      <DialogDescription>
                        This will enable automatic monthly task generation for the selected bundle
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...assignmentForm}>
                      <form onSubmit={assignmentForm.handleSubmit((data) => assignBundleMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={assignmentForm.control}
                          name="bundleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bundle</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-assignment-bundle">
                                    <SelectValue placeholder="Select bundle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bundles.filter((b: any) => b.status === 'active').map((bundle: any) => (
                                    <SelectItem key={bundle.id} value={bundle.id}>
                                      {bundle.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-assignment-project">
                                    <SelectValue placeholder="Select project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projects.filter((p: any) => p.clientId === selectedClient).map((project: any) => (
                                    <SelectItem key={project.id} value={project.id}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="date"
                                  data-testid="input-assignment-start-date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="date"
                                  data-testid="input-assignment-end-date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-assignment-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAssignmentDialogOpen(false);
                              assignmentForm.reset();
                            }}
                            data-testid="button-cancel-assignment"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={assignBundleMutation.isPending}
                            data-testid="button-save-assignment"
                          >
                            Assign Bundle
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {selectedClient && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Bundle Assignments for {clients.find((c: any) => c.id === selectedClient)?.company || clients.find((c: any) => c.id === selectedClient)?.firstName}
                  </h3>
                  {clientBundles.length === 0 ? (
                    <p className="text-muted-foreground" data-testid="text-no-assignments">
                      No bundles assigned to this client yet.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {clientBundles.map((assignment: any) => (
                        <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{assignment.bundle.name}</h4>
                                  <Badge className={getStatusColor(assignment.status)}>
                                    {assignment.status}
                                  </Badge>
                                </div>
                                {assignment.bundle.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {assignment.bundle.description}
                                  </p>
                                )}
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>Started: {new Date(assignment.startDate).toLocaleDateString()}</span>
                                  {assignment.endDate && (
                                    <span>Ends: {new Date(assignment.endDate).toLocaleDateString()}</span>
                                  )}
                                  {assignment.lastTaskGeneration && (
                                    <span>Last Generated: {new Date(assignment.lastTaskGeneration).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Generation Dialog */}
      <Dialog open={isGenerationDialogOpen} onOpenChange={setIsGenerationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Monthly Tasks</DialogTitle>
            <DialogDescription>
              Create recurring tasks for all active client bundles for the specified month
            </DialogDescription>
          </DialogHeader>
          <Form {...generationForm}>
            <form onSubmit={generationForm.handleSubmit((data) => generateTasksMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={generationForm.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-generation-month">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString()}>
                              {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generationForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min={2024}
                          max={2030}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-generation-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsGenerationDialogOpen(false);
                    generationForm.reset();
                  }}
                  data-testid="button-cancel-generation"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={generateTasksMutation.isPending}
                  data-testid="button-start-generation"
                >
                  Generate Tasks
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}