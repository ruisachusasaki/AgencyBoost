import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, DollarSign, Clock, Repeat, Search, Filter, TrendingUp, Percent, Download, Upload } from "lucide-react";
import type { Product, ProductCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedProduct extends Product {
  categoryName?: string;
  profit?: number;
  marginPercent?: number;
}

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EnhancedProduct | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch products with enhanced data
  const { data: products = [], isLoading: productsLoading } = useQuery<EnhancedProduct[]>({
    queryKey: ["/api/products", { search: searchTerm || undefined, category: selectedCategory !== "all" ? selectedCategory : undefined, status: selectedStatus !== "all" ? selectedStatus : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      // Calculate profit and margin for each product
      return data.map((product: any) => {
        const price = parseFloat(product.price || "0");
        const cost = parseFloat(product.cost || "0");
        const profit = price - cost;
        const marginPercent = price > 0 ? (profit / price) * 100 : 0;
        
        return {
          ...product,
          profit,
          marginPercent
        };
      });
    },
  });

  // Fetch product categories
  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
    queryFn: async () => {
      const response = await fetch("/api/product-categories");
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    type: "one_time" as "one_time" | "recurring",
    categoryId: "",
    status: "active" as "active" | "inactive"
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: typeof newProduct) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...data,
          price: data.price,
          cost: data.cost || null
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product created successfully." });
      setIsAddDialogOpen(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        cost: "",
        type: "one_time",
        categoryId: "",
        status: "active"
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create product" });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (product: EnhancedProduct) => {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price?.toString() || "0",
          cost: product.cost ? product.cost.toString() : null,
          type: product.type,
          categoryId: product.categoryId,
          status: product.status
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product updated successfully." });
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update product" });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product deleted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete product" });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof newCategory) => {
      const response = await fetch("/api/product-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Success", description: "Category created successfully." });
      setIsAddCategoryDialogOpen(false);
      setNewCategory({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create category" });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: ProductCategory) => {
      const response = await fetch(`/api/product-categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: category.name,
          description: category.description
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Success", description: "Category updated successfully." });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update category" });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/product-categories/${categoryId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete category: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Success", description: "Category deleted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete category" });
    }
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(newProduct);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProductMutation.mutate(editingProduct);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };

  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate(editingCategory);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Export products to CSV
  const handleExportProducts = () => {
    if (products.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No products available to export." });
      return;
    }

    // Define CSV headers
    const headers = [
      'name',
      'description', 
      'price',
      'cost',
      'type',
      'categoryId',
      'categoryName',
      'status'
    ];

    // Convert products to CSV format
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        `"${product.name?.replace(/"/g, '""') || ''}"`,
        `"${product.description?.replace(/"/g, '""') || ''}"`,
        product.price || '',
        product.cost || '',
        product.type || 'one_time',
        product.categoryId || '',
        `"${product.categoryName?.replace(/"/g, '""') || ''}"`,
        product.status || 'active'
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Success", description: `Exported ${products.length} products to CSV file.` });
  };

  // Import products from CSV
  const importProductsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import products');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsImportDialogOpen(false);
      setImportFile(null);
      toast({ 
        title: "Success", 
        description: `Successfully imported ${data.imported} products. ${data.errors ? `${data.errors} errors encountered.` : ''}` 
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Import Failed", description: error.message });
    }
  });

  const handleImportProducts = () => {
    if (!importFile) {
      toast({ variant: "destructive", title: "No File", description: "Please select a CSV file to import." });
      return;
    }
    importProductsMutation.mutate(importFile);
  };

  // Export category reference to CSV
  const handleExportCategoryReference = () => {
    if (categories.length === 0) {
      toast({ variant: "destructive", title: "No Categories", description: "No categories available. Create some categories first." });
      return;
    }

    // Define CSV headers for category reference
    const headers = ['categoryId', 'categoryName'];

    // Convert categories to CSV format
    const csvContent = [
      headers.join(','),
      ...categories.map(category => [
        category.id,
        `"${category.name?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `category-reference-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Success", description: `Downloaded category reference with ${categories.length} categories.` });
  };

  // Filter and calculate stats
  const activeProducts = products.filter(p => p.status === 'active');
  const inactiveProducts = products.filter(p => p.status === 'inactive');
  const totalRevenue = products.reduce((sum, p) => sum + parseFloat(p.price?.toString() || "0"), 0);
  const totalCost = products.reduce((sum, p) => sum + parseFloat(p.cost?.toString() || "0"), 0);
  const totalProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-[#46a1a0]" />
                Products & Services
              </h1>
              <p className="text-gray-600 mt-2">Manage your products and services catalog with cost analysis</p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleExportProducts} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handleExportCategoryReference} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Category Reference
              </Button>
              <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Product/Service</DialogTitle>
                <DialogDescription>Add a new product or service to your catalog</DialogDescription>
              </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="productName">Product/Service Name *</Label>
                      <Input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        rows={3}
                        placeholder="Describe what this product or service includes..."
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price * (Revenue)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            className="pl-10"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="cost">Cost (Optional)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            value={newProduct.cost}
                            onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                            className="pl-10"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select value={newProduct.type} onValueChange={(value: "one_time" | "recurring") => setNewProduct({...newProduct, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one_time">One-time</SelectItem>
                            <SelectItem value="recurring">Recurring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({...newProduct, categoryId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={newProduct.status} onValueChange={(value: "active" | "inactive") => setNewProduct({...newProduct, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending} className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                        {createProductMutation.isPending ? "Creating..." : "Create Product"}
                      </Button>
                    </div>
                  </form>
            </DialogContent>
          </Dialog>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-[#46a1a0] mr-3" />
                <div>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
                  <div className="text-sm text-gray-600">Total Profit</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Percent className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{formatPercent(overallMargin)}</div>
                  <div className="text-sm text-gray-600">Overall Margin</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{activeProducts.length}</div>
                  <div className="text-sm text-gray-600">Active Products</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Categories ({categories.length})</CardTitle>
                <CardDescription>Organize your products with categories for better management</CardDescription>
              </div>
              <Button onClick={() => setIsAddCategoryDialogOpen(true)} className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No categories created yet</p>
                <Button onClick={() => setIsAddCategoryDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Products & Services ({products.length})</CardTitle>
                <CardDescription>Manage your product catalog with cost analysis and profit margins</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Start by creating your first product or service</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product/Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.categoryName ? (
                          <Badge variant="outline">{product.categoryName}</Badge>
                        ) : (
                          <span className="text-gray-400">No category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.type === 'recurring' ? 'default' : 'secondary'}>
                          {product.type === 'recurring' ? (
                            <>
                              <Repeat className="h-3 w-3 mr-1" />
                              Recurring
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />  
                              One-time
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.cost ? formatCurrency(product.cost) : <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {product.cost ? (
                          <span className={product.profit && product.profit > 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(product.profit || 0)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {product.cost ? (
                          <span className={product.marginPercent && product.marginPercent > 0 ? "text-green-600" : "text-red-600"}>
                            {formatPercent(product.marginPercent || 0)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        {editingProduct && (
          <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Product: {editingProduct.name}</DialogTitle>
                <DialogDescription>Update product information and pricing</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div>
                  <Label htmlFor="editProductName">Product/Service Name *</Label>
                  <Input
                    id="editProductName"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    rows={3}
                    placeholder="Describe what this product or service includes..."
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPrice">Price * (Revenue)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="editPrice"
                        type="number"
                        step="0.01"
                        value={editingProduct.price?.toString() || ""}
                        onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                        className="pl-10"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="editCost">Cost</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="editCost"
                        type="number"
                        step="0.01"
                        value={editingProduct.cost?.toString() || ""}
                        onChange={(e) => setEditingProduct({...editingProduct, cost: e.target.value || null})}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculated Fields Display */}
                {editingProduct.cost && editingProduct.price && (
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Profit (Calculated)</Label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency((parseFloat(editingProduct.price.toString()) || 0) - (parseFloat(editingProduct.cost.toString()) || 0))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Margin % (Calculated)</Label>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatPercent(((parseFloat(editingProduct.price.toString()) || 0) - (parseFloat(editingProduct.cost.toString()) || 0)) / (parseFloat(editingProduct.price.toString()) || 1) * 100)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editType">Type</Label>
                    <Select value={editingProduct.type} onValueChange={(value: "one_time" | "recurring") => setEditingProduct({...editingProduct, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-time</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="editCategory">Category</Label>
                    <Select value={editingProduct.categoryId || ""} onValueChange={(value) => setEditingProduct({...editingProduct, categoryId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="editStatus">Status</Label>
                    <Select value={editingProduct.status} onValueChange={(value: "active" | "inactive") => setEditingProduct({...editingProduct, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateProductMutation.isPending} className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                    {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Category Dialog */}
        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category: {editingCategory.name}</DialogTitle>
                <DialogDescription>Update category information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditCategory} className="space-y-4">
                <div>
                  <Label htmlFor="editCategoryName">Category Name *</Label>
                  <Input
                    id="editCategoryName"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editCategoryDescription">Description</Label>
                  <Textarea
                    id="editCategoryDescription"
                    value={editingCategory.description || ""}
                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                    rows={2}
                    placeholder="Optional description for this category..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCategoryMutation.isPending} className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                    {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Products from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import products. Use "Export CSV" to see the format, and "Category Reference" to get category IDs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Required columns: name, price</li>
                  <li>• For categories: use either "categoryId" (recommended) or "categoryName"</li>
                  <li>• Download "Category Reference" to get the exact category IDs</li>
                  <li>• Type options: "one_time" or "recurring"</li>
                  <li>• Status options: "active" or "inactive"</li>
                </ul>
              </div>
              
              <div>
                <Label htmlFor="csvFile">CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Accepts CSV files up to 5MB
                </p>
              </div>
              
              {importFile && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Selected file:</p>
                  <p className="text-sm text-gray-600">{importFile.name}</p>
                  <p className="text-sm text-gray-600">{(importFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setImportFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportProducts}
                  disabled={!importFile || importProductsMutation.isPending}
                  className="bg-[#46a1a0] hover:bg-[#3a8b8a]"
                >
                  {importProductsMutation.isPending ? "Importing..." : "Import Products"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}