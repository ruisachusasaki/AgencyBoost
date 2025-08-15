import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Mail, MessageCircle, Folder, FolderPlus, FolderOpen, MoreHorizontal, Copy, Tag, Megaphone, FileText, ArrowUpDown, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { TemplateFolder, EmailTemplate, SmsTemplate } from "@shared/schema";

export default function Campaigns() {
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [smsSearchTerm, setSmsSearchTerm] = useState("");
  // Initialize activeTab based on URL params to prevent double render
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      return (tab && ['email', 'sms', 'forms'].includes(tab)) ? tab : "email";
    }
    return "email";
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['email', 'sms', 'forms'].includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, []); // Remove dependency to prevent re-running
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isCreateFormFolderDialogOpen, setIsCreateFormFolderDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | SmsTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [smsContent, setSmsContent] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [moveToFolderDialogOpen, setMoveToFolderDialogOpen] = useState(false);
  const [formToMove, setFormToMove] = useState<any>(null);
  const [formSearchTerm, setFormSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch custom fields for dynamic merge tags
  const { data: customFields = [] } = useQuery({
    queryKey: ["/api/custom-fields"],
  });

  // Fetch forms for forms tab count (will be used by FormsTab component)
  const { data: formsData = [] } = useQuery({
    queryKey: ["/api/forms"],
    enabled: activeTab === "forms", // Only fetch when forms tab is active
  });

  // Fetch form folders data
  const { data: formFolders = [] } = useQuery<Array<{id: string; name: string; description?: string; order: number}>>({
    queryKey: ['/api/form-folders'],
    enabled: activeTab === "forms", // Only fetch when forms tab is active
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
      toast({ title: "Success", description: "Folder created successfully" });
      setIsCreateFolderDialogOpen(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create folder" });
    }
  });

  // Create form folder mutation
  const createFormFolderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/form-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-folders"] });
      toast({ title: "Success", description: "Form folder created successfully" });
      setIsCreateFormFolderDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create form folder",
        variant: "destructive",
      });
    },
  });

  // Create email template mutation
  const createEmailTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Email template created successfully" });
      handleDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create email template" });
    }
  });

  // Create SMS template mutation
  const createSmsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/sms-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({ title: "Success", description: "SMS template created successfully" });
      handleDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create SMS template" });
    }
  });

  // Update email template mutation
  const updateEmailTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/email-templates/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Email template updated successfully" });
      handleEditDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update email template" });
    }
  });

  // Update SMS template mutation
  const updateSmsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/sms-templates/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({ title: "Success", description: "SMS template updated successfully" });
      handleEditDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update SMS template" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const endpoint = type === "email" ? "/api/email-templates" : "/api/sms-templates";
      return await apiRequest("DELETE", `${endpoint}/${id}`);
    },
    onSuccess: (_, { type }) => {
      const queryKey = type === "email" ? ["/api/email-templates"] : ["/api/sms-templates"];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Success", description: `${type === "email" ? "Email" : "SMS"} template deleted successfully` });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete template" });
    }
  });

  // Form-specific mutations
  const duplicateFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      return await apiRequest("POST", `/api/forms/${formId}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Success", description: "Form duplicated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to duplicate form" });
    }
  });

  const moveFormToFolderMutation = useMutation({
    mutationFn: async ({ formId, folderId }: { formId: string; folderId: string | null }) => {
      return await apiRequest("PUT", `/api/forms/${formId}/move`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Success", description: "Form moved successfully" });
      setMoveToFolderDialogOpen(false);
      setFormToMove(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to move form" });
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      return await apiRequest("DELETE", `/api/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Success", description: "Form deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete form" });
    }
  });

  // Event handlers
  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type: activeTab,
      description: formData.get("description") as string || undefined,
    };
    createFolderMutation.mutate(data);
  };

  const handleCreateFormFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    createFormFolderMutation.mutate({
      name,
      description,
      order: formFolders.length, // Add to end
    });
  };

  const handleCreateEmailTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      content: emailContent,
      previewText: formData.get("previewText") as string || "",
      tags,
      folderId: selectedFolder || undefined,
    };
    createEmailTemplateMutation.mutate(data);
  };

  const handleCreateSmsTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      name: formData.get("name") as string,
      content: smsContent,
      tags,
      folderId: selectedFolder || undefined,
    };
    createSmsTemplateMutation.mutate(data);
  };

  const handleDialogClose = () => {
    setIsCreateTemplateDialogOpen(false);
    setEmailContent("");
    setSmsContent("");
  };

  const handleEditTemplate = (template: EmailTemplate | SmsTemplate) => {
    setEditingTemplate(template);
    if ((template as any).subject) {
      // Email template
      setEmailContent((template as EmailTemplate).content || "");
    } else {
      // SMS template
      setSmsContent((template as SmsTemplate).content || "");
    }
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
    setEmailContent("");
    setSmsContent("");
  };

  const handleUpdateEmailTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      id: editingTemplate.id,
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      content: emailContent,
      previewText: formData.get("previewText") as string || "",
      tags,
      folderId: editingTemplate.folderId,
    };
    updateEmailTemplateMutation.mutate(data);
  };

  const handleUpdateSmsTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      id: editingTemplate.id,
      name: formData.get("name") as string,
      content: smsContent,
      tags,
      folderId: editingTemplate.folderId,
    };
    updateSmsTemplateMutation.mutate(data);
  };

  const handleDeleteTemplate = (id: string, type: string) => {
    if (confirm(`Are you sure you want to delete this ${type} template?`)) {
      deleteTemplateMutation.mutate({ id, type });
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate | SmsTemplate) => {
    const isEmail = (template as any).subject !== undefined;
    
    if (isEmail) {
      const emailTemplate = template as EmailTemplate;
      const data = {
        name: `${emailTemplate.name} (Copy)`,
        subject: emailTemplate.subject,
        content: emailTemplate.content,
        previewText: emailTemplate.previewText || "",
        tags: emailTemplate.tags || [],
        folderId: emailTemplate.folderId,
      };
      createEmailTemplateMutation.mutate(data);
    } else {
      const smsTemplate = template as SmsTemplate;
      const data = {
        name: `${smsTemplate.name} (Copy)`,
        content: smsTemplate.content,
        tags: smsTemplate.tags || [],
        folderId: smsTemplate.folderId,
      };
      createSmsTemplateMutation.mutate(data);
    }
  };

  const insertMergeTagIntoEmail = (tag: string) => {
    setEmailContent(prev => prev + tag);
  };

  const insertMergeTagIntoSms = (tag: string) => {
    setSmsContent(prev => prev + tag);
  };

  // Form-specific handlers
  const handleDuplicateForm = (form: any) => {
    duplicateFormMutation.mutate(form.id);
  };

  const handleMoveToFolder = (form: any) => {
    setFormToMove(form);
    setMoveToFolderDialogOpen(true);
  };

  const handleConfirmMoveToFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formToMove) return;
    
    const formData = new FormData(e.currentTarget);
    const folderId = formData.get("folderId") as string;
    
    moveFormToFolderMutation.mutate({
      formId: formToMove.id,
      folderId: folderId === "no-folder" ? null : folderId
    });
  };

  const handleDeleteForm = (form: any) => {
    if (confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) {
      deleteFormMutation.mutate(form.id);
    }
  };

  // Filter forms with search - handle formsData being unknown type
  const filteredForms = Array.isArray(formsData) ? formsData.filter((form: any) => 
    form.name.toLowerCase().includes(formSearchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(formSearchTerm.toLowerCase()))
  ) : [];

  // Combine forms and folders for table display
  const getTableData = () => {
    const items: any[] = [];
    
    // Add folders
    formFolders.forEach((folder: any) => {
      const folderForms = filteredForms.filter((form: any) => form.folderId === folder.id);
      items.push({
        type: 'folder',
        id: folder.id,
        name: folder.name,
        description: folder.description,
        itemCount: folderForms.length,
        lastUpdated: folder.createdAt || new Date().toISOString(),
        updatedBy: 'System' // Folders don't have updatedBy yet
      });
    });
    
    // Add forms without folders
    filteredForms.forEach((form: any) => {
      if (!form.folderId) {
        items.push({
          type: 'form',
          id: form.id,
          name: form.name,
          description: form.description,
          status: form.status,
          lastUpdated: form.updatedAt || form.createdAt,
          updatedBy: form.updatedBy || 'System',
          originalForm: form
        });
      }
    });
    
    return items;
  };

  // Merge Tags Dropdown Component
  const MergeTagsDropdown = ({ onInsert, buttonText = "Insert Merge Tag" }: { onInsert: (tag: string) => void; buttonText?: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Tag className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        {mergeTagGroups.map((group, groupIndex) => (
          <div key={group.label}>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
              {group.label}
            </div>
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

  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Megaphone className="h-8 w-8 text-[#46a1a0]" />
          <span>Marketing</span>
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
            { id: "sms", name: "SMS", icon: MessageCircle, count: smsTemplates.length },
            { id: "forms", name: "Forms", icon: FileText, count: Array.isArray(formsData) ? formsData.length : 0 }
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
                  <Button variant="outline" size="sm" className="h-10">
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
                  <Button variant="outline" size="sm" className="h-10">
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
                    New SMS Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New SMS Template</DialogTitle>
                  </DialogHeader>
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
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* SMS Templates Grid Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSmsTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
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
                          onClick={() => handleDeleteTemplate(template.id, "sms")}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {template.content.substring(0, 50)}...
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>SMS Template</span>
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
                <Input name="name" placeholder="Enter template name" defaultValue={editingTemplate?.name || ""} required />
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

      {/* Forms Tab */}
      {activeTab === "forms" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search forms..."
                  value={formSearchTerm}
                  onChange={(e) => setFormSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-forms"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isCreateFormFolderDialogOpen} onOpenChange={setIsCreateFormFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Form Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFormFolder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Folder Name</label>
                      <Input name="name" placeholder="Enter folder name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateFormFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createFormFolderMutation.isPending}>
                        Create Folder
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button 
                asChild
                className="bg-[#46a1a0] hover:bg-[#3a8b8a] h-10" 
                size="sm"
                data-testid="button-create-form"
              >
                <a href="/form-builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </a>
              </Button>
            </div>
          </div>

          {/* Forms and Folders Table */}
          {!Array.isArray(formsData) || (formsData.length === 0 && formFolders.length === 0) ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first form.
              </p>
              <Button 
                asChild
                className="bg-[#46a1a0] hover:bg-[#3a8b8a]"
                data-testid="button-create-first-form"
              >
                <a href="/form-builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </a>
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">
                      <div className="flex items-center gap-2">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[25%]">
                      <div className="flex items-center gap-2">
                        Last Updated
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[20%]">Updated By</TableHead>
                    <TableHead className="w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTableData().map((item) => (
                    <TableRow key={`${item.type}-${item.id}`} className="group hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.type === 'folder' ? (
                            <div className="flex items-center gap-2 cursor-pointer hover:text-[#46a1a0]">
                              <Folder className="h-4 w-4 text-[#46a1a0]" />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {item.itemCount} {item.itemCount === 1 ? 'form' : 'forms'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {item.description}
                                  </div>
                                )}
                                {item.status && (
                                  <Badge 
                                    variant={item.status === 'published' ? 'default' : 'secondary'}
                                    className="text-xs mt-1"
                                  >
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{item.updatedBy}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              data-testid={`button-${item.type}-menu-${item.id}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.type === 'form' ? (
                              <>
                                <DropdownMenuItem asChild>
                                  <a href={`/form-builder/${item.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateForm(item.originalForm)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMoveToFolder(item.originalForm)}>
                                  <Folder className="h-4 w-4 mr-2" />
                                  Move to Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteForm(item.originalForm)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Move to Folder Dialog */}
      <Dialog open={moveToFolderDialogOpen} onOpenChange={setMoveToFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Form to Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmMoveToFolder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Move "{formToMove?.name}" to folder:
              </label>
              <Select name="folderId" defaultValue={formToMove?.folderId || "no-folder"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">No folder</SelectItem>
                  {formFolders.map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setMoveToFolderDialogOpen(false);
                setFormToMove(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={moveFormToFolderMutation.isPending}>
                Move Form
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

