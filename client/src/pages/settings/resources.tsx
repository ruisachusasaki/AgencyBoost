import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Plus,
  Edit,
  Trash2,
  Settings,
  Folder,
  FolderOpen,
  Users,
  Shield,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Video,
  FileText,
  Link as LinkIcon,
  Image,
  Monitor,
  AlertCircle,
  Save,
  X,
  ArrowLeft
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface ResourceCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  visibleToRoles: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'document' | 'pdf' | 'image' | 'presentation' | 'link' | 'quiz';
  url?: string;
  categoryId?: string;
  duration?: number;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  visibleToRoles: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
}

const AVAILABLE_ROLES = [
  'Admin',
  'Manager', 
  'User',
  'Accounting',
  'Sales Representative',
  'Marketing Specialist',
  'Customer Success',
  'Operations',
  'Sales Manager',
  'Data Analyst'
];

const ICON_OPTIONS = [
  { value: 'BookOpen', label: 'Book' },
  { value: 'Video', label: 'Video' },
  { value: 'FileText', label: 'Document' },
  { value: 'Users', label: 'Users' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Folder', label: 'Folder' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Monitor', label: 'Monitor' },
];

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#84cc16', label: 'Lime' },
];

export default function ResourcesSettings() {
  const [activeTab, setActiveTab] = useState("categories");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    icon: "BookOpen",
    color: "#3b82f6",
    visibleToRoles: [] as string[]
  });
  const [resourceSettings, setResourceSettings] = useState({
    allowSelfEnrollment: true,
    requireCompletion: false,
    trackTimeSpent: true,
    enableCertificates: false,
    maxFileSize: 50 // MB
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resource categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/resources/categories"],
  });

  // Fetch all resources for management
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/resources/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/categories"] });
      setShowCreateCategory(false);
      setNewCategory({ name: "", description: "", icon: "BookOpen", color: "#3b82f6", visibleToRoles: [] });
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/resources/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/categories"] });
      setEditingCategory(null);
      toast({ title: "Success", description: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/resources/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete resource");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Success", description: "Resource deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
    },
  });

  const handleRoleToggle = (role: string, checked: boolean) => {
    if (editingCategory) {
      const updatedRoles = checked 
        ? [...editingCategory.visibleToRoles, role]
        : editingCategory.visibleToRoles.filter(r => r !== role);
      setEditingCategory({...editingCategory, visibleToRoles: updatedRoles});
    } else {
      const updatedRoles = checked 
        ? [...newCategory.visibleToRoles, role]
        : newCategory.visibleToRoles.filter(r => r !== role);
      setNewCategory({...newCategory, visibleToRoles: updatedRoles});
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'presentation': return <Monitor className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'quiz': return <AlertCircle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="resources-settings">
      {/* Back to Settings Button */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="button-back-to-settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <span>Resources Settings</span>
        </h1>
        <p className="text-muted-foreground">Manage resource categories, permissions, and LMS configuration</p>
      </div>

      {/* Tabs - Matching Custom Fields Style */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "categories", name: "Categories", icon: Folder, count: categories.length },
            { id: "resources", name: "Resources", icon: BookOpen, count: resources.length },
            { id: "permissions", name: "Permissions", icon: Shield, count: 0 },
            { id: "settings", name: "LMS Settings", icon: Settings, count: 0 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            );
          })}
        </nav>
      </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Resource Categories</h2>
            <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-category">
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Resource Category</DialogTitle>
                  <DialogDescription>Add a new category to organize your resources</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-name" className="text-right">Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="col-span-3"
                      data-testid="input-category-name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-description" className="text-right">Description</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="col-span-3"
                      data-testid="textarea-category-description"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-icon" className="text-right">Icon</Label>
                    <Select
                      value={newCategory.icon}
                      onValueChange={(value) => setNewCategory({ ...newCategory, icon: value })}
                    >
                      <SelectTrigger className="col-span-3" data-testid="select-category-icon">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-color" className="text-right">Color</Label>
                    <Select
                      value={newCategory.color}
                      onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                    >
                      <SelectTrigger className="col-span-3" data-testid="select-category-color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right">Visible to Roles</Label>
                    <div className="col-span-3 space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Leave empty to make visible to all roles
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_ROLES.map((role) => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={`role-${role}`}
                              checked={newCategory.visibleToRoles.includes(role)}
                              onCheckedChange={(checked) => handleRoleToggle(role, !!checked)}
                              data-testid={`checkbox-role-${role.toLowerCase().replace(' ', '-')}`}
                            />
                            <Label htmlFor={`role-${role}`} className="text-sm">{role}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createCategoryMutation.mutate(newCategory)}
                    disabled={!newCategory.name || createCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Visible To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const resourceCount = resources.filter(r => r.categoryId === category.id).length;
                  return (
                    <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color || '#3b82f6' }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {category.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{resourceCount} resources</Badge>
                      </TableCell>
                      <TableCell>
                        {category.visibleToRoles.length === 0 ? (
                          <Badge variant="secondary">All Roles</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {category.visibleToRoles.slice(0, 2).map(role => (
                              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                            ))}
                            {category.visibleToRoles.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{category.visibleToRoles.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-category-${category.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteCategoryMutation.mutate(category.id)}
                              className="text-destructive"
                              disabled={resourceCount > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Resources</h2>
            <Button onClick={() => window.location.href = '/resources'} data-testid="button-go-to-resources">
              Go to Resources Page
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id} data-testid={`row-resource-${resource.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(resource.type)}
                        <span className="font-medium">{resource.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{resource.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {resource.categoryName && (
                        <Badge variant="secondary">{resource.categoryName}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.isRequired ? "destructive" : "outline"}>
                        {resource.isRequired ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.isActive ? "default" : "secondary"}>
                        {resource.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-actions-resource-${resource.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingResource(resource)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {resource.url && (
                            <DropdownMenuItem onClick={() => window.open(resource.url, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteResourceMutation.mutate(resource.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === "permissions" && (
          <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Role-Based Permissions</h2>
            <p className="text-muted-foreground">Configure which roles can access specific resource categories</p>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color || '#3b82f6' }}
                    />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-${category.id}-${role}`}
                          checked={category.visibleToRoles.length === 0 || category.visibleToRoles.includes(role)}
                          disabled={category.visibleToRoles.length === 0}
                        />
                        <Label htmlFor={`perm-${category.id}-${role}`} className="text-sm">{role}</Label>
                      </div>
                    ))}
                  </div>
                  {category.visibleToRoles.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      This category is visible to all roles
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        )}

        {/* LMS Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Learning Management System Settings</h2>
            <p className="text-muted-foreground">Configure global LMS behavior and features</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="self-enrollment">Allow Self-Enrollment</Label>
                  <p className="text-sm text-muted-foreground">Users can enroll in non-required courses themselves</p>
                </div>
                <Switch
                  id="self-enrollment"
                  checked={resourceSettings.allowSelfEnrollment}
                  onCheckedChange={(checked) => setResourceSettings({...resourceSettings, allowSelfEnrollment: checked})}
                  data-testid="switch-self-enrollment"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-completion">Require Completion for Required Resources</Label>
                  <p className="text-sm text-muted-foreground">Users must complete required resources to access dependent content</p>
                </div>
                <Switch
                  id="require-completion"
                  checked={resourceSettings.requireCompletion}
                  onCheckedChange={(checked) => setResourceSettings({...resourceSettings, requireCompletion: checked})}
                  data-testid="switch-require-completion"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="track-time">Track Time Spent</Label>
                  <p className="text-sm text-muted-foreground">Monitor how much time users spend on resources</p>
                </div>
                <Switch
                  id="track-time"
                  checked={resourceSettings.trackTimeSpent}
                  onCheckedChange={(checked) => setResourceSettings({...resourceSettings, trackTimeSpent: checked})}
                  data-testid="switch-track-time"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="certificates">Enable Certificates</Label>
                  <p className="text-sm text-muted-foreground">Generate completion certificates for resources</p>
                </div>
                <Switch
                  id="certificates"
                  checked={resourceSettings.enableCertificates}
                  onCheckedChange={(checked) => setResourceSettings({...resourceSettings, enableCertificates: checked})}
                  data-testid="switch-certificates"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  value={resourceSettings.maxFileSize}
                  onChange={(e) => setResourceSettings({...resourceSettings, maxFileSize: parseInt(e.target.value) || 50})}
                  className="w-32"
                  data-testid="input-max-file-size"
                />
                <p className="text-sm text-muted-foreground">Maximum file size for uploaded resources</p>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information and settings</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Name</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Description</Label>
                <Textarea
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Visible to Roles</Label>
                <div className="col-span-3 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Leave empty to make visible to all roles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-role-${role}`}
                          checked={editingCategory.visibleToRoles.includes(role)}
                          onCheckedChange={(checked) => handleRoleToggle(role, !!checked)}
                        />
                        <Label htmlFor={`edit-role-${role}`} className="text-sm">{role}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingCategory) {
                  updateCategoryMutation.mutate({ 
                    id: editingCategory.id, 
                    data: {
                      name: editingCategory.name,
                      description: editingCategory.description,
                      visibleToRoles: editingCategory.visibleToRoles
                    }
                  });
                }
              }}
              disabled={!editingCategory?.name || updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}