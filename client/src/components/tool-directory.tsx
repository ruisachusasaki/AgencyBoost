import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/use-has-permission";
import { 
  Search, Plus, ExternalLink, Edit, Trash2, Folder, Star, Grid3X3, List,
  ArrowLeft, Globe, Wrench, Palette, BarChart3, Code, Megaphone, Video,
  Image, FileText, MessageSquare, Mail, Calendar, Users, Settings, Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const iconMap: Record<string, any> = {
  Folder, Star, Grid3X3, List, Globe, Wrench, Palette, BarChart3, Code, 
  Megaphone, Video, Image, FileText, MessageSquare, Mail, Calendar, Users, 
  Settings, Zap, Search, Plus, ExternalLink, Edit, Trash2
};

const renderIcon = (iconName: string | null | undefined, className = "w-5 h-5") => {
  if (!iconName) return <Wrench className={className} />;
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent className={className} /> : <Wrench className={className} />;
};

type ToolCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
};

type Tool = {
  id: string;
  name: string;
  description?: string;
  url: string;
  logoUrl?: string;
  categoryId?: string;
  tags?: string[];
  isFeatured: boolean;
  isActive: boolean;
  category?: ToolCategory;
};

export function ToolDirectory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useRolePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ToolCategory | null>(null);
  const [deletingTool, setDeletingTool] = useState<Tool | null>(null);

  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", icon: "Folder", color: "#00C9C6" });
  const [toolForm, setToolForm] = useState({ 
    name: "", description: "", url: "", logoUrl: "", categoryId: "", tags: "", isFeatured: false 
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ToolCategory[]>({
    queryKey: ["/api/tool-directory/categories"],
  });

  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tool-directory/tools", selectedCategory, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);
      const res = await fetch(`/api/tool-directory/tools?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tools");
      return res.json();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const res = await apiRequest("POST", "/api/tool-directory/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tool-directory/categories"] });
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: "", description: "", icon: "Folder", color: "#00C9C6" });
      toast({ title: "Category created" });
    },
    onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof categoryForm }) => {
      const res = await apiRequest("PUT", `/api/tool-directory/categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tool-directory/categories"] });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      toast({ title: "Category updated" });
    },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/tool-directory/categories/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tool-directory/categories"] });
      setDeletingCategory(null);
      toast({ title: "Category deleted" });
    },
    onError: (error: any) => toast({ 
      title: "Failed to delete category", 
      description: error.message || "Cannot delete category with tools",
      variant: "destructive" 
    }),
  });

  const createToolMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tool-directory/tools", {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        categoryId: data.categoryId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tool-directory/tools"] });
      setIsToolModalOpen(false);
      setToolForm({ name: "", description: "", url: "", logoUrl: "", categoryId: "", tags: "", isFeatured: false });
      toast({ title: "Tool added" });
    },
    onError: () => toast({ title: "Failed to add tool", variant: "destructive" }),
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/tool-directory/tools/${id}`, {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        categoryId: data.categoryId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tool-directory/tools"] });
      setIsToolModalOpen(false);
      setEditingTool(null);
      toast({ title: "Tool updated" });
    },
    onError: () => toast({ title: "Failed to update tool", variant: "destructive" }),
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/tool-directory/tools/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tool-directory/tools"] });
      setDeletingTool(null);
      toast({ title: "Tool deleted" });
    },
    onError: () => toast({ title: "Failed to delete tool", variant: "destructive" }),
  });

  const openCategoryModal = (category?: ToolCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "Folder",
        color: category.color || "#00C9C6",
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", icon: "Folder", color: "#00C9C6" });
    }
    setIsCategoryModalOpen(true);
  };

  const openToolModal = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setToolForm({
        name: tool.name,
        description: tool.description || "",
        url: tool.url,
        logoUrl: tool.logoUrl || "",
        categoryId: tool.categoryId || "",
        tags: tool.tags?.join(", ") || "",
        isFeatured: tool.isFeatured,
      });
    } else {
      setEditingTool(null);
      setToolForm({ 
        name: "", description: "", url: "", logoUrl: "", 
        categoryId: selectedCategory || "", tags: "", isFeatured: false 
      });
    }
    setIsToolModalOpen(true);
  };

  const handleCategorySubmit = () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleToolSubmit = () => {
    if (!toolForm.name.trim() || !toolForm.url.trim()) {
      toast({ title: "Name and URL are required", variant: "destructive" });
      return;
    }
    if (editingTool) {
      updateToolMutation.mutate({ id: editingTool.id, data: toolForm });
    } else {
      createToolMutation.mutate(toolForm);
    }
  };

  const activeCategories = categories.filter(c => c.isActive);
  const filteredTools = tools;

  if (categoriesLoading || toolsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedCategory && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Categories
            </Button>
          )}
          <h2 className="text-2xl font-bold">
            {selectedCategory 
              ? activeCategories.find(c => c.id === selectedCategory)?.name || "Tools"
              : "Tool Directory"
            }
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex border rounded-md">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => openCategoryModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button onClick={() => openToolModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tool
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedCategory && !searchTerm && (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {activeCategories.map((category) => {
            const toolCount = tools.filter(t => t.categoryId === category.id).length;
            return viewMode === "grid" ? (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color || "#00C9C6" }}
                    >
                      {renderIcon(category.icon, "w-5 h-5 text-white")}
                    </div>
                    {isAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); openCategoryModal(category); }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingCategory(category); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{toolCount} tool{toolCount !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            ) : (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color || "#00C9C6" }}
                    >
                      {renderIcon(category.icon, "w-5 h-5 text-white")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary" className="text-xs">{toolCount} tool{toolCount !== 1 ? "s" : ""}</Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCategoryModal(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingCategory(category)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(selectedCategory || searchTerm) && (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {filteredTools.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searchTerm ? "No tools match your search" : "No tools in this category yet"}
            </div>
          ) : (
            filteredTools.map((tool) => (
              viewMode === "grid" ? (
                <Card key={tool.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {tool.logoUrl ? (
                          <img 
                            src={tool.logoUrl} 
                            alt={tool.name} 
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {tool.name}
                            {tool.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          </CardTitle>
                          {tool.category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {tool.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openToolModal(tool)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingTool(tool)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {tool.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
                    )}
                    {tool.tags && tool.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tool.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(tool.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card key={tool.id} className="group">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      {tool.logoUrl ? (
                        <img 
                          src={tool.logoUrl} 
                          alt={tool.name} 
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Globe className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tool.name}</span>
                          {tool.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          {tool.category && (
                            <Badge variant="secondary" className="text-xs">{tool.category.name}</Badge>
                          )}
                        </div>
                        {tool.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{tool.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openToolModal(tool)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingTool(tool)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => window.open(tool.url, "_blank")}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            ))
          )}
        </div>
      )}

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Design Tools"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={categoryForm.icon}
                  onValueChange={(value) => setCategoryForm(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconMap).map(name => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          {renderIcon(name, "w-4 h-4")}
                          {name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCategorySubmit}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isToolModalOpen} onOpenChange={setIsToolModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTool ? "Edit Tool" : "Add Tool"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={toolForm.name}
                onChange={(e) => setToolForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Figma"
              />
            </div>
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={toolForm.url}
                onChange={(e) => setToolForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={toolForm.description}
                onChange={(e) => setToolForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this tool used for?"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={toolForm.logoUrl}
                onChange={(e) => setToolForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://... (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={toolForm.categoryId}
                onValueChange={(value) => setToolForm(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {activeCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={toolForm.tags}
                onChange={(e) => setToolForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="design, prototype, ui (comma separated)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={toolForm.isFeatured}
                onCheckedChange={(checked) => setToolForm(prev => ({ ...prev, isFeatured: checked }))}
              />
              <Label>Featured Tool</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsToolModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleToolSubmit}
              disabled={createToolMutation.isPending || updateToolMutation.isPending}
            >
              {editingTool ? "Save Changes" : "Add Tool"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              This cannot be undone. Categories with tools cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategory && deleteCategoryMutation.mutate(deletingCategory.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingTool} onOpenChange={() => setDeletingTool(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTool?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTool && deleteToolMutation.mutate(deletingTool.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
