import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/use-has-permission";
import { Search, Plus, BookOpen, Eye, Heart, Calendar, User, Tag, Folder, ChevronRight, ChevronDown, Home, Settings, Users, FileText, BarChart3, Shield, Bell, Zap, Bookmark, Star, CheckCircle, AlertCircle, Info, HelpCircle, Mail, Phone, MessageSquare, Video, Image, Music, File, Download, Upload, Edit, Trash2, Copy, Share, ExternalLink, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, MoreHorizontal, MoreVertical, Menu, X, Check, Minus, CirclePlus, PlayCircle, Code, Sparkles, CheckSquare, Compass, ThumbsUp, Repeat1, Target, TrendingUp, Globe, Lock, Unlock, Clock, MessageCircle, UserCheck, DollarSign, Calculator, CreditCard, Banknote, HandCoins, PieChart, Receipt, Briefcase, Building, Building2, Store, ShoppingCart, Handshake, UserPlus, Phone as PhoneIcon, Megaphone, TrendingDown, Filter, SlidersHorizontal, GripVertical, Wrench } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { IconPicker } from "@/components/ui/icon-picker";
import { CategoryPermissionsModal } from "@/components/category-permissions-modal";
import { ToolDirectory } from "@/components/tool-directory";

// Helper function to render icons dynamically from the full lucide-react library
const renderIcon = (iconName: string, className = "w-4 h-4") => {
  let IconComponent = (LucideIcons as any)[iconName];
  if (!IconComponent && iconName) {
    const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    IconComponent = (LucideIcons as any)[pascalCase];
  }
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <Folder className={className} />;
};

// Helper function to get all descendant category IDs
const getAllDescendantIds = (categoryId: string, categories: any[]): string[] => {
  const descendants = [categoryId]; // Include the category itself
  const children = categories.filter(cat => cat.parentId === categoryId);
  
  for (const child of children) {
    descendants.push(...getAllDescendantIds(child.id, categories));
  }
  
  return descendants;
};

// Centralized search function that's null-safe
const createSearchMatcher = (searchTerm: string) => {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return () => true; // Return all articles if no search term
  
  const matches = (s?: string) => (s ?? '').toLowerCase().includes(q);
  return (article: any) => 
    matches(article.title) || 
    matches(article.excerpt) || 
    matches(article.content);
};

// Category Overview Component
function CategoryOverview({ 
  categoryId, 
  categories, 
  articles, 
  onCategorySelect,
  searchTerm,
  isAdmin,
  onArticleReorder
}: { 
  categoryId: string;
  categories: any[];
  articles: any[];
  onCategorySelect: (id: string) => void;
  searchTerm?: string;
  isAdmin?: boolean;
  onArticleReorder?: (categoryId: string, articleIds: { id: string; order: number }[]) => void;
}) {
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const subCategories = categories.filter(cat => cat.parentId === categoryId);
  
  // Get articles from this category AND all its descendant categories
  const allDescendantIds = getAllDescendantIds(categoryId, categories);
  const searchMatcher = createSearchMatcher(searchTerm || '');
  
  const categoryArticles = articles
    .filter(article => allDescendantIds.includes(article.categoryId))
    .filter(searchMatcher);
  
  // Get articles directly in this category (not in sub-categories) - also apply search filter
  // Sort by order for proper drag-and-drop
  const directCategoryArticles = articles
    .filter(article => article.categoryId === categoryId && !article.parentId)
    .filter(searchMatcher)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Handle article drag end
  const handleArticleDragEnd = (result: any) => {
    if (!result.destination || !onArticleReorder) return;
    
    const items = [...directCategoryArticles];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Create order updates
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index
    }));
    
    onArticleReorder(categoryId, updates);
  };

  if (!selectedCategory) return null;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {selectedCategory.icon && (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                {renderIcon(selectedCategory.icon, "w-6 h-6")}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{selectedCategory.name}</h1>
              {selectedCategory.description && (
                <p className="text-muted-foreground mb-4">{selectedCategory.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{subCategories.length} sub-categories</span>
                <span>{categoryArticles.length} total articles</span>
                {directCategoryArticles.length !== categoryArticles.length && (
                  <span className="text-xs">({directCategoryArticles.length} direct, {categoryArticles.length - directCategoryArticles.length} in sub-categories)</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-categories */}
      {subCategories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Sub-categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subCategories.map((subCat: any) => {
              // Get all articles in this sub-category AND all its descendants
              const subCatDescendantIds = getAllDescendantIds(subCat.id, categories);
              const subCatArticles = articles
                .filter(article => subCatDescendantIds.includes(article.categoryId))
                .filter(searchMatcher);
              return (
                <Card 
                  key={subCat.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onCategorySelect(subCat.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {subCat.icon && (
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {renderIcon(subCat.icon, "w-4 h-4")}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate">{subCat.name}</h3>
                        {subCat.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {subCat.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {subCatArticles.length} article{subCatArticles.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Articles in this Category and Sub-categories */}
      {categoryArticles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Articles in {selectedCategory.name}
            {categoryArticles.length !== directCategoryArticles.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (including sub-categories)
              </span>
            )}
          </h2>
          {isAdmin && directCategoryArticles.length > 0 ? (
            <>
              {/* Direct articles in this category - draggable */}
              <DragDropContext onDragEnd={handleArticleDragEnd}>
                <Droppable droppableId={`category-articles-${categoryId}`}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                      {directCategoryArticles.map((article: any, index: number) => {
                        const childArticles = categoryArticles.filter((a: any) => a.parentId === article.id);
                        const hasChildren = childArticles.length > 0;
                        
                        return (
                          <Draggable key={article.id} draggableId={article.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={snapshot.isDragging ? "opacity-80" : ""}
                              >
                                <Card className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-6">
                                    <div className="flex items-start gap-3">
                                      <div {...provided.dragHandleProps} className="cursor-grab p-1 hover:bg-muted rounded-sm mt-1">
                                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <Link href={`/resources/articles/${article.id}`}>
                                            <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                                              {article.title}
                                            </h3>
                                          </Link>
                                          {hasChildren && (
                                            <Badge variant="secondary" className="text-xs">
                                              {childArticles.length} sub-page{childArticles.length !== 1 ? 's' : ''}
                                            </Badge>
                                          )}
                                        </div>
                                        {article.excerpt && (
                                          <p className="text-muted-foreground mb-3 line-clamp-2">
                                            {article.excerpt}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            <span>{article.authorName || "Unknown"}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(new Date(article.createdAt), "MMM d, yyyy")}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            <span>{article.viewCount || 0} views</span>
                                          </div>
                                        </div>
                                      </div>
                                      {article.tags && article.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 ml-4">
                                          {article.tags.slice(0, 3).map((tag: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              {/* Articles from sub-categories - read-only display */}
              {(() => {
                const subCategoryArticles = categoryArticles.filter(
                  (a: any) => a.categoryId !== categoryId && !a.parentId
                );
                if (subCategoryArticles.length === 0) return null;
                return (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-medium mb-4 text-muted-foreground">From sub-categories</h3>
                    <div className="space-y-4">
                      {subCategoryArticles.map((article: any) => {
                        const childArticles = categoryArticles.filter((a: any) => a.parentId === article.id);
                        const hasChildren = childArticles.length > 0;
                        const articleCategory = categories.find((c: any) => c.id === article.categoryId);
                        
                        return (
                          <Card key={article.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Link href={`/resources/articles/${article.id}`}>
                                      <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                                        {article.title}
                                      </h3>
                                    </Link>
                                    {hasChildren && (
                                      <Badge variant="secondary" className="text-xs">
                                        {childArticles.length} sub-page{childArticles.length !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    {articleCategory && (
                                      <Badge variant="outline" className="text-xs">
                                        {articleCategory.name}
                                      </Badge>
                                    )}
                                  </div>
                                  {article.excerpt && (
                                    <p className="text-muted-foreground mb-3 line-clamp-2">
                                      {article.excerpt}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      <span>{article.authorName || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{format(new Date(article.createdAt), "MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>{article.viewCount || 0} views</span>
                                    </div>
                                  </div>
                                </div>
                                {article.tags && article.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 ml-4">
                                    {article.tags.slice(0, 3).map((tag: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="space-y-4">
              {categoryArticles
                .filter((article: any) => !article.parentId) // Only show top-level articles
                .map((article: any) => {
                  const childArticles = categoryArticles.filter((a: any) => a.parentId === article.id);
                  const hasChildren = childArticles.length > 0;
                  
                  return (
                    <Card key={article.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link href={`/resources/articles/${article.id}`}>
                                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                                  {article.title}
                                </h3>
                              </Link>
                              {hasChildren && (
                                <Badge variant="secondary" className="text-xs">
                                  {childArticles.length} sub-page{childArticles.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            {article.excerpt && (
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {article.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{article.authorName || "Unknown"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(article.createdAt), "MMM d, yyyy")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{article.viewCount || 0} views</span>
                              </div>
                            </div>
                          </div>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-4">
                              {article.tags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {subCategories.length === 0 && categoryArticles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-muted-foreground">
              This category doesn't have any sub-categories or articles yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'articles' | 'bookmarks' | 'tools'>('articles');
  const [sortBy, setSortBy] = useState<'order' | 'recent' | 'popular' | 'views'>('order');
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
    parentId: null as string | null,
  });
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [editCategory, setEditCategory] = useState({
    name: "",
    description: "",
    parentId: "none",
    icon: "",
    color: ""
  });
  const [permissionsCategoryId, setPermissionsCategoryId] = useState<string | null>(null);
  const [permissionsCategoryName, setPermissionsCategoryName] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 20;
  
  // Read query params on mount (category, create article with parent)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    // Handle create article with parent ID (for sub-pages)
    const createArticle = params.get('createArticle');
    const parentId = params.get('parentId');
    const categoryId = params.get('categoryId');
    
    if (createArticle === 'true') {
      setNewArticle({
        title: "",
        content: "",
        excerpt: "",
        categoryId: categoryId || "",
        tags: "",
        parentId: parentId || null,
      });
      setShowArticleDialog(true);
      // Clean up URL
      window.history.replaceState({}, '', '/resources');
    }
  }, []);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data for role checking
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user');
      return response.json();
    }
  });

  // Use role-based permission hook for consistent permission checks
  const { canManageArticles, isAdmin } = useRolePermissions();
  const canManageCategories = canManageArticles;
  
  // Admins can always drag-and-drop to reorder (no toggle needed)

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/knowledge-base/categories"],
  });

  const { data: articles = [] } = useQuery<any[]>({
    queryKey: ["/api/knowledge-base/articles"],
  });

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery<any[]>({
    queryKey: ['/api/knowledge-base/bookmarks'],
    enabled: currentView === 'bookmarks',
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
        variant: "default",
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
      setNewArticle({ title: "", content: "", excerpt: "", categoryId: "", tags: "", parentId: null });
      toast({
        title: "Success",
        variant: "default",
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

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/categories/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/categories"] });
      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      setEditCategory({
        name: "",
        description: "",
        parentId: "none",
        icon: "",
        color: ""
      });
      toast({
        title: "Success",
        variant: "default",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Category update error:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest("DELETE", `/api/knowledge-base/categories/${categoryId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/categories"] });
      setDeletingCategory(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Category deletion error:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Make sure it has no articles or subcategories.",
        variant: "destructive",
      });
    },
  });

  // Reorder categories mutation (admin only)
  const reorderCategoriesMutation = useMutation({
    mutationFn: async (categoryOrders: { id: string; order: number }[]) => {
      const response = await apiRequest("PUT", "/api/knowledge-base/categories/reorder", { categoryOrders });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/categories"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Category order updated",
      });
    },
    onError: (error: any) => {
      console.error("Category reorder error:", error);
      toast({
        title: "Error",
        description: "Failed to reorder categories",
        variant: "destructive",
      });
    },
  });

  // Reorder articles mutation (admin only)
  const reorderArticlesMutation = useMutation({
    mutationFn: async (articleOrders: { id: string; order: number }[]) => {
      const response = await apiRequest("PUT", "/api/knowledge-base/articles/reorder", { articleOrders });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/articles"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Article order updated",
      });
    },
    onError: (error: any) => {
      console.error("Article reorder error:", error);
      toast({
        title: "Error",
        description: "Failed to reorder articles",
        variant: "destructive",
      });
    },
  });

  const searchMatcher = createSearchMatcher(searchTerm || '');
  const filteredArticles = (articles as any[])
    .filter((article: any) => {
      // Apply search filter
      if (!searchMatcher(article)) return false;
      
      // Apply status filter
      if (statusFilter !== 'all' && article.status !== statusFilter) return false;
      
      // Apply author filter
      if (authorFilter !== 'all' && article.authorName !== authorFilter) return false;
      
      // Apply tag filter
      if (tagFilter !== 'all' && (!article.tags || !article.tags.includes(tagFilter))) return false;
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const articleDate = new Date(article.createdAt);
        const now = new Date();
        switch (dateFilter) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (articleDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (articleDate < monthAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (articleDate < yearAgo) return false;
            break;
        }
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'order':
          return (a.order || 0) - (b.order || 0);
        case 'popular':
          return (b.likeCount || 0) - (a.likeCount || 0);
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Organize categories into hierarchical structure
  const organizeCategories = (cats: any[], articlesList: any[]) => {
    const categoryMap = new Map();
    const topLevel: any[] = [];
    
    // Sort categories by order first
    const sortedCats = [...cats].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // First pass: create map of all categories
    sortedCats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Second pass: organize into hierarchy
    sortedCats.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        // This is a child category
        categoryMap.get(cat.parentId).children.push(categoryWithChildren);
      } else {
        // This is a top-level category
        topLevel.push(categoryWithChildren);
      }
    });
    
    // Sort children arrays by order
    categoryMap.forEach((cat) => {
      cat.children.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    });
    
    // Third pass: calculate article counts (including all descendants)
    // Use bottom-up approach: calculate children first, then parents
    const calculateArticleCount = (cat: any): number => {
      // Count articles directly in this category
      const directCount = (articlesList || []).filter((a: any) => a.categoryId === cat.id).length;
      
      // Add counts from all children (recursive)
      const childrenCount = (cat.children || []).reduce((sum: number, child: any) => {
        return sum + calculateArticleCount(child);
      }, 0);
      
      cat.articleCount = directCount + childrenCount;
      return cat.articleCount;
    };
    
    // Calculate counts starting from top-level categories
    topLevel.forEach(cat => calculateArticleCount(cat));
    
    return topLevel;
  };

  const hierarchicalCategories = organizeCategories(categories as any[], articles as any[]);
  
  // Flatten categories for drag-and-drop (get categories at a specific parent level)
  const getCategoriesAtLevel = (parentId: string | null): any[] => {
    return (categories as any[])
      .filter((cat: any) => cat.parentId === parentId || (parentId === null && !cat.parentId))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  };
  
  // Handle category drag end
  const handleCategoryDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Get the parent ID from the droppableId
    // Format: "root-categories" for top level, "category-children-{parentId}" for nested
    let parentId: string | null = null;
    const droppableId = result.source.droppableId;
    if (droppableId !== 'root-categories') {
      parentId = droppableId.replace('category-children-', '');
    }
    
    // Get categories at this level
    const levelCategories = getCategoriesAtLevel(parentId);
    const [movedCategory] = levelCategories.splice(sourceIndex, 1);
    levelCategories.splice(destinationIndex, 0, movedCategory);
    
    // Update orders
    const categoryOrders = levelCategories.map((cat, index) => ({
      id: cat.id,
      order: index
    }));
    
    reorderCategoriesMutation.mutate(categoryOrders);
  };
  
  // Handle article drag end
  const handleArticleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Get articles in the current list
    const articleList = [...topLevelArticles];
    const [movedArticle] = articleList.splice(sourceIndex, 1);
    articleList.splice(destinationIndex, 0, movedArticle);
    
    // Update orders
    const articleOrders = articleList.map((article, index) => ({
      id: article.id,
      order: index
    }));
    
    reorderArticlesMutation.mutate(articleOrders);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleArticle = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  // Helper function to get child articles of a given article
  const getChildArticles = (parentId: string) => {
    return filteredArticles.filter((article: any) => article.parentId === parentId);
  };

  // Helper function to create a sub-page
  const handleCreateSubPage = (parentArticle: any) => {
    setNewArticle({
      title: "",
      content: "",
      excerpt: "",
      categoryId: parentArticle.categoryId || "",
      tags: "",
      parentId: parentArticle.id,
    });
    setShowArticleDialog(true);
  };

  // Get top-level articles (those without a parent)
  const topLevelArticles = filteredArticles.filter((article: any) => !article.parentId);

  // Pagination calculations
  const totalArticles = topLevelArticles.length;
  const totalPages = Math.ceil(totalArticles / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  // Admins see all articles (no pagination) for accurate drag-and-drop ordering
  const paginatedArticles = isAdmin ? topLevelArticles : topLevelArticles.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, authorFilter, tagFilter, dateFilter, sortBy, selectedCategory]);

  // Render article with nested children recursively
  const renderArticleWithChildren = (article: any, level = 0) => {
    const childArticles = getChildArticles(article.id);
    const hasChildren = childArticles.length > 0;
    const isExpanded = expandedArticles.has(article.id);

    return (
      <div key={article.id} className="space-y-2">
        <Card className={`hover:shadow-md transition-shadow ${level > 0 ? 'border-l-4 border-l-primary/30' : ''}`} style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-2">
              {/* Expand/Collapse button for articles with children */}
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArticle(article.id);
                  }}
                  className="p-1 hover:bg-muted rounded-sm transition-colors mt-1"
                  data-testid={`button-toggle-article-${article.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link href={`/resources/articles/${article.id}`}>
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                          {article.title}
                        </h3>
                      </Link>
                      {hasChildren && (
                        <Badge variant="secondary" className="text-xs">
                          {childArticles.length} sub-page{childArticles.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{article.authorName || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(article.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{article.viewCount || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{article.likeCount || 0} likes</span>
                      </div>
                      {/* Add Sub-page button */}
                      {canManageCategories && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateSubPage(article);
                          }}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                          data-testid={`button-add-subpage-${article.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Sub-page
                        </Button>
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
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render child articles if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 mt-2">
            {childArticles.map((childArticle: any) => renderArticleWithChildren(childArticle, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render category item (used in both normal and drag-drop modes)
  const renderCategoryItem = (category: any, level: number, dragHandleProps?: any) => {
    const hasChildren = category.children?.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    
    return (
      <div className="flex items-center" style={{ marginLeft: `${level * 16}px` }}>
        {/* Drag handle (only in reorder mode) */}
        {isAdmin && dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab p-1 hover:bg-muted rounded-sm mr-1">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        {hasChildren ? (
          <button
            data-testid={`button-toggle-${category.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(category.id);
            }}
            className="p-1 hover:bg-muted rounded-sm transition-colors w-6 h-6 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-6 h-6" />
        )}
        <div className="flex items-center flex-1">
          <button
            data-testid={`button-category-${category.id}`}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === category.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {category.icon ? renderIcon(category.icon, "w-4 h-4") : <Folder className="w-4 h-4" />}
                {category.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {category.articleCount ?? 0}
              </Badge>
            </div>
          </button>
          
          {/* Edit/Delete dropdown - only for Admins and Managers, hidden in reorder mode */}
          {canManageCategories && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-1"
                  data-testid={`button-category-menu-${category.id}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(category);
                  }}
                  data-testid={`button-edit-category-${category.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setPermissionsCategoryId(category.id);
                    setPermissionsCategoryName(category.name);
                  }}
                  data-testid={`button-permissions-category-${category.id}`}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Access
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category);
                  }}
                  className="text-red-600"
                  data-testid={`button-delete-category-${category.id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  // Render category tree recursively
  const renderCategoryTree = (cats: any[], level = 0, parentId: string | null = null) => {
    if (isAdmin) {
      // Admin mode: use Droppable for drag-and-drop reordering of all category levels
      const droppableId = parentId ? `category-children-${parentId}` : "root-categories";
      
      return (
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {(cats || []).map((category: any, index: number) => {
                const hasChildren = category.children?.length > 0;
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps}
                        className={snapshot.isDragging ? "bg-muted rounded-md" : ""}
                      >
                        {renderCategoryItem(category, level, provided.dragHandleProps)}
                        {hasChildren && isExpanded && (
                          <div className="mt-1">
                            {renderCategoryTree(category.children, level + 1, category.id)}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
    }
    
    // Normal mode
    return (cats || []).map((category: any) => {
      const hasChildren = category.children?.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      
      return (
        <div key={category.id}>
          {renderCategoryItem(category, level)}
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(category.children, level + 1, category.id)}
            </div>
          )}
        </div>
      );
    });
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
      parentId: newArticle.parentId || null,
      tags: newArticle.tags ? newArticle.tags.split(',').map(tag => tag.trim()) : [],
    };
    
    console.log("Creating article with data:", articleData);
    createArticleMutation.mutate(articleData);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditCategory({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || "none",
      icon: category.icon || "",
      color: category.color || ""
    });
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    const categoryData = {
      name: editCategory.name.trim(),
      description: editCategory.description.trim() || null,
      parentId: editCategory.parentId === "none" ? null : editCategory.parentId,
      icon: editCategory.icon || null,
      color: editCategory.color || null
    };
    
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: categoryData
    });
  };

  const handleDeleteCategory = (category: any) => {
    setDeletingCategory(category);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-[#00c8c3]" />
            <h1 className="text-3xl font-bold tracking-tight text-black">Knowledge Base</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers, guides, and documentation
          </p>
        </div>
        {currentView !== 'tools' && (
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
                <DialogTitle>
                  {newArticle.parentId 
                    ? `Create Sub-page under "${(articles as any[]).find(a => a.id === newArticle.parentId)?.title || 'Parent'}"` 
                    : "Create New Article"}
                </DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="article-parent">Parent Article (optional)</Label>
                    <Select 
                      value={newArticle.parentId || "none"} 
                      onValueChange={(value) => setNewArticle({ ...newArticle, parentId: value === "none" ? null : value })}
                    >
                      <SelectTrigger data-testid="select-article-parent">
                        <SelectValue placeholder="Choose a parent article" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Parent (Top-level)</SelectItem>
                        {(articles as any[] || []).map((article: any) => (
                          <SelectItem key={article.id} value={article.id}>
                            {article.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
            <button
              data-testid="tab-articles"
              onClick={() => {
                setCurrentView('articles');
                setSelectedCategory(null);
              }}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'articles'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2 inline" />
              All Articles
            </button>
            <button
              data-testid="tab-bookmarks"
              onClick={() => setCurrentView('bookmarks')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'bookmarks'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Bookmark className="w-4 h-4 mr-2 inline" />
              My Bookmarks
            </button>
            <button
              data-testid="tab-tools"
              onClick={() => setCurrentView('tools')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'tools'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Wrench className="w-4 h-4 mr-2 inline" />
              Tool Directory
            </button>
        </div>
      </div>
        
      {/* Search and Sort - only show for articles view */}
      {currentView === 'articles' && (
        <div className="mb-6 space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  data-testid="input-search"
                  placeholder="Search articles by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-[#00C9C6] hover:bg-[#00b3b0]" : ""}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Select value={sortBy} onValueChange={(value: 'order' | 'recent' | 'popular' | 'views') => setSortBy(value)}>
                <SelectTrigger className="w-[180px]" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Custom Order</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Controls */}
            {showFilters && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Author:</span>
                  <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Authors</SelectItem>
                      {Array.from(new Set((articles || []).map((a: any) => a.authorName).filter(Boolean))).map((author: any) => (
                        <SelectItem key={author} value={author}>{author}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tag:</span>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {Array.from(new Set((articles || []).flatMap((a: any) => a.tags || []).filter(Boolean))).map((tag: any) => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Date:</span>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(statusFilter !== 'all' || authorFilter !== 'all' || tagFilter !== 'all' || dateFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setStatusFilter('all'); setAuthorFilter('all'); setTagFilter('all'); setDateFilter('all'); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
        </div>
      )}

      {currentView === 'tools' ? (
        <ToolDirectory />
      ) : currentView === 'articles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                  {isAdmin ? (
                    <DragDropContext onDragEnd={handleCategoryDragEnd}>
                      {renderCategoryTree(hierarchicalCategories)}
                    </DragDropContext>
                  ) : (
                    renderCategoryTree(hierarchicalCategories)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {selectedCategory ? (
              <CategoryOverview 
                categoryId={selectedCategory} 
                categories={categories as any[]} 
                articles={articles as any[]}
                onCategorySelect={setSelectedCategory}
                searchTerm={searchTerm}
                isAdmin={isAdmin}
                onArticleReorder={(categoryId, updates) => {
                  reorderArticlesMutation.mutate(updates);
                }}
              />
            ) : (
              <div className="space-y-4">
                {topLevelArticles.length === 0 ? (
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
                  <>
                    {isAdmin ? (
                      <DragDropContext onDragEnd={handleArticleDragEnd}>
                        <Droppable droppableId="articles-list">
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                              {paginatedArticles.map((article: any, index: number) => (
                                <Draggable key={article.id} draggableId={article.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={snapshot.isDragging ? "opacity-80" : ""}
                                    >
                                      <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                          <div className="flex items-start gap-3">
                                            <div {...provided.dragHandleProps} className="cursor-grab p-1 hover:bg-muted rounded-sm mt-1">
                                              <GripVertical className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                              <Link href={`/resources/articles/${article.id}`}>
                                                <h3 className="font-medium hover:text-primary cursor-pointer">{article.title}</h3>
                                              </Link>
                                              {article.excerpt && (
                                                <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
                                              )}
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                              Order: {article.order || 0}
                                            </Badge>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    ) : (
                      paginatedArticles.map((article: any) => renderArticleWithChildren(article))
                    )}
                    
                    {/* Pagination Controls - hidden for admins who always have reorder capability */}
                    {totalPages > 1 && !isAdmin && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, totalArticles)} of {totalArticles} articles
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            data-testid="button-first-page"
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            data-testid="button-prev-page"
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                  data-testid={`button-page-${pageNum}`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            data-testid="button-next-page"
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            data-testid="button-last-page"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Bookmarks View */
        <div className="space-y-4">
          {isLoadingBookmarks ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-muted-foreground">Loading your bookmarks...</p>
              </CardContent>
            </Card>
          ) : !bookmarks || (bookmarks as any[]).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Bookmark articles you want to save for later by clicking the bookmark icon on any article.
                </p>
                <Button 
                  onClick={() => setCurrentView('articles')}
                  variant="outline"
                  data-testid="button-browse-articles"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Articles
                </Button>
              </CardContent>
            </Card>
          ) : (
            (bookmarks as any[]).map((bookmark: any) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/resources/articles/${bookmark.articleId}`}>
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                          {bookmark.articleTitle}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Bookmark className="w-4 h-4" />
                          <span>Bookmarked {format(new Date(bookmark.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">Name *</Label>
              <Input
                id="edit-category-name"
                data-testid="input-edit-category-name"
                placeholder="Enter category name"
                value={editCategory.name}
                onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                data-testid="textarea-edit-category-description"
                placeholder="Enter category description"
                value={editCategory.description}
                onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-parent">Parent Category</Label>
              <Select value={editCategory.parentId} onValueChange={(value) => setEditCategory({ ...editCategory, parentId: value })}>
                <SelectTrigger id="edit-category-parent" data-testid="select-edit-category-parent">
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {(categories as any[]).filter((cat: any) => cat.id !== editingCategory?.id).map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-icon">Icon</Label>
              <IconPicker
                value={editCategory.icon}
                onChange={(icon) => setEditCategory({ ...editCategory, icon })}
                data-testid="icon-picker-edit-category"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-color">Color</Label>
              <Input
                id="edit-category-color"
                type="color"
                value={editCategory.color}
                onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                data-testid="input-edit-category-color"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-update-category"
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              This action cannot be undone and will permanently remove this category.
              Make sure the category has no articles or subcategories before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) {
                  deleteCategoryMutation.mutate(deletingCategory.id);
                }
              }}
              disabled={deleteCategoryMutation.isPending}
              className="bg-red-600 hover:bg-red-600/90"
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Permissions Modal */}
      <CategoryPermissionsModal
        isOpen={!!permissionsCategoryId}
        onClose={() => {
          setPermissionsCategoryId(null);
          setPermissionsCategoryName("");
        }}
        categoryId={permissionsCategoryId || ""}
        categoryName={permissionsCategoryName}
      />
    </div>
  );
}