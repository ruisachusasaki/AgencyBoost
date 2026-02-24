import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Mail, MessageCircle, Folder, FolderPlus, Calendar, Eye, Copy, BarChart3, Tag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { TemplateFolder, EmailTemplate, SmsTemplate } from "@shared/schema";

export default function Campaigns() {
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [smsSearchTerm, setSmsSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("email");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | SmsTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [smsContent, setSmsContent] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch custom fields for dynamic merge tags
  const { data: customFields = [] } = useQuery({
    queryKey: ["/api/custom-fields"],
  });

  // Define available merge tags based on client schema - dynamic with custom fields
  const mergeTagGroups = [
    {
      label: "Contact Information",
      tags: [
        { label: "Name", value: "{{name}}" },
        { label: "Email", value: "{{email}}" },
        { label: "Phone", value: "{{phone}}" },
        { label: "Company", value: "{{company}}" },
        { label: "Position", value: "{{position}}" },
        { label: "Website", value: "{{website}}" },
      ]
    },
    {
      label: "Address",
      tags: [
        { label: "Street Address", value: "{{address}}" },
        { label: "Address Line 2", value: "{{address2}}" },
        { label: "City", value: "{{city}}" },
        { label: "State", value: "{{state}}" },
        { label: "Zip Code", value: "{{zipCode}}" },
      ]
    },
    {
      label: "Business Information",
      tags: [
        { label: "Client Vertical", value: "{{clientVertical}}" },
        { label: "Monthly Revenue", value: "{{mrr}}" },
        { label: "Payment Terms", value: "{{paymentTerms}}" },
        { label: "Invoicing Contact", value: "{{invoicingContact}}" },
        { label: "Invoicing Email", value: "{{invoicingEmail}}" },
      ]
    },
    {
      label: "Other",
      tags: [
        { label: "Notes", value: "{{notes}}" },
        { label: "Contact Source", value: "{{contactSource}}" },
      ]
    },
    // Dynamically add custom fields if they exist
    ...(Array.isArray(customFields) && customFields.length > 0 ? [{
      label: "Custom Fields",
      tags: customFields.map((field: any) => ({
        label: field.name,
        value: `{{custom.${field.name.toLowerCase().replace(/\s+/g, '_')}}}`
      }))
    }] : [])
  ];

  // Fetch data
  const { data: templateFolders = [], isLoading: loadingFolders } = useQuery<TemplateFolder[]>({
    queryKey: ["/api/template-folders"],
  });

  const { data: emailTemplates = [], isLoading: loadingEmailTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const { data: smsTemplates = [], isLoading: loadingSmsTemplates } = useQuery<SmsTemplate[]>({
    queryKey: ["/api/sms-templates"],
  });

  // Filter folders by type
  const emailFolders = templateFolders.filter(folder => folder.type === "email" || folder.type === "both");
  const smsFolders = templateFolders.filter(folder => folder.type === "sms" || folder.type === "both");

  // Filter templates with tab-specific search terms
  const filteredEmailTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(emailSearchTerm.toLowerCase())));
    const matchesFolder = !selectedFolder || template.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const filteredSmsTemplates = smsTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(smsSearchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(smsSearchTerm.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(smsSearchTerm.toLowerCase())));
    const matchesFolder = !selectedFolder || template.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description?: string }) => {
      return await apiRequest("POST", "/api/template-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      setIsCreateFolderDialogOpen(false);
      toast({
        title: "Folder created",
        variant: "default",
        description: "Template folder has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create template mutations
  const createEmailTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email-templates", { ...data, createdBy: "user-1" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      handleDialogClose();
      toast({
        title: "Email template created",
        variant: "default",
        description: "Email template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create email template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSmsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/sms-templates", { ...data, createdBy: "user-1" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      handleDialogClose();
      toast({
        title: "SMS template created",
        variant: "default",
        description: "SMS template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create SMS template. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutations
  const deleteEmailTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Template deleted",
        variant: "default",
        description: "Email template has been deleted successfully.",
      });
    },
  });

  const deleteSmsTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sms-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({
        title: "Template deleted",
        variant: "default",
        description: "SMS template has been deleted successfully.",
      });
    },
  });

  // Update template mutations
  const updateEmailTemplateMutation = useMutation({
    mutationFn: async (data: { id: string; [key: string]: any }) => {
      const { id, ...updateData } = data;
      return await apiRequest("PATCH", `/api/email-templates/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      handleEditDialogClose();
      toast({
        title: "Email template updated",
        variant: "default",
        description: "Email template has been updated successfully.",
      });
    },
  });

  const updateSmsTemplateMutation = useMutation({
    mutationFn: async (data: { id: string; [key: string]: any }) => {
      const { id, ...updateData } = data;
      return await apiRequest("PATCH", `/api/sms-templates/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      handleEditDialogClose();
      toast({
        title: "SMS template updated",
        variant: "default",
        description: "SMS template has been updated successfully.",
      });
    },
  });

  const handleCreateFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createFolderMutation.mutate({
      name: formData.get("name") as string,
      type: activeTab,
      description: formData.get("description") as string || undefined,
    });
  };

  const handleCreateEmailTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEmailTemplateMutation.mutate({
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      content: emailContent, // Use WYSIWYG editor content
      previewText: formData.get("previewText") as string || undefined,
      folderId: selectedFolder,
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
    });
  };

  const handleCreateSmsTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSmsTemplateMutation.mutate({
      name: formData.get("name") as string,
      content: smsContent,
      folderId: selectedFolder,
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
    });
  };

  const handleDialogClose = () => {
    setIsCreateTemplateDialogOpen(false);
    setSmsContent(""); // Reset SMS content when dialog closes
    setEmailContent(""); // Reset email content when dialog closes
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
    setSmsContent("");
    setEmailContent("");
  };

  const handleEditTemplate = (template: EmailTemplate | SmsTemplate) => {
    setEditingTemplate(template);
    setEmailContent(template.content);
    setSmsContent(template.content);
    setIsEditDialogOpen(true);
  };

  const handleDuplicateTemplate = async (template: EmailTemplate | SmsTemplate) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined // Remove ID so a new one is generated
    };

    if (activeTab === "email") {
      createEmailTemplateMutation.mutate(duplicatedTemplate);
    } else {
      createSmsTemplateMutation.mutate(duplicatedTemplate);
    }
  };

  const handleUpdateEmailTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateEmailTemplateMutation.mutate({
      id: editingTemplate!.id,
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      content: emailContent,
      previewText: formData.get("previewText") as string || undefined,
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
    });
  };

  const handleUpdateSmsTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSmsTemplateMutation.mutate({
      id: editingTemplate!.id,
      name: formData.get("name") as string,
      content: smsContent,
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
    });
  };

  // Helper functions for inserting merge tags
  const insertMergeTagIntoEmail = (mergeTag: string) => {
    setEmailContent(prev => prev + " " + mergeTag);
  };

  const insertMergeTagIntoSms = (mergeTag: string) => {
    setSmsContent(prev => prev + " " + mergeTag);
  };

  // Merge tags dropdown component
  const MergeTagsDropdown = ({ onInsert, buttonText = "Insert Merge Tag" }: { onInsert: (tag: string) => void, buttonText?: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="h-3 w-3" />
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        {mergeTagGroups.map((group, groupIndex) => (
          <div key={group.label}>
            <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase">
              {group.label}
            </DropdownMenuLabel>
            {group.tags.map((tag) => (
              <DropdownMenuItem 
                key={tag.value} 
                onClick={() => onInsert(tag.value)}
                className="cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{tag.label}</span>
                  <span className="text-xs text-gray-500">{tag.value}</span>
                </div>
              </DropdownMenuItem>
            ))}
            {groupIndex < mergeTagGroups.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const currentFolders = activeTab === "email" ? emailFolders : smsFolders;
  const currentTemplates = activeTab === "email" ? filteredEmailTemplates : filteredSmsTemplates;

  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Mail className="h-8 w-8 text-[#46a1a0]" />
          <span>Campaigns</span>
        </h1>
        <p className="text-muted-foreground">
          Manage your email and SMS templates with organized folder structure
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 mt-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "email", name: "Email", icon: Mail, count: emailTemplates.length },
            { id: "sms", name: "SMS", icon: MessageCircle, count: smsTemplates.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} ({tab.count})
              </button>
            );
          })}
        </nav>
      </div>

      {/* Email Tab */}
      {activeTab === "email" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search email templates..."
                  value={emailSearchTerm}
                  onChange={(e) => setEmailSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFolder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Folder Name</label>
                      <Input name="name" placeholder="Enter folder name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createFolderMutation.isPending}>
                        Create Folder
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateTemplateDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  handleDialogClose();
                } else {
                  setIsCreateTemplateDialogOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-[#46a1a0] hover:bg-[#3a8b8a] h-10" size="sm" onClick={() => setIsCreateTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Email Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Email Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateEmailTemplate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Template Name</label>
                      <Input name="name" placeholder="Enter template name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subject Line</label>
                      <Input name="subject" placeholder="Email subject" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preview Text</label>
                      <Input name="previewText" placeholder="Preview text (optional)" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Email Content</label>
                        <MergeTagsDropdown onInsert={insertMergeTagIntoEmail} />
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={emailContent}
                          onChange={setEmailContent}
                          modules={{
                            toolbar: [
                              [{ 'header': '1' }, { 'header': '2' }, 'bold', 'italic', 'underline'],
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                              ['link', 'clean']
                            ],
                          }}
                          formats={[
                            'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
                          ]}
                          placeholder="Enter your email content with rich formatting..."
                          style={{ 
                            minHeight: '250px',
                            border: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      <Input name="tags" placeholder="Comma-separated tags" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createEmailTemplateMutation.isPending}>
                        Create Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Templates Grid Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmailTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm font-medium truncate">
                        {template.name}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template.id, "email")}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Email Template</span>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex gap-1">
                        {template.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-1">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-1">
                            +{template.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SMS Tab */}
      {activeTab === "sms" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search SMS templates..."
                  value={smsSearchTerm}
                  onChange={(e) => setSmsSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Folder Name</label>
                  <Input name="name" placeholder="Enter folder name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input name="description" placeholder="Optional description" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFolderMutation.isPending}>
                    Create Folder
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateTemplateDialogOpen} onOpenChange={(open) => {
            if (!open) {
              handleDialogClose();
            } else {
              setIsCreateTemplateDialogOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setIsCreateTemplateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New {activeTab === "email" ? "Email" : "SMS"} Template</DialogTitle>
              </DialogHeader>
              {activeTab === "email" ? (
                <form onSubmit={handleCreateEmailTemplate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <Input name="name" placeholder="Enter template name" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Line</label>
                    <Input name="subject" placeholder="Email subject" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preview Text</label>
                    <Input name="previewText" placeholder="Preview text (optional)" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Email Content</label>
                      <MergeTagsDropdown onInsert={insertMergeTagIntoEmail} />
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={emailContent}
                        onChange={setEmailContent}
                        modules={{
                          toolbar: [
                            [{ 'header': '1' }, { 'header': '2' }, 'bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                        formats={[
                          'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
                        ]}
                        placeholder="Enter your email content with rich formatting..."
                        style={{ 
                          minHeight: '250px',
                          border: 'none'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input name="tags" placeholder="Comma-separated tags" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createEmailTemplateMutation.isPending}>
                      Create Template
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateSmsTemplate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <Input name="name" placeholder="Enter template name" required />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">SMS Content</label>
                      <MergeTagsDropdown onInsert={insertMergeTagIntoSms} />
                    </div>
                    <textarea 
                      name="content" 
                      value={smsContent}
                      onChange={(e) => setSmsContent(e.target.value)}
                      className="w-full h-32 p-3 border rounded-md" 
                      placeholder="Enter SMS content (160 characters recommended)"
                      required
                    />
                    <div className="flex justify-end mt-1">
                      <div className="text-xs text-gray-500">
                        {smsContent.length}/160 characters
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input name="tags" placeholder="Comma-separated tags" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSmsTemplateMutation.isPending}>
                      Create Template
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Template Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit {editingTemplate && (editingTemplate as any).subject ? "Email" : "SMS"} Template</DialogTitle>
              </DialogHeader>
              {editingTemplate && (editingTemplate as any).subject ? (
                // Email template edit form
                <form onSubmit={handleUpdateEmailTemplate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <Input name="name" placeholder="Enter template name" defaultValue={editingTemplate.name} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Line</label>
                    <Input name="subject" placeholder="Email subject" defaultValue={(editingTemplate as any).subject} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preview Text</label>
                    <Input name="previewText" placeholder="Preview text (optional)" defaultValue={(editingTemplate as any).previewText || ""} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Email Content</label>
                      <MergeTagsDropdown onInsert={insertMergeTagIntoEmail} />
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={emailContent}
                        onChange={setEmailContent}
                        modules={{
                          toolbar: [
                            [{ 'header': '1' }, { 'header': '2' }, 'bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                        formats={[
                          'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
                        ]}
                        placeholder="Enter your email content with rich formatting..."
                        style={{ 
                          minHeight: '250px',
                          border: 'none'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input name="tags" placeholder="Comma-separated tags" defaultValue={editingTemplate.tags?.join(", ") || ""} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleEditDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateEmailTemplateMutation.isPending}>
                      Update Template
                    </Button>
                  </div>
                </form>
              ) : (
                // SMS template edit form
                <form onSubmit={handleUpdateSmsTemplate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <Input name="name" placeholder="Enter template name" defaultValue={editingTemplate?.name} required />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">SMS Content</label>
                      <MergeTagsDropdown onInsert={insertMergeTagIntoSms} />
                    </div>
                    <textarea 
                      name="content" 
                      value={smsContent}
                      onChange={(e) => setSmsContent(e.target.value)}
                      className="w-full h-32 p-3 border rounded-md" 
                      placeholder="Enter SMS content (160 characters recommended)"
                      required
                    />
                    <div className="flex justify-end mt-1">
                      <div className="text-xs text-gray-500">
                        {smsContent.length}/160 characters
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input name="tags" placeholder="Comma-separated tags" defaultValue={editingTemplate?.tags?.join(", ") || ""} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleEditDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateSmsTemplateMutation.isPending}>
                      Update Template
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar with tabs and folder structure */}
        <div className="col-span-3 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                SMS
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedFolder ? "bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  All Templates
                </button>
                {currentFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedFolder === folder.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {folder.description && (
                      <p className="text-xs text-gray-500 ml-6 truncate">{folder.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="col-span-9 space-y-4">
          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500">
              {currentTemplates.length} template{currentTemplates.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                      {(template as any).subject && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                          {(template as any).subject}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {activeTab === "email" ? "EMAIL" : "SMS"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.content.replace(/<[^>]*>/g, "").substring(0, 100)}...
                    </p>
                    
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {template.usageCount} uses
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {template.lastUsed ? new Date(template.lastUsed).toLocaleDateString() : "Never"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (activeTab === "email") {
                              deleteEmailTemplateMutation.mutate(template.id);
                            } else {
                              deleteSmsTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {currentTemplates.length === 0 && !loadingEmailTemplates && !loadingSmsTemplates && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                {activeTab === "email" ? (
                  <Mail className="h-12 w-12 text-gray-400" />
                ) : (
                  <MessageCircle className="h-12 w-12 text-gray-400" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No {activeTab} templates found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {searchTerm 
                      ? `No templates match "${searchTerm}"`
                      : `Create your first ${activeTab} template to get started`
                    }
                  </p>
                </div>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create {activeTab === "email" ? "Email" : "SMS"} Template
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Template preview/edit dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Preview: {editingTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {"subject" in editingTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {editingTemplate.subject}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md max-h-96 overflow-y-auto">
                  {"subject" in editingTemplate ? (
                    <div dangerouslySetInnerHTML={{ __html: editingTemplate.content }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">{editingTemplate.content}</pre>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setEditingTemplate(null)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}