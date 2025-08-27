import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  Image, 
  Monitor,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Download,
  Star,
  Users,
  TrendingUp,
  Settings,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  Archive,
  Eye
} from "lucide-react";

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
  content?: string;
  type: 'video' | 'document' | 'pdf' | 'image' | 'presentation' | 'link' | 'quiz';
  url?: string;
  thumbnail?: string;
  categoryId?: string;
  duration?: number;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  visibleToRoles: string[];
  tags: string[];
  metadata: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercent: number;
    timeSpent: number;
    completedAt?: string;
  };
}

interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  categoryId?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
}

interface ResourceProgress {
  resourceId: string;
  status: string;
  progressPercent: number;
  timeSpent: number;
  completedAt?: string;
  resourceTitle: string;
  resourceType: string;
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function Resources() {
  const [activeTab, setActiveTab] = useState("training");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateResource, setShowCreateResource] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "BookOpen", color: "#3b82f6" });
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    type: "video",
    url: "",
    categoryId: "",
    duration: 0,
    isRequired: false,
    tags: [] as string[]
  });
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", categoryId: "" });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resource categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/resources/categories"],
  });

  // Fetch resources
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources", selectedCategory],
    queryFn: () =>
      fetch(`/api/resources${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`).then(res => res.json()),
  });

  // Fetch user progress
  const { data: userProgress = [], isLoading: progressLoading } = useQuery<ResourceProgress[]>({
    queryKey: ["/api/resources/progress"],
  });

  // Fetch resource links
  const { data: resourceLinks = [], isLoading: linksLoading } = useQuery<ResourceLink[]>({
    queryKey: ["/api/resources/links", selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/resources/links${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`);
      if (!response.ok) {
        console.error('Failed to fetch resource links:', response.status);
        return []; // Return empty array on error
      }
      return response.json();
    },
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
      setNewCategory({ name: "", description: "", icon: "BookOpen", color: "#3b82f6" });
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create resource");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setShowCreateResource(false);
      setNewResource({
        title: "",
        description: "",
        type: "video",
        url: "",
        categoryId: "",
        duration: 0,
        isRequired: false,
        tags: []
      });
      toast({ title: "Success", description: "Resource created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create resource", variant: "destructive" });
    },
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/resources/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create link");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/links"] });
      setShowCreateLink(false);
      setNewLink({ title: "", url: "", description: "", categoryId: "" });
      toast({ title: "Success", description: "Resource link created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create link", variant: "destructive" });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ resourceId, status, progressPercent }: { resourceId: string; status: string; progressPercent?: number }) => {
      const response = await fetch(`/api/resources/${resourceId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, progressPercent: progressPercent || (status === 'completed' ? 100 : 50) }),
      });
      if (!response.ok) throw new Error("Failed to update progress");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Success", description: "Progress updated" });
    },
  });

  const filteredResources = resources.filter((resource: Resource) =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLinks = (resourceLinks || []).filter((link: ResourceLink) =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedResources = userProgress.filter((p: ResourceProgress) => p.status === 'completed').length;
  const totalResources = resources.length;
  const overallProgress = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;

  return (
    <div className="space-y-6" data-testid="resources-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resources & Training</h1>
          <p className="text-muted-foreground">Access training materials, documentation, and learning resources</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-category">
                <Folder className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
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
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedResources} of {totalResources} resources completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResources}</div>
            <p className="text-xs text-muted-foreground">Available resources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Resource categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceLinks.length}</div>
            <p className="text-xs text-muted-foreground">External links</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-resources"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category: ResourceCategory) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList data-testid="tabs-resources">
          <TabsTrigger value="training" data-testid="tab-training">Training</TabsTrigger>
          <TabsTrigger value="links" data-testid="tab-links">Resource Links</TabsTrigger>
        </TabsList>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Resources</h2>
            <Dialog open={showCreateResource} onOpenChange={setShowCreateResource}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-resource">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Resource</DialogTitle>
                  <DialogDescription>Add a new training resource or material</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-title" className="text-right">Title</Label>
                    <Input
                      id="resource-title"
                      value={newResource.title}
                      onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      className="col-span-3"
                      data-testid="input-resource-title"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-type" className="text-right">Type</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                    >
                      <SelectTrigger className="col-span-3" data-testid="select-resource-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="link">External Link</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-category" className="text-right">Category</Label>
                    <Select
                      value={newResource.categoryId}
                      onValueChange={(value) => setNewResource({ ...newResource, categoryId: value })}
                    >
                      <SelectTrigger className="col-span-3" data-testid="select-resource-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: ResourceCategory) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-url" className="text-right">URL</Label>
                    <Input
                      id="resource-url"
                      value={newResource.url}
                      onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      className="col-span-3"
                      placeholder="https://..."
                      data-testid="input-resource-url"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-description" className="text-right">Description</Label>
                    <Textarea
                      id="resource-description"
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                      className="col-span-3"
                      data-testid="textarea-resource-description"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-duration" className="text-right">Duration (min)</Label>
                    <Input
                      id="resource-duration"
                      type="number"
                      value={newResource.duration}
                      onChange={(e) => setNewResource({ ...newResource, duration: parseInt(e.target.value) || 0 })}
                      className="col-span-3"
                      data-testid="input-resource-duration"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="resource-required" className="text-right">Required</Label>
                    <Switch
                      id="resource-required"
                      checked={newResource.isRequired}
                      onCheckedChange={(checked) => setNewResource({ ...newResource, isRequired: checked })}
                      data-testid="switch-resource-required"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createResourceMutation.mutate(newResource)}
                    disabled={!newResource.title || !newResource.type || createResourceMutation.isPending}
                    data-testid="button-save-resource"
                  >
                    {createResourceMutation.isPending ? "Creating..." : "Create Resource"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Resources Grid */}
          {resourcesLoading ? (
            <div className="text-center py-8">Loading resources...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource: Resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow" data-testid={`card-resource-${resource.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getResourceIcon(resource.type)}
                        <CardTitle className="text-sm">{resource.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {resource.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <Badge className={getStatusColor(resource.progress?.status || 'not_started')}>
                          {resource.progress?.status?.replace('_', ' ') || 'Not Started'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                    )}
                    
                    {/* Progress Bar */}
                    {resource.progress && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{resource.progress.progressPercent}%</span>
                        </div>
                        <Progress value={resource.progress.progressPercent} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {resource.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.duration}m
                        </span>
                      )}
                      {resource.categoryName && (
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {resource.categoryName}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {resource.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(resource.url, '_blank')}
                          data-testid={`button-open-resource-${resource.id}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      )}
                      
                      {resource.progress?.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => updateProgressMutation.mutate({
                            resourceId: resource.id,
                            status: resource.progress?.status === 'in_progress' ? 'completed' : 'in_progress'
                          })}
                          disabled={updateProgressMutation.isPending}
                          data-testid={`button-update-progress-${resource.id}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {resource.progress?.status === 'in_progress' ? 'Complete' : 'Start'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resource Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Resource Links</h2>
            <Dialog open={showCreateLink} onOpenChange={setShowCreateLink}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-link">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Resource Link</DialogTitle>
                  <DialogDescription>Add a new external resource link</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="link-title" className="text-right">Title</Label>
                    <Input
                      id="link-title"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      className="col-span-3"
                      data-testid="input-link-title"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="link-url" className="text-right">URL</Label>
                    <Input
                      id="link-url"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      className="col-span-3"
                      placeholder="https://..."
                      data-testid="input-link-url"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="link-category" className="text-right">Category</Label>
                    <Select
                      value={newLink.categoryId}
                      onValueChange={(value) => setNewLink({ ...newLink, categoryId: value })}
                    >
                      <SelectTrigger className="col-span-3" data-testid="select-link-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: ResourceCategory) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="link-description" className="text-right">Description</Label>
                    <Textarea
                      id="link-description"
                      value={newLink.description}
                      onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                      className="col-span-3"
                      data-testid="textarea-link-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createLinkMutation.mutate(newLink)}
                    disabled={!newLink.title || !newLink.url || createLinkMutation.isPending}
                    data-testid="button-save-link"
                  >
                    {createLinkMutation.isPending ? "Adding..." : "Add Link"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Links Table */}
          {linksLoading ? (
            <div className="text-center py-8">Loading resource links...</div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link: ResourceLink) => (
                    <TableRow key={link.id} data-testid={`row-link-${link.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <span className="font-medium">{link.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {link.categoryName && (
                          <Badge variant="outline">{link.categoryName}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {link.description}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(link.url, '_blank')}
                          data-testid={`button-open-link-${link.id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}