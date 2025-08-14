import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy,
  FolderPlus,
  Folder
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SmsTemplate, TemplateFolder } from "@shared/schema";

export default function SmsTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch SMS templates
  const { data: templates = [], isLoading } = useQuery<SmsTemplate[]>({
    queryKey: ["/api/sms-templates"],
  });

  // Fetch template folders
  const { data: folders = [] } = useQuery<TemplateFolder[]>({
    queryKey: ["/api/template-folders"],
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/sms-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({
        title: "Template deleted",
        description: "SMS template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === "all" || template.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this SMS template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  // Calculate character count for SMS preview
  const getCharacterCount = (content: string) => {
    return content ? content.length : 0;
  };

  const getSmsCount = (content: string) => {
    const charCount = getCharacterCount(content);
    return Math.ceil(charCount / 160);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">SMS Templates</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage SMS templates for your campaigns
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-new-folder">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button data-testid="button-new-template">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[300px]"
                  data-testid="input-search-templates"
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Folder</label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background"
                data-testid="select-folder-filter"
              >
                <option value="all">All Folders</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm || selectedFolder !== "all" ? "No templates found" : "No SMS templates yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || selectedFolder !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first SMS template."
              }
            </p>
            {!searchTerm && selectedFolder === "all" && (
              <Button data-testid="button-create-first-template">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            )}
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow" data-testid={`card-template-${template.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base line-clamp-1" data-testid={`text-template-name-${template.id}`}>
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span data-testid={`text-char-count-${template.id}`}>
                        {getCharacterCount(template.content || "")} chars
                      </span>
                      <span>•</span>
                      <span data-testid={`text-sms-count-${template.id}`}>
                        {getSmsCount(template.content || "")} SMS
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-menu-${template.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem data-testid={`menu-edit-${template.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem data-testid={`menu-duplicate-${template.id}`}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                        data-testid={`menu-delete-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Folder badge */}
                  {template.folderId && (
                    <div className="flex items-center space-x-1">
                      <Folder className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs" data-testid={`badge-folder-${template.id}`}>
                        {folders.find(f => f.id === template.folderId)?.name || "Unknown"}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Content preview */}
                  <div className="relative">
                    <div 
                      className="text-sm p-3 bg-muted/50 rounded-lg border-l-4 border-primary min-h-[4rem] max-h-24 overflow-hidden"
                      data-testid={`text-template-content-${template.id}`}
                    >
                      {template.content || "No content"}
                    </div>
                    {template.content && template.content.length > 100 && (
                      <div className="absolute bottom-0 right-0 bg-gradient-to-l from-muted/50 to-transparent px-2 py-1">
                        <span className="text-xs text-muted-foreground">...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Character limit warning */}
                  {getCharacterCount(template.content || "") > 160 && (
                    <div className="flex items-center space-x-1 text-xs text-amber-600">
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        Multiple SMS ({getSmsCount(template.content || "")})
                      </Badge>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-status-${template.id}`}>
                      Active
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" data-testid={`button-preview-${template.id}`}>
                        Preview
                      </Button>
                      <Button size="sm" data-testid={`button-use-${template.id}`}>
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Template Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-total-templates">
                {templates.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Templates</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600" data-testid="stat-active-templates">
                {templates.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Templates</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600" data-testid="stat-folders">
                {folders.length}
              </div>
              <div className="text-sm text-muted-foreground">Folders</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-avg-length">
                {templates.length > 0 
                  ? Math.round(templates.reduce((sum, t) => sum + getCharacterCount(t.content || ""), 0) / templates.length)
                  : 0
                }
              </div>
              <div className="text-sm text-muted-foreground">Avg. Characters</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}