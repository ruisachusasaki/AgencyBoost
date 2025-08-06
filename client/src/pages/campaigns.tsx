import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Mail, MessageCircle, Folder, FolderPlus, Calendar, Eye, Copy, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TemplateFolder, EmailTemplate, SmsTemplate } from "@shared/schema";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("email");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | SmsTemplate | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Filter templates
  const filteredEmailTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesFolder = !selectedFolder || template.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const filteredSmsTemplates = smsTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
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
      setIsCreateTemplateDialogOpen(false);
      toast({
        title: "Email template created",
        description: "Email template has been created successfully.",
      });
    },
  });

  const createSmsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/sms-templates", { ...data, createdBy: "user-1" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      setIsCreateTemplateDialogOpen(false);
      toast({
        title: "SMS template created",
        description: "SMS template has been created successfully.",
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
        description: "SMS template has been deleted successfully.",
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
      content: formData.get("content") as string,
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
      content: formData.get("content") as string,
      folderId: selectedFolder,
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
    });
  };

  const currentFolders = activeTab === "email" ? emailFolders : smsFolders;
  const currentTemplates = activeTab === "email" ? filteredEmailTemplates : filteredSmsTemplates;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your email and SMS templates with organized folder structure
          </p>
        </div>
        <div className="flex gap-2">
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

          <Dialog open={isCreateTemplateDialogOpen} onOpenChange={setIsCreateTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
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
                    <label className="block text-sm font-medium mb-1">Email Content</label>
                    <textarea 
                      name="content" 
                      className="w-full h-40 p-3 border rounded-md" 
                      placeholder="Enter email content (HTML supported)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input name="tags" placeholder="Comma-separated tags" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateTemplateDialogOpen(false)}>
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
                    <label className="block text-sm font-medium mb-1">SMS Content</label>
                    <textarea 
                      name="content" 
                      className="w-full h-32 p-3 border rounded-md" 
                      placeholder="Enter SMS content (160 characters recommended)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input name="tags" placeholder="Comma-separated tags" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateTemplateDialogOpen(false)}>
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
                      {"subject" in template && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                          {template.subject}
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
                        <Button variant="ghost" size="sm">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
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