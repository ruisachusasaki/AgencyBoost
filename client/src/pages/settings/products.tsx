import { useState, useEffect, useMemo, Fragment } from "react";
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
  Package2,
  ShoppingCart,
  X,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Layers
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
  usageCount?: number;
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

interface ProductPackage {
  id: string;
  name: string;
  description?: string;
  status: string;
  itemCount?: number;
  totalCost?: number;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
  items?: PackageItem[];
}

interface PackageItem {
  id: string;
  packageId: string;
  itemType: string;
  productId?: string;
  bundleId?: string;
  quantity: number;
  product?: Product;
  bundle?: ProductBundle;
}

export default function ProductsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateBundleOpen, setIsCreateBundleOpen] = useState(false);
  const [isEditBundleOpen, setIsEditBundleOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
  const [bundleProducts, setBundleProducts] = useState<Array<{productId: string, quantity: number}>>([]);
  const [bundleProductSearch, setBundleProductSearch] = useState("");
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ProductPackage | null>(null);
  const [packageItems, setPackageItems] = useState<Array<{itemType: string, productId?: string, bundleId?: string, quantity: number}>>([]);
  const [packageSearchTerm, setPackageSearchTerm] = useState("");
  const [packageItemSearch, setPackageItemSearch] = useState("");
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [packageCurrentPage, setPackageCurrentPage] = useState(1);
  const [packagesPerPage, setPackagesPerPage] = useState(10);
  
  // Form state for controlled Select components
  const [createFormType, setCreateFormType] = useState("one_time");
  const [createFormStatus, setCreateFormStatus] = useState("active");
  const [createFormCategoryId, setCreateFormCategoryId] = useState("");
  const [editFormType, setEditFormType] = useState("");
  const [editFormStatus, setEditFormStatus] = useState("");
  const [editFormCategoryId, setEditFormCategoryId] = useState("");
  const [editFormPrice, setEditFormPrice] = useState("");
  const [editFormCost, setEditFormCost] = useState("");

  // State for tracking expanded bundles
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<'name' | 'type' | 'status' | 'category' | 'cost' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Bundle pagination state
  const [bundleCurrentPage, setBundleCurrentPage] = useState(1);
  const [bundlesPerPage, setBundlesPerPage] = useState(10);

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
              const detailData = await detailResponse.json();
              return {
                ...detailData,
                usageCount: bundle.usageCount // Preserve usage count from main API
              };
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

  // Fetch product packages
  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<ProductPackage[]>({
    queryKey: ["/api/product-packages"],
    refetchOnWindowFocus: false,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateProductOpen(false);
      toast({
        title: "Success",
        variant: "default",
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

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      // Invalidate all related queries to ensure real-time updates everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Also invalidate any specific bundle product queries
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('/products'))
      });
      setIsEditProductOpen(false);
      setEditingProduct(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Product updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Create bundle mutation
  // Filter products for bundle selection with optimization
  const filteredProductsForBundle = useMemo(() => {
    const lcSearch = bundleProductSearch.trim().toLowerCase();
    if (!lcSearch) return products;
    return products.filter((product) => 
      product.name.toLowerCase().includes(lcSearch) ||
      (product.description && product.description.toLowerCase().includes(lcSearch))
    );
  }, [products, bundleProductSearch]);

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
      setBundleProductSearch("");
      toast({
        title: "Success",
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/product-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      setIsCreateCategoryOpen(false);
      toast({
        title: "Success",
        variant: "default",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", "/api/product-categories/" + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // Refresh products as they reference categories
      setIsEditCategoryOpen(false);
      setEditingCategory(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if category is in use before deleting
      const productsUsingCategory = products.filter(product => product.categoryId === id);
      if (productsUsingCategory.length > 0) {
        throw new Error(`Cannot delete category. ${productsUsingCategory.length} product(s) are using this category.`);
      }
      return apiRequest("DELETE", "/api/product-categories/" + id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/product-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-packages"] });
      setIsCreatePackageOpen(false);
      setPackageItems([]);
      setPackageItemSearch("");
      toast({
        title: "Success",
        variant: "default",
        description: "Package created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/product-packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-packages"] });
      setIsEditPackageOpen(false);
      setEditingPackage(null);
      setPackageItems([]);
      toast({
        title: "Success",
        variant: "default",
        description: "Package updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/product-packages/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-packages"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Package deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Client-side validation
    const name = (formData.get("name") as string)?.trim();
    const price = formData.get("price") as string;
    
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!price || parseFloat(price) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price (0 or greater)",
        variant: "destructive",
      });
      return;
    }
    
    if (!createFormType) {
      toast({
        title: "Validation Error",
        description: "Please select a product type",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      name,
      description: (formData.get("description") as string)?.trim() || "",
      price,
      cost: formData.get("cost") as string,
      type: createFormType,
      categoryId: createFormCategoryId || undefined,
      status: createFormStatus,
    };
    createProductMutation.mutate(data);
  };

  const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.currentTarget);
    
    // Client-side validation  
    const name = (formData.get("name") as string)?.trim();
    
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!editFormPrice || parseFloat(editFormPrice) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price (0 or greater)",
        variant: "destructive",
      });
      return;
    }
    
    if (!editFormType) {
      toast({
        title: "Validation Error",
        description: "Please select a product type",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      name,
      description: (formData.get("description") as string)?.trim() || "",
      price: editFormPrice,
      cost: editFormCost || null,
      type: editFormType,
      categoryId: editFormCategoryId || undefined,
      status: editFormStatus,
    };
    updateProductMutation.mutate({ id: editingProduct.id, data });
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditFormType(product.type);
    setEditFormStatus(product.status);
    setEditFormCategoryId(product.categoryId || "");
    setEditFormPrice(product.price?.toString() || "");
    setEditFormCost(product.cost?.toString() || "");
    setIsEditProductOpen(true);
  };

  const resetCreateProductForm = () => {
    setCreateFormType("one_time");
    setCreateFormStatus("active");
    setCreateFormCategoryId("");
  };

  const resetEditProductForm = () => {
    setEditFormType("");
    setEditFormStatus("");
    setEditFormCategoryId("");
    setEditFormPrice("");
    setEditFormCost("");
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
      
      // Load existing products into the form with their quantities
      if (detailedBundle.products && detailedBundle.products.length > 0) {
        const bundleProductsData = detailedBundle.products.map((product: any) => ({
          productId: product.productId,
          quantity: product.quantity || 1
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

  // Package handlers
  const handleCreatePackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      items: packageItems,
    };
    createPackageMutation.mutate(data);
  };

  const handleEditPackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPackage) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      items: packageItems,
    };
    updatePackageMutation.mutate({ id: editingPackage.id, data });
  };

  const openEditPackage = async (pkg: ProductPackage) => {
    try {
      const response = await fetch(`/api/product-packages/${pkg.id}`);
      if (!response.ok) throw new Error('Failed to fetch package details');
      const detailedPackage = await response.json();
      setEditingPackage(detailedPackage);
      if (detailedPackage.items && detailedPackage.items.length > 0) {
        const items = detailedPackage.items.map((item: any) => ({
          itemType: item.itemType,
          productId: item.productId || undefined,
          bundleId: item.bundleId || undefined,
          quantity: item.quantity || 1,
        }));
        setPackageItems(items);
      } else {
        setPackageItems([]);
      }
      setIsEditPackageOpen(true);
    } catch (error) {
      console.error('Error loading package details:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load package details" });
    }
  };

  const addItemToPackage = () => {
    setPackageItems([...packageItems, { itemType: "product", productId: "", quantity: 1 }]);
  };

  const removeItemFromPackage = (index: number) => {
    setPackageItems(packageItems.filter((_, i) => i !== index));
  };

  const updatePackageItem = (index: number, field: string, value: any) => {
    const updated = [...packageItems];
    if (field === "itemType") {
      updated[index] = { itemType: value, productId: undefined, bundleId: undefined, quantity: updated[index].quantity };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPackageItems(updated);
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
      return { totalCost: 0 };
    }

    // Calculate total cost including quantities
    const totalCost = bundle.products.reduce((sum, product) => {
      // Handle various formats of cost fields (string, number, null, undefined)
      const costValue = product.productCost || product.cost || product.price || product.productPrice || 0;
      const cost = typeof costValue === 'string' ? parseFloat(costValue) : Number(costValue);
      
      // Get quantity (default to 1 if not set)
      const quantity = product.quantity || 1;
      
      // Ensure we have a valid number (not NaN)
      const validCost = isNaN(cost) ? 0 : cost;
      
      return sum + (validCost * quantity);
    }, 0);

    return { totalCost };
  };

  // Sorting and pagination logic
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Custom sortable table head component to match Custom Fields style
  const SortableTableHead = ({ 
    field, 
    children, 
    className = "" 
  }: { 
    field: typeof sortField; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-gray-50 select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortDirection === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  // Filter and sort products
  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;

        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'category':
          // Sort by category name, with "No category" items at the end
          const aCategoryName = a.categoryId ? (categories.find(cat => cat.id === a.categoryId)?.name || 'zzz') : 'zzz';
          const bCategoryName = b.categoryId ? (categories.find(cat => cat.id === b.categoryId)?.name || 'zzz') : 'zzz';
          aValue = aCategoryName.toLowerCase();
          bValue = bCategoryName.toLowerCase();
          break;
        case 'cost':
          // Sort by cost numerically, with products without cost at the end
          const aCost = a.cost ? parseFloat(a.cost) : -1;
          const bCost = b.cost ? parseFloat(b.cost) : -1;
          aValue = aCost;
          bValue = bCost;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

  // Calculate pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const filteredBundles = bundles.filter((bundle) =>
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bundle.description && bundle.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Bundle pagination calculations
  const totalBundlePages = Math.ceil(filteredBundles.length / bundlesPerPage);
  const bundleStartIndex = (bundleCurrentPage - 1) * bundlesPerPage;
  const bundleEndIndex = bundleStartIndex + bundlesPerPage;
  const paginatedBundles = filteredBundles.slice(bundleStartIndex, bundleEndIndex);

  // Category form handlers
  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };
    createCategoryMutation.mutate(data);
  };

  const handleEditCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };
    updateCategoryMutation.mutate({ id: editingCategory.id, data });
  };

  const openEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setIsEditCategoryOpen(true);
  };

  // Filter categories
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(categorySearchTerm.toLowerCase()))
  );

  // Filter and paginate packages
  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
    (pkg.description && pkg.description.toLowerCase().includes(packageSearchTerm.toLowerCase()))
  );
  const totalPackagePages = Math.ceil(filteredPackages.length / packagesPerPage);
  const packageStartIndex = (packageCurrentPage - 1) * packagesPerPage;
  const packageEndIndex = packageStartIndex + packagesPerPage;
  const paginatedPackages = filteredPackages.slice(packageStartIndex, packageEndIndex);

  const PackageItemsExpanded = ({ packageId }: { packageId: string }) => {
    const { data: packageDetail, isLoading } = useQuery<ProductPackage>({
      queryKey: ["/api/product-packages", packageId],
      queryFn: async () => {
        const response = await fetch(`/api/product-packages/${packageId}`);
        if (!response.ok) throw new Error('Failed to fetch package details');
        return response.json();
      },
    });

    if (isLoading) return <div className="text-sm text-gray-500">Loading items...</div>;
    if (!packageDetail?.items || packageDetail.items.length === 0) {
      return <div className="text-sm text-gray-500">No items in this package</div>;
    }

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Included Items ({packageDetail.items.length})</h4>
        {packageDetail.items.map((item: PackageItem) => {
          const itemName = item.itemType === 'product' 
            ? (item.product?.name || 'Unknown Product')
            : (item.bundle?.name || 'Unknown Bundle');
          const itemCost = item.itemType === 'product' 
            ? parseFloat(item.product?.cost || item.product?.price || '0')
            : 0;
          const qty = item.quantity || 1;
          return (
            <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-3">
                {item.itemType === 'product' ? (
                  <Package className="w-4 h-4 text-gray-500" />
                ) : (
                  <Package2 className="w-4 h-4 text-gray-500" />
                )}
                <div>
                  <span className="font-medium">{itemName}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {item.itemType}
                  </Badge>
                  <span className="text-sm text-gray-500 ml-2">
                    {qty} unit{qty !== 1 ? 's' : ''}
                    {item.itemType === 'product' && itemCost > 0 && ` @ $${itemCost.toFixed(2)} each`}
                  </span>
                </div>
              </div>
              {item.itemType === 'product' && itemCost > 0 && (
                <div className="text-sm font-medium text-blue-600">
                  ${(itemCost * qty).toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
          <Package className="h-8 w-8 text-primary" />
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
            { id: "bundles", name: "Bundles", icon: Package2, count: bundles.length },
            { id: "categories", name: "Categories", icon: ShoppingCart, count: categories.length },
            { id: "packages", name: "Packages", icon: Layers, count: packages.length }
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
              value={activeTab === "categories" ? categorySearchTerm : activeTab === "packages" ? packageSearchTerm : searchTerm}
              onChange={(e) => {
                if (activeTab === "categories") {
                  setCategorySearchTerm(e.target.value);
                } else if (activeTab === "packages") {
                  setPackageSearchTerm(e.target.value);
                } else {
                  setSearchTerm(e.target.value);
                }
              }}
              className="pl-9 w-80"
            />
          </div>
          
          {activeTab === "products" && (
            <Dialog open={isCreateProductOpen} onOpenChange={(open) => {
              setIsCreateProductOpen(open);
              if (!open) {
                resetCreateProductForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-10">
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
                    <Input id="name" name="name" required data-testid="input-product-name" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required data-testid="input-product-price" />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost (per unit)</Label>
                      <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={createFormType} onValueChange={setCreateFormType} required>
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
                      <Select value={createFormStatus} onValueChange={setCreateFormStatus}>
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
                    <Select value={createFormCategoryId} onValueChange={setCreateFormCategoryId}>
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
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateProductOpen(false);
                      resetCreateProductForm();
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProductMutation.isPending || !createFormType}
                      data-testid="button-create-product"
                    >
                      {createProductMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Product Dialog */}
          <Dialog open={isEditProductOpen} onOpenChange={(open) => {
            setIsEditProductOpen(open);
            if (!open) {
              resetEditProductForm();
              setEditingProduct(null);
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product details and pricing
                </DialogDescription>
              </DialogHeader>
              {editingProduct && (
                <form onSubmit={handleEditProduct} className="space-y-4" key={editingProduct.id}>
                  <div>
                    <Label htmlFor="edit-name">Product Name</Label>
                    <Input 
                      id="edit-name" 
                      name="name" 
                      defaultValue={editingProduct.name}
                      required
                      data-testid="input-edit-product-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      name="description" 
                      defaultValue={editingProduct.description || ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-price">Price</Label>
                      <Input 
                        id="edit-price" 
                        name="price" 
                        type="number" 
                        step="0.01" 
                        value={editFormPrice}
                        onChange={(e) => setEditFormPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        data-testid="input-edit-product-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-cost">Cost (per unit)</Label>
                      <Input 
                        id="edit-cost" 
                        name="cost" 
                        type="number" 
                        step="0.01" 
                        value={editFormCost}
                        onChange={(e) => setEditFormCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-type">Type</Label>
                      <Select value={editFormType} onValueChange={setEditFormType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One Time</SelectItem>
                          <SelectItem value="recurring">Recurring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editFormStatus} onValueChange={setEditFormStatus}>
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
                    <Label htmlFor="edit-categoryId">Category</Label>
                    <Select value={editFormCategoryId} onValueChange={setEditFormCategoryId}>
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditProductOpen(false);
                        resetEditProductForm();
                        setEditingProduct(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProductMutation.isPending || !editFormType}
                      data-testid="button-update-product"
                    >
                      {updateProductMutation.isPending ? "Updating..." : "Update Product"}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {activeTab === "bundles" && (
            <Dialog open={isCreateBundleOpen} onOpenChange={(open) => {
              setIsCreateBundleOpen(open);
              if (!open) {
                setBundleProducts([]);
                setBundleProductSearch("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-10">
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
                            <SelectContent className="max-h-60 overflow-hidden">
                              <div className="p-2 sticky top-0 z-10 bg-background border-b shadow-sm">
                                <Input
                                  placeholder="Search products..."
                                  value={bundleProductSearch}
                                  onChange={(e) => setBundleProductSearch(e.target.value)}
                                  className="h-8"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredProductsForBundle.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - ${product.cost || '0.00'} cost
                                  </SelectItem>
                                ))}
                                {filteredProductsForBundle.length === 0 && (
                                  <div className="p-2 text-sm text-muted-foreground text-center">
                                    No products found
                                  </div>
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-20">
                          <Label>Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={bundleProduct.quantity}
                            onChange={(e) => updateBundleProduct(index, "quantity", parseInt(e.target.value) || 1)}
                            className="h-10"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProductFromBundle(index)}
                          className="mb-0.5"
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
                      setBundleProductSearch("");
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

          {activeTab === "packages" && (
            <Dialog open={isCreatePackageOpen} onOpenChange={(open) => {
              setIsCreatePackageOpen(open);
              if (!open) {
                setPackageItems([]);
                setPackageItemSearch("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Package</DialogTitle>
                  <DialogDescription>
                    Create a package with products and bundles
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePackage} className="space-y-4">
                  <div>
                    <Label htmlFor="package-name">Package Name</Label>
                    <Input id="package-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="package-description">Description</Label>
                    <Textarea id="package-description" name="description" />
                  </div>
                  <div>
                    <Label htmlFor="package-status">Status</Label>
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
                      <Label>Package Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItemToPackage}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                    
                    {packageItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="w-28">
                          <Label>Type</Label>
                          <Select
                            value={item.itemType}
                            onValueChange={(value) => updatePackageItem(index, "itemType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="bundle">Bundle</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label>{item.itemType === "product" ? "Product" : "Bundle"}</Label>
                          {item.itemType === "product" ? (
                            <Select
                              value={item.productId || ""}
                              onValueChange={(value) => updatePackageItem(index, "productId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60 overflow-hidden">
                                <div className="p-2 sticky top-0 z-10 bg-background border-b shadow-sm">
                                  <Input
                                    placeholder="Search products..."
                                    value={packageItemSearch}
                                    onChange={(e) => setPackageItemSearch(e.target.value)}
                                    className="h-8"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {products
                                    .filter(p => !packageItemSearch || p.name.toLowerCase().includes(packageItemSearch.toLowerCase()))
                                    .map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} - ${product.cost || '0.00'} cost
                                      </SelectItem>
                                    ))}
                                </div>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={item.bundleId || ""}
                              onValueChange={(value) => updatePackageItem(index, "bundleId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select bundle" />
                              </SelectTrigger>
                              <SelectContent>
                                {bundles.map((bundle) => (
                                  <SelectItem key={bundle.id} value={bundle.id}>
                                    {bundle.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="w-20">
                          <Label>Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updatePackageItem(index, "quantity", parseInt(e.target.value) || 1)}
                            className="h-10"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemFromPackage(index)}
                          className="mb-0.5"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreatePackageOpen(false);
                      setPackageItems([]);
                      setPackageItemSearch("");
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPackageMutation.isPending}>
                      {createPackageMutation.isPending ? "Creating..." : "Create Package"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === "categories" && (
            <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-10" data-testid="button-create-category">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new product category to organize your products
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input id="category-name" name="name" required data-testid="input-category-name" />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea id="category-description" name="description" data-testid="input-category-description" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCategoryMutation.isPending} data-testid="button-save-category">
                      {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
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
                      <SortableTableHead field="name">Name</SortableTableHead>
                      <SortableTableHead field="category">Category</SortableTableHead>
                      <SortableTableHead field="cost">Cost</SortableTableHead>
                      <SortableTableHead field="type">Type</SortableTableHead>
                      <SortableTableHead field="status">Status</SortableTableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product: Product) => (
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
                          {product.categoryId ? (
                            <Badge variant="outline">
                              {categories.find(cat => cat.id === product.categoryId)?.name || 'Unknown'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">No category</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.cost ? (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {product.cost}
                            </div>
                          ) : (
                            <span className="text-gray-400">No cost set</span>
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
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditProduct(product)}>
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
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteProductMutation.mutate(product.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Pagination Controls - Matching Custom Fields Style */}
              {totalProducts > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Showing {startIndex + 1} to {Math.min(endIndex, totalProducts)} of {totalProducts} products</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Show</span>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || 
                                 page === totalPages || 
                                 (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="text-muted-foreground px-2">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-8"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
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
                <>
                <div className="grid gap-4">
                  {paginatedBundles.map((bundle: ProductBundle) => {
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
                              <Badge variant="outline" className="text-sm">
                                {bundle.usageCount || 0} clients
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
                            {/* Bundle Metrics - Cost Only */}
                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-600">Total Bundle Cost</span>
                                </div>
                                <div className="text-lg font-bold text-blue-600">
                                  ${metrics.totalCost.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Bundle Products - Expandable */}
                            {bundle.products && bundle.products.length > 0 && (
                              <div>
                                <div 
                                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedBundles);
                                    if (newExpanded.has(bundle.id)) {
                                      newExpanded.delete(bundle.id);
                                    } else {
                                      newExpanded.add(bundle.id);
                                    }
                                    setExpandedBundles(newExpanded);
                                  }}
                                  data-testid={`button-expand-bundle-products-${bundle.id}`}
                                >
                                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                    {expandedBundles.has(bundle.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    Included Products ({bundle.products.length})
                                  </h4>
                                  <span className="text-sm text-gray-500">
                                    {expandedBundles.has(bundle.id) ? 'Click to collapse' : 'Click to expand'}
                                  </span>
                                </div>
                                
                                {expandedBundles.has(bundle.id) && (
                                  <div className="space-y-2 mt-2 pl-6">
                                    {bundle.products.map((product) => {
                                      const qty = product.quantity || 1;
                                      const unitCost = parseFloat(product.productCost || '0');
                                      const totalProductCost = unitCost * qty;
                                      return (
                                        <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <div className="flex items-center gap-3">
                                            <ShoppingCart className="w-4 h-4 text-gray-500" />
                                            <div>
                                              <span className="font-medium">{product.productName}</span>
                                              <span className="text-sm text-gray-500 ml-2">
                                                {qty} unit{qty !== 1 ? 's' : ''} @ ${unitCost.toFixed(2)} each
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-sm font-medium text-blue-600">
                                            ${totalProductCost.toFixed(2)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Bundle Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Showing {bundleStartIndex + 1}-{Math.min(bundleEndIndex, filteredBundles.length)} of {filteredBundles.length} bundles
                    </span>
                    <Select value={bundlesPerPage.toString()} onValueChange={(value) => {
                      setBundlesPerPage(parseInt(value));
                      setBundleCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                  {totalBundlePages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBundleCurrentPage(Math.max(1, bundleCurrentPage - 1))}
                        disabled={bundleCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalBundlePages }, (_, i) => i + 1)
                        .filter(page => {
                          const showPage = page === 1 || 
                                           page === totalBundlePages || 
                                           (page >= bundleCurrentPage - 1 && page <= bundleCurrentPage + 1);
                          return showPage;
                        })
                        .map((page, index, array) => (
                          <span key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && <span className="px-1">...</span>}
                            <Button
                              variant={bundleCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setBundleCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </span>
                        ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBundleCurrentPage(Math.min(totalBundlePages, bundleCurrentPage + 1))}
                        disabled={bundleCurrentPage === totalBundlePages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Product Categories
              </CardTitle>
              <CardDescription>
                Manage product categories to organize your products and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {categorySearchTerm ? "No categories found matching your search" : "No categories created yet"}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No categories found matching your search
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category: ProductCategory) => {
                      const productsInCategory = products.filter(product => product.categoryId === category.id);
                      return (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div className="font-medium" data-testid={`text-category-name-${category.id}`}>
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-gray-600" data-testid={`text-category-description-${category.id}`}>
                              {category.description || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`text-category-count-${category.id}`}>
                              {productsInCategory.length} {productsInCategory.length === 1 ? 'product' : 'products'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(category.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCategory(category)}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    data-testid={`button-delete-category-${category.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{category.name}"? 
                                      {productsInCategory.length > 0 && (
                                        <span className="text-red-600 font-medium">
                                          <br />Warning: {productsInCategory.length} product(s) are currently using this category.
                                        </span>
                                      )}
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid={`button-confirm-delete-category-${category.id}`}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Packages Tab */}
        {activeTab === "packages" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Product Packages
              </CardTitle>
              <CardDescription>
                Manage packages of products and bundles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPackages ? (
                <div className="text-center py-8">Loading packages...</div>
              ) : filteredPackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {packageSearchTerm ? "No packages found matching your search" : "No packages created yet"}
                </div>
              ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPackages.map((pkg: ProductPackage) => (
                      <Fragment key={pkg.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const newExpanded = new Set(expandedPackages);
                                if (newExpanded.has(pkg.id)) {
                                  newExpanded.delete(pkg.id);
                                } else {
                                  newExpanded.add(pkg.id);
                                }
                                setExpandedPackages(newExpanded);
                              }}
                            >
                              {expandedPackages.has(pkg.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{pkg.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {pkg.description || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {pkg.itemCount || 0} items
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {typeof pkg.totalCost === 'number' ? pkg.totalCost.toFixed(2) : parseFloat(pkg.totalCost || '0').toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                              {pkg.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditPackage(pkg)}>
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
                                    <AlertDialogTitle>Delete Package</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{pkg.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePackageMutation.mutate(pkg.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedPackages.has(pkg.id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-gray-50 p-4">
                              <PackageItemsExpanded packageId={pkg.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Showing {packageStartIndex + 1}-{Math.min(packageEndIndex, filteredPackages.length)} of {filteredPackages.length} packages
                    </span>
                    <Select value={packagesPerPage.toString()} onValueChange={(value) => {
                      setPackagesPerPage(parseInt(value));
                      setPackageCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                  {totalPackagePages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPackageCurrentPage(Math.max(1, packageCurrentPage - 1))}
                        disabled={packageCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPackagePages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPackagePages || (page >= packageCurrentPage - 1 && page <= packageCurrentPage + 1))
                        .map((page, index, array) => (
                          <span key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && <span className="px-1">...</span>}
                            <Button
                              variant={packageCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPackageCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </span>
                        ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPackageCurrentPage(Math.min(totalPackagePages, packageCurrentPage + 1))}
                        disabled={packageCurrentPage === totalPackagePages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

      {/* Edit Package Dialog */}
      <Dialog open={isEditPackageOpen} onOpenChange={setIsEditPackageOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>
              Update package details and items
            </DialogDescription>
          </DialogHeader>
          {editingPackage && (
            <form onSubmit={handleEditPackage} className="space-y-4">
              <div>
                <Label htmlFor="edit-package-name">Package Name</Label>
                <Input 
                  id="edit-package-name" 
                  name="name" 
                  defaultValue={editingPackage.name}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-package-description">Description</Label>
                <Textarea 
                  id="edit-package-description" 
                  name="description" 
                  defaultValue={editingPackage.description || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-package-status">Status</Label>
                <Select name="status" defaultValue={editingPackage.status}>
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
                  <Label>Package Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemToPackage}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {packageItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="w-28">
                      <Label>Type</Label>
                      <Select
                        value={item.itemType}
                        onValueChange={(value) => updatePackageItem(index, "itemType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="bundle">Bundle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>{item.itemType === "product" ? "Product" : "Bundle"}</Label>
                      {item.itemType === "product" ? (
                        <Select
                          value={item.productId || ""}
                          onValueChange={(value) => updatePackageItem(index, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-hidden">
                            <div className="p-2 sticky top-0 z-10 bg-background border-b shadow-sm">
                              <Input
                                placeholder="Search products..."
                                value={packageItemSearch}
                                onChange={(e) => setPackageItemSearch(e.target.value)}
                                className="h-8"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {products
                                .filter(p => !packageItemSearch || p.name.toLowerCase().includes(packageItemSearch.toLowerCase()))
                                .map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - ${product.cost || '0.00'} cost
                                  </SelectItem>
                                ))}
                            </div>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={item.bundleId || ""}
                          onValueChange={(value) => updatePackageItem(index, "bundleId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bundle" />
                          </SelectTrigger>
                          <SelectContent>
                            {bundles.map((bundle) => (
                              <SelectItem key={bundle.id} value={bundle.id}>
                                {bundle.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="w-20">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updatePackageItem(index, "quantity", parseInt(e.target.value) || 1)}
                        className="h-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItemFromPackage(index)}
                      className="mb-0.5"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditPackageOpen(false);
                  setEditingPackage(null);
                  setPackageItems([]);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePackageMutation.isPending}>
                  {updatePackageMutation.isPending ? "Updating..." : "Update Package"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                        <SelectContent className="max-h-60 overflow-hidden">
                          <div className="p-2 sticky top-0 z-10 bg-background border-b shadow-sm">
                            <Input
                              placeholder="Search products..."
                              value={bundleProductSearch}
                              onChange={(e) => setBundleProductSearch(e.target.value)}
                              className="h-8"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredProductsForBundle.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ${product.cost || '0.00'} cost
                              </SelectItem>
                            ))}
                            {filteredProductsForBundle.length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No products found
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={bundleProduct.quantity}
                        onChange={(e) => updateBundleProduct(index, "quantity", parseInt(e.target.value) || 1)}
                        className="h-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProductFromBundle(index)}
                      className="mb-0.5"
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

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input 
                  id="edit-category-name" 
                  name="name" 
                  defaultValue={editingCategory.name}
                  required 
                  data-testid="input-edit-category-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-description">Description</Label>
                <Textarea 
                  id="edit-category-description" 
                  name="description" 
                  defaultValue={editingCategory.description || ""}
                  data-testid="input-edit-category-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditCategoryOpen(false);
                  setEditingCategory(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCategoryMutation.isPending} data-testid="button-update-category">
                  {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
