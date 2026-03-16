import { useState, useEffect, useMemo, Fragment, useCallback, useRef, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Layers,
  Copy,
  TrendingUp,
  ListChecks,
  ClipboardList,
  Users,
  Clock,
  GripVertical,
  AlertCircle,
  Info,
  Tags
} from "lucide-react";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  type: string;
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
  buildFee?: string;
  monthlyRetailPrice?: string;
  status: string;
  itemCount?: number;
  totalCost?: number | string;
  totalOneTimeCost?: string;
  totalRecurringCost?: string;
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

interface TaskTemplate {
  id: string;
  productId?: string;
  bundleId?: string;
  packageId?: string;
  name: string;
  description?: string;
  taskType: string;
  quantityMode: string;
  departmentId?: string;
  assignedStaffId?: string;
  assignedStaffFirstName?: string;
  assignedStaffLastName?: string;
  dueDateOffset: number;
  estimatedHours?: string;
  priority: string;
  sortOrder: number;
  dependsOnTemplateId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface Department {
  id: string;
  name: string;
}

const taskTemplateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  taskType: z.enum(["onboarding", "recurring", "one-time"], { required_error: "Task type is required" }),
  quantityMode: z.enum(["once", "per_unit", "per_unit_named"]),
  departmentId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  dueDateOffset: z.coerce.number().min(0, "Must be 0 or more").default(7),
  estimatedHours: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dependsOnTemplateId: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});
type TaskTemplateFormValues = z.infer<typeof taskTemplateFormSchema>;

export default function ProductsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
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
  const [taskMappingSearchTerm, setTaskMappingSearchTerm] = useState("");
  const [taskMappingCategoryFilter, setTaskMappingCategoryFilter] = useState("all");
  const [bundleFormType, setBundleFormType] = useState("recurring");
  const [packageItemSearch, setPackageItemSearch] = useState("");
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  // Task Mapping state
  const [expandedTaskMappingItems, setExpandedTaskMappingItems] = useState<Set<string>>(new Set());
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [templateParentType, setTemplateParentType] = useState<'product' | 'bundle' | 'package'>('product');
  const [templateParentId, setTemplateParentId] = useState<string>("");
  const [isCopyTemplatesOpen, setIsCopyTemplatesOpen] = useState(false);
  const [copyTemplatesSource, setCopyTemplatesSource] = useState<{ type: 'product' | 'bundle' | 'package'; id: string; name: string } | null>(null);
  const [copyTargetType, setCopyTargetType] = useState<'product' | 'bundle' | 'package'>('product');
  const [copyTargetId, setCopyTargetId] = useState("");
  const [packageCurrentPage, setPackageCurrentPage] = useState(1);
  const [packagesPerPage, setPackagesPerPage] = useState(10);

  const createNameRef = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);
  const [createTemplateName, setCreateTemplateName] = useState("");
  const [editTemplateName, setEditTemplateName] = useState("");
  const [createTemplateDescription, setCreateTemplateDescription] = useState("");
  const [editTemplateDescription, setEditTemplateDescription] = useState("");
  const [descEditorKey, setDescEditorKey] = useState(0);
  const createDescEditorRef = useRef<RichTextEditorHandle | null>(null);
  const editDescEditorRef = useRef<RichTextEditorHandle | null>(null);
  const [mergeTagSearch, setMergeTagSearch] = useState("");
  const [createNameMTOpen, setCreateNameMTOpen] = useState(false);
  const [createDescMTOpen, setCreateDescMTOpen] = useState(false);
  const [editNameMTOpen, setEditNameMTOpen] = useState(false);
  const [editDescMTOpen, setEditDescMTOpen] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => {
      setCreateNameMTOpen(false);
      setCreateDescMTOpen(false);
      setEditNameMTOpen(false);
      setEditDescMTOpen(false);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const nativeMergeTagOptions = [
    { tag: "{{client.name}}", label: "Client Name", description: "Company or client name", group: "Native" },
    { tag: "{{client.email}}", label: "Client Email", description: "Client's email address", group: "Native" },
    { tag: "{{product.name}}", label: "Product Name", description: "Name of the product/bundle/package", group: "Native" },
    { tag: "{{quantity}}", label: "Quantity", description: "Number of units assigned", group: "Native" },
    { tag: "{{cycle.number}}", label: "Cycle Number", description: "Current recurring cycle number", group: "Native" },
    { tag: "{{cycle.startDate}}", label: "Cycle Start Date", description: "Start date of current cycle", group: "Native" },
    { tag: "{{unit.number}}", label: "Unit Number", description: "Current unit number (Per Unit modes)", group: "Native" },
    { tag: "{{unit.total}}", label: "Unit Total", description: "Total number of units (Per Unit modes)", group: "Native" },
  ];

  const { data: customFieldsList = [] } = useQuery<{ id: string; name: string; type: string; folderId?: string }[]>({
    queryKey: ["/api/custom-fields"],
  });

  const mergeTagOptions = useMemo(() => {
    const customFieldTags = customFieldsList.map((field) => ({
      tag: `{{custom.${field.name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase()}}}`,
      label: field.name,
      description: `Custom field (${field.type})`,
      group: "Custom Fields",
    }));
    return [...nativeMergeTagOptions, ...customFieldTags];
  }, [customFieldsList]);

  const insertMergeTagToName = (isEdit: boolean, tag: string) => {
    if (isEdit) {
      setEditTemplateName(prev => prev + tag);
    } else {
      setCreateTemplateName(prev => prev + tag);
    }
  };

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

  // Fetch task templates (always loaded for tab count display)
  const { data: taskTemplates = [], isLoading: isLoadingTemplates } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/product-task-templates"],
    refetchOnWindowFocus: false,
  });

  // Fetch staff members (for template assignment)
  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
    enabled: activeTab === "taskMapping",
    refetchOnWindowFocus: false,
  });

  // Fetch departments
  const { data: departmentsList = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: activeTab === "taskMapping",
    refetchOnWindowFocus: false,
  });

  const { data: taskCategoriesList = [] } = useQuery<any[]>({
    queryKey: ["/api/task-categories"],
    enabled: activeTab === "taskMapping",
    refetchOnWindowFocus: false,
  });

  const { data: teamWorkflowsList = [] } = useQuery<any[]>({
    queryKey: ["/api/team-workflows"],
    enabled: activeTab === "taskMapping",
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

  const duplicatePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/product-packages/${id}/duplicate`, {
        method: "POST"
      });
      if (!response.ok) throw new Error('Failed to duplicate package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-packages"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Package duplicated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate package",
        variant: "destructive",
      });
    },
  });

  // Task Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/product-task-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-task-templates"] });
      setIsCreateTemplateOpen(false);
      toast({ title: "Success", description: "Task template created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/product-task-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-task-templates"] });
      setIsEditTemplateOpen(false);
      setEditingTemplate(null);
      toast({ title: "Success", description: "Task template updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update template", variant: "destructive" });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/product-task-templates/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-task-templates"] });
      setEditingTemplate(data);
      setEditTemplateDescription(data.description || "");
      setIsEditTemplateOpen(true);
      toast({ title: "Success", description: "Template duplicated — edit the copy below" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to duplicate template", variant: "destructive" });
    },
  });

  const copyTemplatesToItemMutation = useMutation({
    mutationFn: async (data: { sourceType: string; sourceId: string; targetType: string; targetId: string }) => {
      const res = await apiRequest("POST", "/api/product-task-templates/copy-to-item", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-task-templates"] });
      setIsCopyTemplatesOpen(false);
      setCopyTemplatesSource(null);
      toast({ title: "Success", description: data.message || "Templates copied successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to copy templates", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/product-task-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-task-templates"] });
      toast({ title: "Success", description: "Task template deactivated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete template", variant: "destructive" });
    },
  });

  const reorderTemplateMutation = useMutation({
    mutationFn: (items: Array<{ id: string; sortOrder: number }>) =>
      apiRequest("PATCH", "/api/product-task-templates/reorder", { items }),
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-task-templates"] });
      toast({ title: "Error", description: error.message || "Failed to reorder templates", variant: "destructive" });
    },
  });

  const [dragState, setDragState] = useState<{ templateId: string; groupKey: string } | null>(null);

  const handleTemplateDragStart = useCallback((e: React.DragEvent, templateId: string, groupKey: string) => {
    setDragState({ templateId, groupKey });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', templateId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleTemplateDragEnd = useCallback((e: React.DragEvent) => {
    setDragState(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleTemplateDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleTemplateDrop = useCallback((e: React.DragEvent, targetId: string, groupType: 'product' | 'bundle' | 'package', groupItemId: string) => {
    e.preventDefault();
    if (!dragState) return;
    const sourceId = dragState.templateId;
    const expectedGroupKey = `${groupType}-${groupItemId}`;
    if (dragState.groupKey !== expectedGroupKey) return;
    if (sourceId === targetId) return;

    const templates = getTemplatesForItem(groupType, groupItemId)
      .sort((a: TaskTemplate, b: TaskTemplate) => a.sortOrder - b.sortOrder);

    const sourceIndex = templates.findIndex((t: TaskTemplate) => t.id === sourceId);
    const targetIndex = templates.findIndex((t: TaskTemplate) => t.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...templates];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const items = reordered.map((t: TaskTemplate, i: number) => ({ id: t.id, sortOrder: i }));

    queryClient.setQueryData(["/api/product-task-templates"], (old: TaskTemplate[] | undefined) => {
      if (!old) return old;
      const orderMap = new Map(items.map(item => [item.id, item.sortOrder]));
      return old.map((t: TaskTemplate) => orderMap.has(t.id) ? { ...t, sortOrder: orderMap.get(t.id)! } : t);
    });

    reorderTemplateMutation.mutate(items);
    setDragState(null);
  }, [dragState, taskTemplates, queryClient, reorderTemplateMutation]);

  // Task mapping helpers
  const getTemplatesForItem = (type: 'product' | 'bundle' | 'package', itemId: string) => {
    return taskTemplates.filter((t: TaskTemplate) => {
      if (type === 'product') return t.productId === itemId;
      if (type === 'bundle') return t.bundleId === itemId;
      if (type === 'package') return t.packageId === itemId;
      return false;
    });
  };

  const toggleTaskMappingItem = (key: string) => {
    setExpandedTaskMappingItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name") as string,
      description: createTemplateDescription || null,
      taskType: formData.get("taskType") as string,
      quantityMode: formData.get("quantityMode") as string || "once",
      departmentId: formData.get("departmentId") as string || null,
      categoryId: formData.get("categoryId") as string || null,
      workflowId: formData.get("workflowId") as string || null,
      assignedStaffId: formData.get("assignedStaffId") as string || null,
      dueDateOffset: parseInt(formData.get("dueDateOffset") as string) || 7,
      estimatedHours: formData.get("estimatedHours") as string || null,
      priority: formData.get("priority") as string || "medium",
      status: "active",
    };
    if (templateParentType === 'product') data.productId = templateParentId;
    else if (templateParentType === 'bundle') data.bundleId = templateParentId;
    else if (templateParentType === 'package') data.packageId = templateParentId;
    createTemplateMutation.mutate(data);
  };

  const handleUpdateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name") as string,
      description: editTemplateDescription || null,
      taskType: formData.get("taskType") as string,
      quantityMode: formData.get("quantityMode") as string || "once",
      departmentId: formData.get("departmentId") as string || null,
      categoryId: formData.get("categoryId") as string || null,
      workflowId: formData.get("workflowId") as string || null,
      assignedStaffId: formData.get("assignedStaffId") as string || null,
      dueDateOffset: parseInt(formData.get("dueDateOffset") as string) || 7,
      estimatedHours: formData.get("estimatedHours") as string || null,
      priority: formData.get("priority") as string || "medium",
      productId: editingTemplate.productId || null,
      bundleId: editingTemplate.bundleId || null,
      packageId: editingTemplate.packageId || null,
    };
    updateTemplateMutation.mutate({ id: editingTemplate.id, data });
  };

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
    
    if (editFormPrice !== "" && editFormPrice !== null && parseFloat(editFormPrice) < 0) {
      toast({
        title: "Validation Error",
        description: "Price cannot be negative",
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
      price: editFormPrice || "0",
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
      type: bundleFormType,
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
      type: bundleFormType,
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
      setBundleFormType(detailedBundle.type || "recurring");
      
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
    const buildFeeVal = formData.get("buildFee") as string;
    const monthlyRetailVal = formData.get("monthlyRetailPrice") as string;
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      buildFee: buildFeeVal ? buildFeeVal : null,
      monthlyRetailPrice: monthlyRetailVal ? monthlyRetailVal : null,
      status: formData.get("status") as string,
      items: packageItems,
    };
    createPackageMutation.mutate(data);
  };

  const handleEditPackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPackage) return;
    const formData = new FormData(e.currentTarget);
    const buildFeeVal = formData.get("buildFee") as string;
    const monthlyRetailVal = formData.get("monthlyRetailPrice") as string;
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      buildFee: buildFeeVal ? buildFeeVal : null,
      monthlyRetailPrice: monthlyRetailVal ? monthlyRetailVal : null,
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
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === "all" || 
        (filterCategory === "uncategorized" ? !product.categoryId : product.categoryId === filterCategory);
      return matchesSearch && matchesCategory;
    })
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
          const aPrice = a.price ? parseFloat(a.price) : -1;
          const bPrice = b.price ? parseFloat(b.price) : -1;
          aValue = aPrice;
          bValue = bPrice;
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

    let totalOneTimeCost = 0;
    let totalRecurringCost = 0;
    let totalOneTimePrice = 0;
    let totalRecurringPrice = 0;

    const itemDetails = packageDetail.items.map((item: PackageItem) => {
      const qty = item.quantity || 1;
      if (item.itemType === 'product' && item.product) {
        const cost = parseFloat(item.product.cost || '0');
        const price = parseFloat(item.product.price || '0');
        const isRecurring = item.product.type === 'recurring';
        if (isRecurring) {
          totalRecurringCost += cost * qty;
          totalRecurringPrice += price * qty;
        } else {
          totalOneTimeCost += cost * qty;
          totalOneTimePrice += price * qty;
        }
        return { item, cost, price, qty, isRecurring, name: item.product.name, type: 'product' as const };
      } else if (item.itemType === 'bundle' && item.bundle) {
        let bundleCost = 0;
        let bundlePrice = 0;
        const bundleProds = (item.bundle as any).products || [];
        for (const bp of bundleProds) {
          const bpCost = parseFloat(bp.productCost || '0') * (bp.quantity || 1);
          const bpPrice = parseFloat(bp.productPrice || '0') * (bp.quantity || 1);
          bundleCost += bpCost;
          bundlePrice += bpPrice;
          if (bp.productType === 'recurring') {
            totalRecurringCost += bpCost * qty;
            totalRecurringPrice += bpPrice * qty;
          } else {
            totalOneTimeCost += bpCost * qty;
            totalOneTimePrice += bpPrice * qty;
          }
        }
        return { item, cost: bundleCost, price: bundlePrice, qty, isRecurring: false, name: item.bundle.name, type: 'bundle' as const, bundleProds };
      }
      return { item, cost: 0, price: 0, qty, isRecurring: false, name: 'Unknown', type: 'product' as const };
    });

    const buildFee = parseFloat(packageDetail.buildFee || '0');
    const monthlyRetail = parseFloat(packageDetail.monthlyRetailPrice || '0');
    const totalOnboardingCost = totalOneTimeCost + buildFee;
    const monthlyMargin = monthlyRetail > 0 ? ((monthlyRetail - totalRecurringCost) / monthlyRetail * 100) : 0;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">Included Items ({packageDetail.items.length})</h4>
          <div className="space-y-2">
            {itemDetails.map(({ item, cost, price, qty, isRecurring, name, type, bundleProds }: any) => (
              <div key={item.id} className="p-2 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {type === 'product' ? (
                      <Package className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Package2 className="w-4 h-4 text-gray-500" />
                    )}
                    <div>
                      <span className="font-medium">{name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {type}
                      </Badge>
                      {isRecurring && (
                        <Badge variant="outline" className="ml-1 text-xs border-primary text-primary">
                          recurring
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {qty} unit{qty !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-primary">${(price * qty).toFixed(2)} retail</div>
                    <div className="text-gray-500">${(cost * qty).toFixed(2)} cost</div>
                  </div>
                </div>
                {type === 'bundle' && bundleProds && bundleProds.length > 0 && (
                  <div className="mt-2 ml-7 space-y-1">
                    {bundleProds.map((bp: any) => (
                      <div key={bp.id} className="flex justify-between text-xs text-gray-500">
                        <span>{bp.productName} x{bp.quantity || 1} {bp.productType === 'recurring' ? '(recurring)' : ''}</span>
                        <span>${(parseFloat(bp.productCost || '0') * (bp.quantity || 1)).toFixed(2)} cost</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">One-Time / Onboarding</h5>
            <div className="space-y-1 text-sm">
              {buildFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Build Fee</span>
                  <span className="font-medium">${buildFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">One-Time Product Costs</span>
                <span className="font-medium">${totalOneTimeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Onboarding Cost</span>
                <span className="font-semibold">${totalOnboardingCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Monthly / Recurring</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly Costs</span>
                <span className="font-medium">${totalRecurringCost.toFixed(2)}</span>
              </div>
              {monthlyRetail > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Retail Price</span>
                  <span className="font-medium">${monthlyRetail.toFixed(2)}</span>
                </div>
              )}
              {monthlyRetail > 0 && (
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Monthly Margin</span>
                  <span className={`font-semibold ${monthlyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(monthlyRetail - totalRecurringCost).toFixed(2)} ({monthlyMargin.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
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
            { id: "products", name: "Products", icon: Package, count: isLoadingProducts ? null : products.length },
            { id: "bundles", name: "Bundles", icon: Package2, count: isLoadingBundles ? null : bundles.length },
            { id: "categories", name: "Categories", icon: ShoppingCart, count: categories.length },
            { id: "packages", name: "Packages", icon: Layers, count: isLoadingPackages ? null : packages.length },
            { id: "taskMapping", name: "Task Mapping", icon: ListChecks, count: isLoadingTemplates ? null : taskTemplates.length }
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
                {tab.name} ({tab.count !== null ? tab.count : "..."})
              </button>
            );
          })}
        </nav>
      </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={activeTab === "taskMapping" ? "Search products or templates..." : `Search ${activeTab}...`}
                value={activeTab === "categories" ? categorySearchTerm : activeTab === "packages" ? packageSearchTerm : activeTab === "taskMapping" ? taskMappingSearchTerm : searchTerm}
                onChange={(e) => {
                  if (activeTab === "categories") {
                    setCategorySearchTerm(e.target.value);
                  } else if (activeTab === "packages") {
                    setPackageSearchTerm(e.target.value);
                  } else if (activeTab === "taskMapping") {
                    setTaskMappingSearchTerm(e.target.value);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
                className="pl-9 w-80"
              />
            </div>
            {activeTab === "products" && categories.length > 0 && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {activeTab === "taskMapping" && categories.length > 0 && (
              <Select value={taskMappingCategoryFilter} onValueChange={setTaskMappingCategoryFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Product Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Product Types</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                        min="0"
                        value={editFormPrice}
                        onChange={(e) => setEditFormPrice(e.target.value)}
                        placeholder="0.00"
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
                setBundleFormType("recurring");
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cost Type</Label>
                      <Select value={bundleFormType} onValueChange={setBundleFormType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recurring">Monthly (Recurring)</SelectItem>
                          <SelectItem value="one_time">One-Time</SelectItem>
                        </SelectContent>
                      </Select>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="package-buildFee">Build Fee ($)</Label>
                      <Input id="package-buildFee" name="buildFee" type="number" step="0.01" min="0" placeholder="0.00" />
                    </div>
                    <div>
                      <Label htmlFor="package-monthlyRetail">Monthly Retail Price ($)</Label>
                      <Input id="package-monthlyRetail" name="monthlyRetailPrice" type="number" step="0.01" min="0" placeholder="0.00" />
                    </div>
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
                      <SortableTableHead field="cost">Price</SortableTableHead>
                      <TableHead>Cost</TableHead>
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
                          {product.price ? (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {product.price}
                            </div>
                          ) : (
                            <span className="text-gray-400">No price set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.cost ? (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {product.cost}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
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
                              <Badge variant="outline" className={bundle.type === 'one_time' ? 'border-orange-500 text-orange-600' : 'border-primary text-primary'}>
                                {bundle.type === 'one_time' ? 'One-Time' : 'Monthly'}
                              </Badge>
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
                      <TableHead>Build Fee</TableHead>
                      <TableHead>Monthly Retail</TableHead>
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
                            {pkg.buildFee && parseFloat(pkg.buildFee) > 0 ? (
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                {parseFloat(pkg.buildFee).toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pkg.monthlyRetailPrice && parseFloat(pkg.monthlyRetailPrice) > 0 ? (
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                {parseFloat(pkg.monthlyRetailPrice).toFixed(2)}/mo
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {typeof pkg.totalCost === 'number' ? pkg.totalCost.toFixed(2) : parseFloat(String(pkg.totalCost || '0')).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                              {pkg.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditPackage(pkg)} title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => duplicatePackageMutation.mutate(pkg.id)}
                                disabled={duplicatePackageMutation.isPending}
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Delete">
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
                            <TableCell colSpan={9} className="bg-gray-50 dark:bg-gray-900 p-4">
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

        {/* Task Mapping Tab */}
        {activeTab === "taskMapping" && (
          <div className="space-y-6">
            {isLoadingTemplates ? (
              <div className="text-center py-8">Loading task templates...</div>
            ) : (
              <>
                {/* Product-Level Templates */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Task Templates
                        </CardTitle>
                        <CardDescription className="mt-1.5">Task templates that auto-generate when a product is assigned to a client</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allKeys = new Set(products.map((p: Product) => `product-${p.id}`));
                            setExpandedTaskMappingItems(allKeys);
                          }}
                        >
                          Expand All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedTaskMappingItems(new Set())}
                        >
                          Collapse All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">No products available</div>
                    ) : (
                      <div className="space-y-2">
                        {(() => {
                          const searchLower = taskMappingSearchTerm.toLowerCase();
                          const filteredProducts = products.filter((p: Product) => {
                            const matchesSearch = !searchLower || p.name.toLowerCase().includes(searchLower) ||
                              getTemplatesForItem('product', p.id).some((t: TaskTemplate) => t.name.toLowerCase().includes(searchLower));
                            const matchesCategory = taskMappingCategoryFilter === 'all' ||
                              (taskMappingCategoryFilter === 'uncategorized' ? !p.categoryId : p.categoryId === taskMappingCategoryFilter);
                            return matchesSearch && matchesCategory;
                          });
                          const grouped: Record<string, Product[]> = {};
                          filteredProducts.forEach((p: Product) => {
                            const catName = categories.find((c: ProductCategory) => c.id === p.categoryId)?.name || "Uncategorized";
                            if (!grouped[catName]) grouped[catName] = [];
                            grouped[catName].push(p);
                          });
                          if (filteredProducts.length === 0) return <div className="text-center py-4 text-gray-400 text-sm">No products match your search or filter</div>;
                          return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([catName, catProducts]) => (
                            <div key={catName} className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{catName}</h4>
                              {catProducts.map((product: Product) => {
                                const templates = getTemplatesForItem('product', product.id);
                                const onboardingCount = templates.filter((t: TaskTemplate) => t.taskType === 'onboarding').length;
                                const recurringCount = templates.filter((t: TaskTemplate) => t.taskType === 'recurring').length;
                                const oneTimeCount = templates.filter((t: TaskTemplate) => t.taskType === 'one-time').length;
                                const isExpanded = expandedTaskMappingItems.has(`product-${product.id}`);
                                return (
                                  <div key={product.id} className="border rounded-lg mb-2">
                                    <div
                                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                      onClick={() => toggleTaskMappingItem(`product-${product.id}`)}
                                    >
                                      <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                        <span className="font-medium">{product.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {onboardingCount > 0 && (
                                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                            {onboardingCount} Onboarding
                                          </Badge>
                                        )}
                                        {recurringCount > 0 && (
                                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                            {recurringCount} Recurring
                                          </Badge>
                                        )}
                                        {oneTimeCount > 0 && (
                                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            {oneTimeCount} One-Time
                                          </Badge>
                                        )}
                                        {templates.length === 0 && (
                                          <span className="text-xs text-gray-400">No templates</span>
                                        )}
                                        {templates.length > 0 && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            title="Copy All Templates"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCopyTemplatesSource({ type: 'product', id: product.id, name: product.name });
                                              setCopyTargetType('product');
                                              setCopyTargetId('');
                                              setIsCopyTemplatesOpen(true);
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-1" /> Copy All
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-primary border-primary hover:bg-primary/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTemplateParentType('product');
                                            setTemplateParentId(product.id);
                                            setIsCreateTemplateOpen(true);
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                      </div>
                                    </div>
                                    {isExpanded && (
                                      <div className="border-t px-3 pb-3">
                                        {templates.length === 0 ? (
                                          <div className="text-center py-4 text-gray-400 text-sm flex items-center justify-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            No task templates mapped. Click "Add" to create one.
                                          </div>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-8"></TableHead>
                                                  <TableHead>Template Name</TableHead>
                                                  <TableHead>Type</TableHead>
                                                  <TableHead className="hidden md:table-cell">Qty Mode</TableHead>
                                                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                                                  <TableHead className="hidden lg:table-cell">Assigned Staff</TableHead>
                                                  <TableHead className="hidden md:table-cell">Due Offset</TableHead>
                                                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                                                  <TableHead className="w-20">Actions</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {templates.sort((a: TaskTemplate, b: TaskTemplate) => a.sortOrder - b.sortOrder).map((tmpl: TaskTemplate) => (
                                                  <TableRow
                                                    key={tmpl.id}
                                                    draggable
                                                    onDragStart={(e) => handleTemplateDragStart(e, tmpl.id, `product-${product.id}`)}
                                                    onDragEnd={handleTemplateDragEnd}
                                                    onDragOver={handleTemplateDragOver}
                                                    onDrop={(e) => handleTemplateDrop(e, tmpl.id, 'product', product.id)}
                                                    className={dragState?.templateId === tmpl.id ? 'opacity-50' : ''}
                                                  >
                                                    <TableCell className="w-8 cursor-grab active:cursor-grabbing">
                                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{tmpl.name}</TableCell>
                                                    <TableCell>
                                                      <Badge className={tmpl.taskType === 'onboarding' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : tmpl.taskType === 'one-time' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-teal-100 text-teal-800 hover:bg-teal-100'}>
                                                        {tmpl.taskType === 'onboarding' ? 'Onboarding' : tmpl.taskType === 'one-time' ? 'One-Time' : 'Recurring'}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell capitalize">{tmpl.quantityMode.replace('_', ' ')}</TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                      {tmpl.departmentId ? departmentsList.find((d: Department) => d.id === tmpl.departmentId)?.name || '-' : '-'}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                      {tmpl.assignedStaffFirstName ? `${tmpl.assignedStaffFirstName} ${tmpl.assignedStaffLastName || ''}`.trim() : '-'}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">{tmpl.dueDateOffset} days</TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                      <Badge variant="outline" className={
                                                        tmpl.priority === 'urgent' ? 'border-red-300 text-red-700' :
                                                        tmpl.priority === 'high' ? 'border-orange-300 text-orange-700' :
                                                        tmpl.priority === 'low' ? 'border-gray-300 text-gray-500' :
                                                        'border-gray-300 text-gray-700'
                                                      }>
                                                        {tmpl.priority}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(tmpl); setEditTemplateName(tmpl.name || ""); setEditTemplateDescription(tmpl.description || ""); setIsEditTemplateOpen(true); }} title="Edit">
                                                          <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => duplicateTemplateMutation.mutate(tmpl.id)} disabled={duplicateTemplateMutation.isPending} title="Duplicate">
                                                          <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" title="Deactivate">
                                                              <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                              <AlertDialogTitle>Deactivate Template</AlertDialogTitle>
                                                              <AlertDialogDescription>This will deactivate the template "{tmpl.name}". It can be reactivated later.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => deleteTemplateMutation.mutate(tmpl.id)}>Deactivate</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>
                                                      </div>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

      {/* Create Task Template Dialog */}
      <Dialog open={isCreateTemplateOpen} onOpenChange={(open) => { setIsCreateTemplateOpen(open); if (!open) { setCreateTemplateName(""); setCreateTemplateDescription(""); setDescEditorKey(k => k + 1); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Task Template</DialogTitle>
            <DialogDescription>
              Map a task template to this product
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="template-name">Template Name *</Label>
                <div className="relative">
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary gap-1" onClick={(e) => { e.stopPropagation(); setCreateNameMTOpen(!createNameMTOpen); setMergeTagSearch(""); }}>
                    <Tags className="h-3.5 w-3.5" />
                    Merge Tags
                  </Button>
                  {createNameMTOpen && (
                    <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-md p-2 z-[200]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Click to insert at cursor position</p>
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search merge tags..."
                          value={mergeTagSearch}
                          onChange={(e) => setMergeTagSearch(e.target.value)}
                          className="h-7 pl-7 text-xs"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto overscroll-contain">
                        <div className="space-y-0.5">
                        {(() => {
                          const filtered = mergeTagOptions.filter(o =>
                            o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) ||
                            o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())
                          );
                          const groups = [...new Set(filtered.map(o => o.group))];
                          return groups.map(group => (
                            <div key={group}>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1.5 pb-0.5">{group}</p>
                              {filtered.filter(o => o.group === group).map(option => (
                                <button
                                  key={option.tag}
                                  type="button"
                                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm flex items-center justify-between group"
                                  onClick={(e) => { e.stopPropagation(); insertMergeTagToName(false, option.tag); setCreateNameMTOpen(false); }}
                                >
                                  <span className="font-medium truncate mr-2">{option.label}</span>
                                  <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{option.tag}</code>
                                </button>
                              ))}
                            </div>
                          ));
                        })()}
                        {mergeTagOptions.filter(o => o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) || o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">No merge tags found</p>
                        )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Input ref={createNameRef} id="template-name" name="name" required placeholder="e.g., Set up {{product.name}} for {{client.name}}" value={createTemplateName} onChange={(e) => setCreateTemplateName(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                <div className="relative">
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary gap-1" onClick={(e) => { e.stopPropagation(); setCreateDescMTOpen(!createDescMTOpen); setMergeTagSearch(""); }}>
                    <Tags className="h-3.5 w-3.5" />
                    Merge Tags
                  </Button>
                  {createDescMTOpen && (
                    <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-md p-2 z-[200]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Click to insert into description</p>
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search merge tags..."
                          value={mergeTagSearch}
                          onChange={(e) => setMergeTagSearch(e.target.value)}
                          className="h-7 pl-7 text-xs"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto overscroll-contain">
                        <div className="space-y-0.5">
                        {(() => {
                          const filtered = mergeTagOptions.filter(o =>
                            o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) ||
                            o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())
                          );
                          const groups = [...new Set(filtered.map(o => o.group))];
                          return groups.map(group => (
                            <div key={group}>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1.5 pb-0.5">{group}</p>
                              {filtered.filter(o => o.group === group).map(option => (
                                <button
                                  key={option.tag}
                                  type="button"
                                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm flex items-center justify-between group"
                                  onClick={(e) => { e.stopPropagation(); if (createDescEditorRef.current) { createDescEditorRef.current.insertText(option.tag); } setCreateDescMTOpen(false); }}
                                >
                                  <span className="font-medium truncate mr-2">{option.label}</span>
                                  <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{option.tag}</code>
                                </button>
                              ))}
                            </div>
                          ));
                        })()}
                        {mergeTagOptions.filter(o => o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) || o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">No merge tags found</p>
                        )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <RichTextEditor
                key={`create-desc-${descEditorKey}`}
                content={createTemplateDescription}
                onChange={setCreateTemplateDescription}
                placeholder="e.g., Set up {{product.name}} for {{client.name}}"
                className="min-h-[120px]"
                editorRef={createDescEditorRef}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-6 flex items-center">
                  <Label htmlFor="template-taskType">Task Type *</Label>
                </div>
                <select name="taskType" id="template-taskType" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="onboarding" required>
                  <option value="onboarding">Onboarding</option>
                  <option value="recurring">Recurring</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
              <div>
                <div className="h-6 flex items-center gap-1.5">
                  <Label htmlFor="template-quantityMode">Quantity Mode</Label>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" className="max-w-[280px] text-xs leading-relaxed z-[100]" sideOffset={5}>
                        <p className="font-semibold mb-1">Once</p>
                        <p className="mb-2">Creates a single task regardless of product quantity.</p>
                        <p className="font-semibold mb-1">Per Unit</p>
                        <p className="mb-2">Creates one task for each unit of the product (e.g. 5 units = 5 tasks).</p>
                        <p className="font-semibold mb-1">Per Unit (Named)</p>
                        <p>Same as Per Unit, but each task title includes the unit number (e.g. "Task — Unit 1 of 5").</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <select name="quantityMode" id="template-quantityMode" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="once">
                  <option value="once">Once</option>
                  <option value="per_unit">Per Unit</option>
                  <option value="per_unit_named">Per Unit (Named)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-departmentId">Department</Label>
                <select name="departmentId" id="template-departmentId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="">
                  <option value="">None</option>
                  {departmentsList.map((dept: Department) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="template-assignedStaffId">Assigned Staff</Label>
                <select name="assignedStaffId" id="template-assignedStaffId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="">
                  <option value="">Unassigned</option>
                  {staffMembers.map((s: StaffMember) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-categoryId">Task Category</Label>
                <select name="categoryId" id="template-categoryId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="">
                  <option value="">None</option>
                  {taskCategoriesList.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="template-workflowId">Task Workflow</Label>
                <select name="workflowId" id="template-workflowId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="">
                  <option value="">None (use category default)</option>
                  {teamWorkflowsList.filter((w: any) => w.isActive !== false).map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="h-6 flex items-center gap-1.5">
                  <Label htmlFor="template-dueDateOffset">Due Date Offset (days)</Label>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-[260px] text-xs leading-relaxed z-[100]" sideOffset={5}>
                        <p>Number of days after the client starts (onboarding) or the cycle begins (recurring) that this task is due.</p>
                        <p className="mt-1 text-muted-foreground">Example: 7 means the task is due 1 week after the start date.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input id="template-dueDateOffset" name="dueDateOffset" type="number" defaultValue="7" min="0" />
              </div>
              <div>
                <div className="h-6 flex items-center">
                  <Label htmlFor="template-estimatedHours">Est. Hours</Label>
                </div>
                <Input id="template-estimatedHours" name="estimatedHours" type="number" step="0.25" placeholder="0" />
              </div>
              <div>
                <div className="h-6 flex items-center">
                  <Label htmlFor="template-priority">Priority</Label>
                </div>
                <select name="priority" id="template-priority" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="medium">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Template Dialog */}
      <Dialog open={isEditTemplateOpen} onOpenChange={(open) => { setIsEditTemplateOpen(open); if (!open) setEditingTemplate(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task Template</DialogTitle>
            <DialogDescription>Update this task template</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <form onSubmit={handleUpdateTemplate} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="edit-template-name">Template Name *</Label>
                  <div className="relative">
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary gap-1" onClick={(e) => { e.stopPropagation(); setEditNameMTOpen(!editNameMTOpen); setMergeTagSearch(""); }}>
                      <Tags className="h-3.5 w-3.5" />
                      Merge Tags
                    </Button>
                    {editNameMTOpen && (
                      <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-md p-2 z-[200]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Click to insert at cursor position</p>
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search merge tags..."
                            value={mergeTagSearch}
                            onChange={(e) => setMergeTagSearch(e.target.value)}
                            className="h-7 pl-7 text-xs"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto overscroll-contain">
                          <div className="space-y-0.5">
                          {(() => {
                            const filtered = mergeTagOptions.filter(o =>
                              o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) ||
                              o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())
                            );
                            const groups = [...new Set(filtered.map(o => o.group))];
                            return groups.map(group => (
                              <div key={group}>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1.5 pb-0.5">{group}</p>
                                {filtered.filter(o => o.group === group).map(option => (
                                  <button
                                    key={option.tag}
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm flex items-center justify-between group"
                                    onClick={(e) => { e.stopPropagation(); insertMergeTagToName(true, option.tag); setEditNameMTOpen(false); }}
                                  >
                                    <span className="font-medium truncate mr-2">{option.label}</span>
                                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{option.tag}</code>
                                  </button>
                                ))}
                              </div>
                            ));
                          })()}
                          {mergeTagOptions.filter(o => o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) || o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No merge tags found</p>
                          )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Input ref={editNameRef} id="edit-template-name" name="name" required value={editTemplateName} onChange={(e) => setEditTemplateName(e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Description</Label>
                  <div className="relative">
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary gap-1" onClick={(e) => { e.stopPropagation(); setEditDescMTOpen(!editDescMTOpen); setMergeTagSearch(""); }}>
                      <Tags className="h-3.5 w-3.5" />
                      Merge Tags
                    </Button>
                    {editDescMTOpen && (
                      <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-md p-2 z-[200]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Click to insert into description</p>
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search merge tags..."
                            value={mergeTagSearch}
                            onChange={(e) => setMergeTagSearch(e.target.value)}
                            className="h-7 pl-7 text-xs"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto overscroll-contain">
                          <div className="space-y-0.5">
                          {(() => {
                            const filtered = mergeTagOptions.filter(o =>
                              o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) ||
                              o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())
                            );
                            const groups = [...new Set(filtered.map(o => o.group))];
                            return groups.map(group => (
                              <div key={group}>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1.5 pb-0.5">{group}</p>
                                {filtered.filter(o => o.group === group).map(option => (
                                  <button
                                    key={option.tag}
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm flex items-center justify-between group"
                                    onClick={(e) => { e.stopPropagation(); if (editDescEditorRef.current) { editDescEditorRef.current.insertText(option.tag); } setEditDescMTOpen(false); }}
                                  >
                                    <span className="font-medium truncate mr-2">{option.label}</span>
                                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{option.tag}</code>
                                  </button>
                                ))}
                              </div>
                            ));
                          })()}
                          {mergeTagOptions.filter(o => o.label.toLowerCase().includes(mergeTagSearch.toLowerCase()) || o.tag.toLowerCase().includes(mergeTagSearch.toLowerCase())).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No merge tags found</p>
                          )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <RichTextEditor
                  key={`edit-desc-${descEditorKey}`}
                  content={editTemplateDescription}
                  onChange={setEditTemplateDescription}
                  placeholder="Task description..."
                  className="min-h-[120px]"
                  editorRef={editDescEditorRef}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-6 flex items-center">
                    <Label htmlFor="edit-template-taskType">Task Type *</Label>
                  </div>
                  <select name="taskType" id="edit-template-taskType" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.taskType} required>
                    <option value="onboarding">Onboarding</option>
                    <option value="recurring">Recurring</option>
                    <option value="one-time">One-Time</option>
                  </select>
                </div>
                <div>
                  <div className="h-6 flex items-center gap-1.5">
                    <Label htmlFor="edit-template-quantityMode">Quantity Mode</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="max-w-[280px] text-xs leading-relaxed z-[100]" sideOffset={5}>
                          <p className="font-semibold mb-1">Once</p>
                          <p className="mb-2">Creates a single task regardless of product quantity.</p>
                          <p className="font-semibold mb-1">Per Unit</p>
                          <p className="mb-2">Creates one task for each unit of the product (e.g. 5 units = 5 tasks).</p>
                          <p className="font-semibold mb-1">Per Unit (Named)</p>
                          <p>Same as Per Unit, but each task title includes the unit number (e.g. "Task — Unit 1 of 5").</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <select name="quantityMode" id="edit-template-quantityMode" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.quantityMode}>
                    <option value="once">Once</option>
                    <option value="per_unit">Per Unit</option>
                    <option value="per_unit_named">Per Unit (Named)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-template-departmentId">Department</Label>
                  <select name="departmentId" id="edit-template-departmentId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.departmentId || ""}>
                    <option value="">None</option>
                    {departmentsList.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-template-assignedStaffId">Assigned Staff</Label>
                  <select name="assignedStaffId" id="edit-template-assignedStaffId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.assignedStaffId || ""}>
                    <option value="">Unassigned</option>
                    {staffMembers.map((s: StaffMember) => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-template-categoryId">Task Category</Label>
                  <select name="categoryId" id="edit-template-categoryId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.categoryId || ""}>
                    <option value="">None</option>
                    {taskCategoriesList.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-template-workflowId">Task Workflow</Label>
                  <select name="workflowId" id="edit-template-workflowId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.workflowId || ""}>
                    <option value="">None (use category default)</option>
                    {teamWorkflowsList.filter((w: any) => w.isActive !== false).map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="h-6 flex items-center gap-1.5">
                    <Label htmlFor="edit-template-dueDateOffset">Due Date Offset (days)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[260px] text-xs leading-relaxed z-[100]" sideOffset={5}>
                          <p>Number of days after the client starts (onboarding) or the cycle begins (recurring) that this task is due.</p>
                          <p className="mt-1 text-muted-foreground">Example: 7 means the task is due 1 week after the start date.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input id="edit-template-dueDateOffset" name="dueDateOffset" type="number" defaultValue={editingTemplate.dueDateOffset} min="0" />
                </div>
                <div>
                  <div className="h-6 flex items-center">
                    <Label htmlFor="edit-template-estimatedHours">Est. Hours</Label>
                  </div>
                  <Input id="edit-template-estimatedHours" name="estimatedHours" type="number" step="0.25" defaultValue={editingTemplate.estimatedHours || ""} />
                </div>
                <div>
                  <div className="h-6 flex items-center">
                    <Label htmlFor="edit-template-priority">Priority</Label>
                  </div>
                  <select name="priority" id="edit-template-priority" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTemplate.priority}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsEditTemplateOpen(false); setEditingTemplate(null); }}>Cancel</Button>
                <Button type="submit" disabled={updateTemplateMutation.isPending}>
                  {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-package-buildFee">Build Fee ($)</Label>
                  <Input 
                    id="edit-package-buildFee" 
                    name="buildFee" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    defaultValue={editingPackage.buildFee || ""} 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-package-monthlyRetail">Monthly Retail Price ($)</Label>
                  <Input 
                    id="edit-package-monthlyRetail" 
                    name="monthlyRetailPrice" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    defaultValue={editingPackage.monthlyRetailPrice || ""} 
                    placeholder="0.00" 
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cost Type</Label>
                  <Select value={bundleFormType} onValueChange={setBundleFormType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recurring">Monthly (Recurring)</SelectItem>
                      <SelectItem value="one_time">One-Time</SelectItem>
                    </SelectContent>
                  </Select>
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
