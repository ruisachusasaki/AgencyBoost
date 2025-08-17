import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema, type Lead, type InsertLead, type CustomField, type CustomFieldFolder, type LeadPipelineStage, type Tag, type User } from "@shared/schema";
import { ArrowRight, UserPlus, X, Trash2 } from "lucide-react";
import { z } from "zod";

interface CustomFieldsLeadFormProps {
  lead?: Lead | null;
  onSuccess?: () => void;
}

export default function CustomFieldsLeadForm({ lead, onSuccess }: CustomFieldsLeadFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  // Fetch custom fields and folders
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
  });

  const { data: customFieldFolders = [] } = useQuery<CustomFieldFolder[]>({
    queryKey: ["/api/custom-field-folders"],
  });

  const { data: pipelineStages = [] } = useQuery<LeadPipelineStage[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const { data: staff = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      company: lead?.company || "",
      source: lead?.source || "",
      status: lead?.status || "new",
      value: lead?.value || "",
      probability: lead?.probability || 0,
      notes: lead?.notes || "",
      assignedTo: lead?.assignedTo || "unassigned",
      lastContactDate: lead?.lastContactDate ? new Date(lead.lastContactDate) : undefined,
      stageId: lead?.stageId || pipelineStages.find(s => s.isDefault)?.id || "",
      tags: lead?.tags || [],
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead & { customFields?: Record<string, any> }) => {
      return await apiRequest("/api/leads", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead created",
        description: "The lead has been successfully created with custom fields.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: InsertLead & { customFields?: Record<string, any> }) => {
      return await apiRequest(`/api/leads/${lead!.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated with custom fields.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("No lead to convert");
      
      const clientData = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        customFields: customFieldValues,
        leadId: lead.id // Track original lead
      };
      
      const response = await apiRequest("/api/clients", "POST", clientData);
      
      // Update lead status to "won" and mark as converted
      await apiRequest(`/api/leads/${lead.id}`, "PUT", {
        ...lead,
        status: "won",
      });
      
      return response;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Lead converted successfully!",
        description: `${lead?.name} has been converted to a client and moved to Won status.`,
      });
      setShowConvertDialog(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Conversion failed",
        description: error.message || "Failed to convert lead to client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/leads/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLead = () => {
    if (!lead) return;
    if (confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      deleteLeadMutation.mutate(lead.id);
    }
  };

  const onSubmit = (data: InsertLead) => {
    const submissionData = {
      ...data,
      assignedTo: data.assignedTo === "unassigned" ? null : data.assignedTo,
      customFields: customFieldValues,
    };
    
    if (lead) {
      updateLeadMutation.mutate(submissionData);
    } else {
      createLeadMutation.mutate(submissionData);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Filter custom fields to exclude duplicates of built-in lead fields
  const filteredCustomFields = customFields.filter(field => {
    const duplicateFields = ['first name', 'last name', 'name', 'email', 'phone', 'company'];
    const isDuplicate = duplicateFields.some(dup => 
      field.name.toLowerCase().includes(dup)
    );
    return !isDuplicate;
  });

  // Group filtered custom fields by folder
  const fieldsWithoutFolder = filteredCustomFields.filter(field => !field.folderId);
  const fieldsByFolder = customFieldFolders.reduce((acc, folder) => {
    acc[folder.id] = filteredCustomFields.filter(field => field.folderId === folder.id);
    return acc;
  }, {} as Record<string, CustomField[]>);

  const isLoading = createLeadMutation.isPending || updateLeadMutation.isPending;
  const canConvert = lead && lead.status !== "won" && lead.status !== "lost";

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Core Lead Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Lead name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="lead@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+1 (555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pipeline stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pipelineStages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: stage.color }}
                                />
                                {stage.name}
                              </div>
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
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="text-muted-foreground">Unassigned</div>
                          </SelectItem>
                          {staff.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </div>
                                {user.firstName} {user.lastName}
                                <span className="text-xs text-muted-foreground">({user.role})</span>
                              </div>
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
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potential Value</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="number" placeholder="10000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {/* Selected Tags */}
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((tagName: string, index: number) => {
                              const tag = tags.find(t => t.name === tagName);
                              return (
                                <Badge 
                                  key={index}
                                  variant="secondary" 
                                  className="flex items-center gap-1"
                                  style={{ backgroundColor: tag?.color ? `${tag.color}20` : undefined }}
                                >
                                  {tagName}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => {
                                      const newTags = field.value.filter((_: string, i: number) => i !== index);
                                      field.onChange(newTags);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Tag Selection */}
                        <Select
                          onValueChange={(tagName) => {
                            const currentTags = field.value || [];
                            if (!currentTags.includes(tagName)) {
                              field.onChange([...currentTags, tagName]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tags to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {tags
                              .filter(tag => !field.value?.includes(tag.name))
                              .map((tag) => (
                                <SelectItem key={tag.id} value={tag.name}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: tag.color || "#46a1a0" }}
                                    />
                                    {tag.name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Custom Fields
                <Badge variant="secondary">{filteredCustomFields.length} fields</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {/* Fields without folder */}
                {fieldsWithoutFolder.length > 0 && (
                  <AccordionItem value="no-folder">
                    <AccordionTrigger className="text-sm font-medium">
                      General Fields ({fieldsWithoutFolder.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fieldsWithoutFolder.map((field) => (
                          <div key={field.id}>
                            <CustomFieldRenderer
                              field={field}
                              clientId={lead?.id || 'new'}
                              value={customFieldValues[field.id] || ''}
                              onChange={(value) => handleCustomFieldChange(field.id, value)}
                              showLabel={true}
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Fields grouped by folder */}
                {customFieldFolders.map((folder) => {
                  const folderFields = fieldsByFolder[folder.id] || [];
                  if (folderFields.length === 0) return null;
                  
                  return (
                    <AccordionItem key={folder.id} value={folder.id}>
                      <AccordionTrigger className="text-sm font-medium">
                        {folder.name} ({folderFields.length} fields)
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {folderFields.map((field) => (
                            <div key={field.id}>
                              <CustomFieldRenderer
                                field={field}
                                clientId={lead?.id || 'new'}
                                value={customFieldValues[field.id] || ''}
                                onChange={(value) => handleCustomFieldChange(field.id, value)}
                                showLabel={true}
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancel
              </Button>
              {canConvert && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowConvertDialog(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Convert to Client
                </Button>
              )}
              {lead && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteLead}
                  disabled={deleteLeadMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteLeadMutation.isPending ? "Deleting..." : "Delete Lead"}
                </Button>
              )}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Convert to Client Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Client</DialogTitle>
            <DialogDescription>
              This will create a new client with all the lead information and custom fields, 
              and mark the lead as "Won". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900">Lead Information</h4>
              <p className="text-sm text-blue-700">Name: {lead?.name}</p>
              <p className="text-sm text-blue-700">Email: {lead?.email}</p>
              <p className="text-sm text-blue-700">Company: {lead?.company}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900">What will happen:</h4>
              <ul className="text-sm text-green-700 list-disc list-inside">
                <li>Create new client with lead data</li>
                <li>Transfer all custom field values</li>
                <li>Mark lead as "Won"</li>
                <li>Link lead to new client record</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => convertToClientMutation.mutate()}
                disabled={convertToClientMutation.isPending}
                className="flex items-center gap-2"
              >
                {convertToClientMutation.isPending ? "Converting..." : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Convert to Client
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}