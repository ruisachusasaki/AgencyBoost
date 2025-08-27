import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, BookOpen, Eye, Heart, Calendar, User, Tag, Folder } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { IconPicker } from "@/components/ui/icon-picker";

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentId: "none",
    icon: "",
    color: ""
  });
  
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "",
    tags: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["/api/knowledge-base/categories"],
  });

  const { data: articles } = useQuery({
    queryKey: ["/api/knowledge-base/articles", searchTerm, selectedCategory],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiRequest("POST", "/api/knowledge-base/categories", categoryData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/categories"] });
      setShowCategoryDialog(false);
      setNewCategory({ name: "", description: "", parentId: "none", icon: "", color: "" });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Category creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const response = await apiRequest("POST", "/api/knowledge-base/articles", articleData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/articles"] });
      setShowArticleDialog(false);
      setNewArticle({ title: "", content: "", excerpt: "", categoryId: "", tags: "" });
      toast({
        title: "Success",
        description: "Article created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Article creation error:", error);
      toast({
        title: "Error", 
        description: `Failed to create article: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const filteredArticles = (articles || []).filter((article: any) => {
    if (selectedCategory && article.categoryId !== selectedCategory) return false;
    if (!searchTerm) return true;
    return article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Organize categories into hierarchical structure
  const organizeCategories = (cats: any[]) => {
    const categoryMap = new Map();
    const topLevel: any[] = [];
    
    // First pass: create map of all categories
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Second pass: organize into hierarchy
    cats.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        // This is a child category
        categoryMap.get(cat.parentId).children.push(categoryWithChildren);
      } else {
        // This is a top-level category
        topLevel.push(categoryWithChildren);
      }
    });
    
    return topLevel;
  };

  const hierarchicalCategories = organizeCategories(categories || []);

  // Render category tree recursively
  const renderCategoryTree = (cats: any[], level = 0) => {
    return cats.map((category: any) => (
      <div key={category.id}>
        <button
          data-testid={`button-category-${category.id}`}
          onClick={() => setSelectedCategory(category.id)}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
            selectedCategory === category.id 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
          style={{ paddingLeft: `${12 + (level * 16)}px` }}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              {level > 0 && <span className="mr-2 text-muted-foreground">└</span>}
              {category.name}
            </span>
            {category.articleCount && (
              <Badge variant="secondary" className="text-xs">
                {category.articleCount}
              </Badge>
            )}
          </div>
        </button>
        {category.children.length > 0 && (
          <div className="mt-1">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    
    const categoryData = {
      name: newCategory.name,
      description: newCategory.description || null,
      parentId: newCategory.parentId === "none" || !newCategory.parentId ? null : newCategory.parentId,
      icon: newCategory.icon || null,
      color: newCategory.color || null,
    };
    
    console.log("Creating category with data:", categoryData);
    createCategoryMutation.mutate(categoryData);
  };

  const handleCreateArticle = () => {
    if (!newArticle.title.trim()) {
      toast({
        title: "Error",
        description: "Article title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!newArticle.content.trim()) {
      toast({
        title: "Error",
        description: "Article content is required",
        variant: "destructive",
      });
      return;
    }
    
    const articleData = {
      title: newArticle.title,
      content: newArticle.content,
      excerpt: newArticle.excerpt || null,
      categoryId: newArticle.categoryId || null,
      tags: newArticle.tags ? newArticle.tags.split(',').map(tag => tag.trim()) : [],
    };
    
    console.log("Creating article with data:", articleData);
    createArticleMutation.mutate(articleData);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Find answers, guides, and documentation
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-category">
                <Folder className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category-name">Name *</Label>
                  <Input
                    id="category-name"
                    data-testid="input-category-name"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    data-testid="textarea-category-description"
                    placeholder="Enter category description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parent-category">Parent Category</Label>
                  <Select value={newCategory.parentId} onValueChange={(value) => setNewCategory({ ...newCategory, parentId: value })}>
                    <SelectTrigger data-testid="select-parent-category">
                      <SelectValue placeholder="Select parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {(categories || []).map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <IconPicker
                    label="Icon"
                    value={newCategory.icon}
                    onChange={(iconName) => setNewCategory({ ...newCategory, icon: iconName })}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="category-color">Color</Label>
                    <Input
                      id="category-color"
                      data-testid="input-category-color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="button-save-category"
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-article">
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="article-title">Title *</Label>
                  <Input
                    id="article-title"
                    data-testid="input-article-title"
                    placeholder="Enter article title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="article-excerpt">Excerpt</Label>
                  <Input
                    id="article-excerpt"
                    data-testid="input-article-excerpt"
                    placeholder="Brief description of the article"
                    value={newArticle.excerpt}
                    onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="article-category">Category</Label>
                  <Select 
                    value={newArticle.categoryId} 
                    onValueChange={(value) => setNewArticle({ ...newArticle, categoryId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger data-testid="select-article-category">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {(categories || []).map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="article-content">Content *</Label>
                  <Textarea
                    id="article-content"
                    data-testid="textarea-article-content"
                    placeholder="Write your article content here..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    rows={8}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="article-tags">Tags</Label>
                  <Input
                    id="article-tags"
                    data-testid="input-article-tags"
                    placeholder="Enter tags separated by commas"
                    value={newArticle.tags}
                    onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowArticleDialog(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="button-save-article"
                  onClick={handleCreateArticle}
                  disabled={createArticleMutation.isPending}
                >
                  {createArticleMutation.isPending ? "Creating..." : "Create Article"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          data-testid="input-search"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  data-testid="button-category-all"
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === null 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  All Articles
                </button>
                {renderCategoryTree(hierarchicalCategories)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search terms" : "No articles have been created yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredArticles.map((article: any) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/resources/articles/${article.id}`}>
                          <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                            {article.title}
                          </h3>
                        </Link>
                        {article.excerpt && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {article.authorName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(article.createdAt), 'MMM d, yyyy')}
                          </div>
                          {article.viewCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.viewCount}
                            </div>
                          )}
                          {article.likeCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {article.likeCount}
                            </div>
                          )}
                        </div>
                      </div>
                      {article.featuredImage && (
                        <img 
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-md ml-4"
                        />
                      )}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex gap-2 flex-wrap">
                          {article.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}