import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Package, 
  Edit2, 
  Trash2, 
  DollarSign, 
  TrendingUp,
  Calculator,
  Package2,
  ShoppingCart,
  X,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  cost?: string;
  type: string;
  categoryId?: string;
  status: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  products?: BundleProduct[];
}

interface BundleProduct {
  id: string;
  bundleId: string;
  productId: string;
  quantity: number;
  productName: string;
  productDescription?: string;
  productPrice: string;
  productCost?: string;
  productType: string;
  productStatus: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function ProductsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateBundleOpen, setIsCreateBundleOpen] = useState(false);
  const [isEditBundleOpen, setIsEditBundleOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
  const [bundleProducts, setBundleProducts] = useState<Array<{productId: string, quantity: number}>>([]);

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchOnWindowFocus: false,
  });

  // Fetch product bundles with detailed product information
  const { data: bundles = [], isLoading: isLoadingBundles } = useQuery<ProductBundle[]>({
    queryKey: ["/api/product-bundles"],
    queryFn: async () => {
      const response = await fetch("/api/product-bundles");
      if (!response.ok) throw new Error('Failed to fetch bundles');
      const bundlesData = await response.json();
      
      // Fetch detailed information for each bundle
      const bundlesWithProducts = await Promise.all(
        bundlesData.map(async (bundle: ProductBundle) => {
          try {
            const detailResponse = await fetch(`/api/product-bundles/${bundle.id}`);
            if (detailResponse.ok) {
              return await detailResponse.json();
            }
            return bundle;
          } catch (error) {
            console.error(`Error fetching details for bundle ${bundle.id}:`, error);
            return bundle;
          }
        })
      );
      
      return bundlesWithProducts;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
    refetchOnWindowFocus: false,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateProductOpen(false);
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  // Create bundle mutation
  const createBundleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/product-bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create bundle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-bundles"] });
      setIsCreateBundleOpen(false);
      setBundleProducts([]);
      toast({
        title: "Success",
        description: "Bundle created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bundle",
        variant: "destructive",
      });
    },
  });

  // Update bundle mutation
  const updateBundleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/product-bundles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update bundle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-bundles"] });
      setIsEditBundleOpen(false);
      setEditingBundle(null);
      setBundleProducts([]);
      toast({
        title: "Success",
        description: "Bundle updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bundle",
        variant: "destructive",
      });
    },
  });

  // Delete bundle mutation
  const deleteBundleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/product-bundles/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete bundle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-bundles"] });
      toast({
        title: "Success",
        description: "Bundle deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bundle",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      cost: formData.get("cost") as string,
      type: formData.get("type") as string,
      categoryId: formData.get("categoryId") as string || undefined,
      status: formData.get("status") as string,
    };
    createProductMutation.mutate(data);
  };

  const handleCreateBundle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      products: bundleProducts,
    };
    createBundleMutation.mutate(data);
  };

  const handleEditBundle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBundle) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      products: bundleProducts,
    };
    updateBundleMutation.mutate({ id: editingBundle.id, data });
  };

  const openEditBundle = async (bundle: ProductBundle) => {
    try {
      // Fetch detailed bundle data with products
      const response = await fetch(`/api/product-bundles/${bundle.id}`);
      if (!response.ok) throw new Error('Failed to fetch bundle details');
      const detailedBundle = await response.json();
      
      setEditingBundle(detailedBundle);
      
      // Load existing products into the form
      if (detailedBundle.products && detailedBundle.products.length > 0) {
        const bundleProductsData = detailedBundle.products.map((product: any) => ({
          productId: product.productId,
          quantity: product.quantity
        }));
        setBundleProducts(bundleProductsData);
      } else {
        setBundleProducts([]);
      }
      
      setIsEditBundleOpen(true);
    } catch (error) {
      console.error('Error loading bundle details:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load bundle details" });
    }
  };

  const addProductToBundle = () => {
    setBundleProducts([...bundleProducts, { productId: "", quantity: 1 }]);
  };

  const removeProductFromBundle = (index: number) => {
    setBundleProducts(bundleProducts.filter((_, i) => i !== index));
  };

  const updateBundleProduct = (index: number, field: string, value: any) => {
    const updated = [...bundleProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBundleProducts(updated);
  };

  const calculateBundleMetrics = (bundle: ProductBundle) => {
    if (!bundle.products || bundle.products.length === 0) {
      return { totalRevenue: 0, totalCost: 0, profit: 0, margin: 0 };
    }

    const totalRevenue = bundle.products.reduce((sum, product) => {
      return sum + (parseFloat(product.productPrice || "0") * product.quantity);
    }, 0);

    const totalCost = bundle.products.reduce((sum, product) => {
      return sum + (parseFloat(product.productCost || "0") * product.quantity);
    }, 0);

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, profit, margin };
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBundles = bundles.filter((bundle) =>
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bundle.description && bundle.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Back to Settings Button */}
      <div className="flex items-center space-x-2">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Package className="h-8 w-8 text-[#46a1a0]" />
          <span>Products & Services</span>
        </h1>
        <p className="text-muted-foreground">
          Manage your products, services, and bundles with cost analysis
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "products", name: "Products", icon: Package, count: products.length },
            { id: "bundles", name: "Bundles", icon: Package2, count: bundles.length }
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

        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          
          {activeTab === "products" && (
            <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#46a1a0] hover:bg-[#3a8b8a] h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                  <DialogDescription>
                    Add a new product or service to your catalog
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" name="price" type="number" step="0.01" required />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost</Label>
                      <Input id="cost" name="cost" type="number" step="0.01" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One Time</SelectItem>
                          <SelectItem value="recurring">Recurring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="active">
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
                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select name="categoryId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateProductOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === "bundles" && (
            <Dialog open={isCreateBundleOpen} onOpenChange={setIsCreateBundleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#46a1a0] hover:bg-[#3a8b8a] h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bundle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bundle</DialogTitle>
                  <DialogDescription>
                    Create a bundle with multiple products and services
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBundle} className="space-y-4">
                  <div>
                    <Label htmlFor="bundle-name">Bundle Name</Label>
                    <Input id="bundle-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="bundle-description">Description</Label>
                    <Textarea id="bundle-description" name="description" />
                  </div>
                  <div>
                    <Label htmlFor="bundle-status">Status</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Bundle Products</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addProductToBundle}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </div>
                    
                    {bundleProducts.map((bundleProduct, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label>Product</Label>
                          <Select
                            value={bundleProduct.productId}
                            onValueChange={(value) => updateBundleProduct(index, "productId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - ${product.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={bundleProduct.quantity}
                            onChange={(e) => updateBundleProduct(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProductFromBundle(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateBundleOpen(false);
                      setBundleProducts([]);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBundleMutation.isPending}>
                      {createBundleMutation.isPending ? "Creating..." : "Create Bundle"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products & Services
              </CardTitle>
              <CardDescription>
                Manage your product and service catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="text-center py-8">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No products found matching your search" : "No products created yet"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                            {product.price}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.cost ? (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {product.cost}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.type === "recurring" ? "default" : "secondary"}>
                            {product.type === "one_time" ? "One Time" : "Recurring"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === "active" ? "default" : "secondary"}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{product.usageCount} clients</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
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
        )}

        {/* Bundles Tab */}
        {activeTab === "bundles" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="w-5 h-5" />
                Product Bundles
              </CardTitle>
              <CardDescription>
                Manage bundles of products and services with automatic pricing calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBundles ? (
                <div className="text-center py-8">Loading bundles...</div>
              ) : filteredBundles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No bundles found matching your search" : "No bundles created yet"}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBundles.map((bundle: ProductBundle) => {
                    const metrics = calculateBundleMetrics(bundle);
                    return (
                      <Card key={bundle.id} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{bundle.name}</CardTitle>
                              {bundle.description && (
                                <CardDescription className="mt-1">
                                  {bundle.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={bundle.status === "active" ? "default" : "secondary"}>
                                {bundle.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditBundle(bundle)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Bundle</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this bundle? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteBundleMutation.mutate(bundle.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Bundle Metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-600">Revenue</span>
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  ${metrics.totalRevenue.toFixed(2)}
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Calculator className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-gray-600">Cost</span>
                                </div>
                                <div className="text-lg font-bold text-red-600">
                                  ${metrics.totalCost.toFixed(2)}
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-600">Profit</span>
                                </div>
                                <div className="text-lg font-bold text-blue-600">
                                  ${metrics.profit.toFixed(2)}
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium text-gray-600">Margin</span>
                                </div>
                                <div className="text-lg font-bold text-purple-600">
                                  {metrics.margin.toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            {/* Bundle Products */}
                            {bundle.products && bundle.products.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Included Products</h4>
                                <div className="space-y-2">
                                  {bundle.products.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div className="flex items-center gap-3">
                                        <ShoppingCart className="w-4 h-4 text-gray-500" />
                                        <div>
                                          <span className="font-medium">{product.productName}</span>
                                          <span className="text-sm text-gray-500 ml-2">
                                            Qty: {product.quantity}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-sm font-medium">
                                        ${(parseFloat(product.productPrice) * product.quantity).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Edit Bundle Dialog */}
      <Dialog open={isEditBundleOpen} onOpenChange={setIsEditBundleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>
              Update bundle details and products
            </DialogDescription>
          </DialogHeader>
          {editingBundle && (
            <form onSubmit={handleEditBundle} className="space-y-4">
              <div>
                <Label htmlFor="edit-bundle-name">Bundle Name</Label>
                <Input 
                  id="edit-bundle-name" 
                  name="name" 
                  defaultValue={editingBundle.name}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-bundle-description">Description</Label>
                <Textarea 
                  id="edit-bundle-description" 
                  name="description" 
                  defaultValue={editingBundle.description || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-bundle-status">Status</Label>
                <Select name="status" defaultValue={editingBundle.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Bundle Products</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addProductToBundle}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
                
                {bundleProducts.map((bundleProduct, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Product</Label>
                      <Select
                        value={bundleProduct.productId}
                        onValueChange={(value) => updateBundleProduct(index, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ${product.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={bundleProduct.quantity}
                        onChange={(e) => updateBundleProduct(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProductFromBundle(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditBundleOpen(false);
                  setEditingBundle(null);
                  setBundleProducts([]);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBundleMutation.isPending}>
                  {updateBundleMutation.isPending ? "Updating..." : "Update Bundle"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}