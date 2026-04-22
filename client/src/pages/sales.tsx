import { useState, useMemo, useEffect, useRef } from "react";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SALES_CONFIG, ROLE_NAMES, QUOTE_STATUS } from "@shared/constants";
import { 
  DollarSign, 
  Users, 
  Plus,
  Search,
  Calendar as CalendarIcon,
  FileText,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  Banknote,
  BarChart3,
  Percent,
  Quote,
  Edit,
  Trash2,
  Eye,
  Package,
  X,
  AlertTriangle,
  ChevronDown,
  CheckCircle,
  Target,
  ChevronUp,
  Info,
  MoreHorizontal,
  Send,
  Copy,
  RefreshCw,
  CreditCard,
  PenTool
} from "lucide-react";

export default function Sales() {
  const [activeTab, setActiveTab] = useState("quotes");
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState<"pipeline" | "sales-reps" | "opportunity-status" | "opportunity-value">("pipeline");
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  
  // Quotes pagination and filters
  const [quotesPage, setQuotesPage] = useState(1);
  const [quotesPageSize, setQuotesPageSize] = useState(20);
  const [quotesStatusFilter, setQuotesStatusFilter] = useState<string>("all");
  const [quotesClientFilter, setQuotesClientFilter] = useState<string>("all");
  const [quotesCreatedByFilter, setQuotesCreatedByFilter] = useState<string>("all");
  const [quotesDateFrom, setQuotesDateFrom] = useState<string>("");
  const [quotesDateTo, setQuotesDateTo] = useState<string>("");
  const [quotesDateFromOpen, setQuotesDateFromOpen] = useState(false);
  const [quotesDateToOpen, setQuotesDateToOpen] = useState(false);
  const [quotesShowLowMarginOnly, setQuotesShowLowMarginOnly] = useState(false);
  
  // Quotes sorting
  type QuotesSortField = 'name' | 'clientName' | 'createdBy' | 'createdAt' | 'oneTimeCost' | 'monthlyCost' | 'desiredMargin' | 'status';
  const [quotesSortField, setQuotesSortField] = useState<QuotesSortField>('createdAt');
  const [quotesSortOrder, setQuotesSortOrder] = useState<SortOrder>('desc');
  
  const [sendProposalQuote, setSendProposalQuote] = useState<any>(null);
  const [sendProposalEmail, setSendProposalEmail] = useState("");
  const [sendProposalPaymentType, setSendProposalPaymentType] = useState("full");
  const [sendProposalCustomAmount, setSendProposalCustomAmount] = useState("");
  const [sendProposalBillingMode, setSendProposalBillingMode] = useState<"trial" | "immediate">("trial");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user to check for Sales Manager role
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch sales settings for dynamic minimum margin threshold
  const { data: salesSettings } = useQuery<{ minimumMarginThreshold: number }>({
    queryKey: ["/api/sales-settings"],
    refetchOnWindowFocus: false,
  });
  
  // Use dynamic minimum margin threshold from settings, fallback to 35 if not loaded
  const minimumMarginThreshold = salesSettings?.minimumMarginThreshold ?? 35;
  
  // Check if current user is a Sales Manager or Admin
  const isSalesManager = currentUser?.roles?.includes(ROLE_NAMES.SALES_MANAGER) || currentUser?.roles?.includes('Admin');
  
  // Check if user has permission to manage sales targets (via Settings > Roles & Permissions)
  const canManageTargets = () => {
    // Admins always have access (check roles array)
    if (currentUser?.roles?.includes('Admin')) {
      return true;
    }
    
    // Sales Managers can manage targets
    if (currentUser?.roles?.includes(ROLE_NAMES.SALES_MANAGER)) {
      return true;
    }
    
    // Check if user has the 'settings' module 'canManage' permission
    if (!currentUser?.permissions) {
      return false;
    }
    
    const settingsPermission = currentUser.permissions.find((p: any) => p.module === 'settings');
    return settingsPermission?.canManage === true;
  };
  

  // Quote Builder state
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({
    name: "",
    clientId: "",
    leadId: "", 
    budget: "",
    buildFee: "",
    margin: "",
    description: "",
  });
  const [selectedProducts, setSelectedProducts] = useState<Array<{productId: string, type: 'product' | 'bundle' | 'package', quantity: number, customQuantities?: Record<string, number>, customBuildFee?: string}>>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [customAgreement, setCustomAgreement] = useState<string | null>(null);
  const [isCustomAgreementOpen, setIsCustomAgreementOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [bundleProductsData, setBundleProductsData] = useState<Record<string, any[]>>({});
  const [packageItemsData, setPackageItemsData] = useState<Record<string, any>>({});
  const [viewingQuoteId, setViewingQuoteId] = useState<string | null>(null);
  const [deleteConfirmQuoteId, setDeleteConfirmQuoteId] = useState<string | null>(null);
  const [openViewItems, setOpenViewItems] = useState<Record<string, boolean>>({});

  // Targets state
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [targetFormData, setTargetFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    targetAmount: "",
  });
  const [targetTimeFilter, setTargetTimeFilter] = useState<string>("this-year");

  // Sales Rep Report sorting state
  type SalesRepSortField = 'name' | 'department' | 'appointments' | 'pitches' | 'closedDeals' | 'totalLeads' | 'closeRate' | 'avgMRR' | 'totalValue';
  type SortOrder = 'asc' | 'desc';
  const [salesRepSortField, setSalesRepSortField] = useState<SalesRepSortField>('name');
  const [salesRepSortOrder, setSalesRepSortOrder] = useState<SortOrder>('asc');

  // Fetch data for Quote Builder
  const { data: clientsData } = useQuery<{ clients: any[] }>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    refetchOnWindowFocus: false,
  });

  // Extract clients array from the response object
  const clients = clientsData?.clients || [];

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    refetchOnWindowFocus: false,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ["/api/product-bundles"],
    refetchOnWindowFocus: false,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["/api/product-packages"],
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (packages && packages.length > 0) {
      packages.forEach((pkg: any) => {
        if (!packageItemsData[pkg.id]) {
          fetchPackageDetails(pkg.id);
        }
      });
    }
  }, [packages]);

  // Fetch quotes for the quotes tab
  const { data: quotesData = [] } = useQuery({
    queryKey: ["/api/quotes"],
    refetchOnWindowFocus: false,
  });

  // Fetch full details (incl. items) for the quote currently being viewed.
  // NOTE: the default queryFn does NOT path-join queryKey segments — it only
  // appends the second element if it's an object (as URL params). So we
  // provide an explicit queryFn that hits /api/quotes/:id.
  const { data: viewingQuoteDetail, isLoading: isViewingQuoteLoading } = useQuery<any>({
    queryKey: ["/api/quotes", viewingQuoteId],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${viewingQuoteId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load quote: ${res.status}`);
      return res.json();
    },
    enabled: !!viewingQuoteId,
    refetchOnWindowFocus: false,
  });

  // When the view dialog loads a quote, prefetch any bundle/package contents
  // so we can render their nested items in the read-only accordion.
  useEffect(() => {
    if (!viewingQuoteDetail || !Array.isArray(viewingQuoteDetail.items)) return;
    viewingQuoteDetail.items.forEach((item: any) => {
      const refId = item.bundleId || item.packageId || item.productId;
      if (!refId) return;
      if (item.itemType === 'bundle') {
        fetchBundleProducts(refId);
      } else if (item.itemType === 'package') {
        fetchPackageDetails(refId);
      }
    });
  }, [viewingQuoteDetail]);

  // Fetch staff for sales rep filter
  const { data: staffData = [] } = useQuery({
    queryKey: ["/api/staff"],
    refetchOnWindowFocus: false,
  });

  // Fetch lead sources for source filter
  const { data: leadSources = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/lead-sources"],
    refetchOnWindowFocus: false,
  });

  // Fetch Pipeline Report data
  const { data: pipelineReport, isLoading: pipelineReportLoading } = useQuery({
    queryKey: ["/api/sales/reports/pipeline", dateRange.startDate, dateRange.endDate, selectedSalesRep, selectedSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedSalesRep !== "all" && { salesRepId: selectedSalesRep }),
        ...(selectedSource !== "all" && { sourceId: selectedSource })
      });
      const response = await fetch(`/api/sales/reports/pipeline?${params}`);
      if (!response.ok) throw new Error('Failed to fetch pipeline report');
      return response.json();
    },
    enabled: activeTab === "reports" && reportType === "pipeline",
    refetchOnWindowFocus: false,
  });

  // Fetch Sales Rep Report data
  const { data: salesRepReport, isLoading: salesRepReportLoading } = useQuery({
    queryKey: ["/api/sales/reports/sales-reps", dateRange.startDate, dateRange.endDate, selectedSalesRep],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedSalesRep !== "all" && { salesRepId: selectedSalesRep })
      });
      const response = await fetch(`/api/sales/reports/sales-reps?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sales rep report');
      return response.json();
    },
    enabled: activeTab === "reports" && reportType === "sales-reps",
    refetchOnWindowFocus: false,
  });

  // Fetch Opportunity Status Report data
  const { data: opportunityStatusReport, isLoading: opportunityStatusLoading } = useQuery({
    queryKey: ["/api/sales/reports/opportunity-status", dateRange.startDate, dateRange.endDate, selectedSalesRep, selectedSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedSalesRep !== "all" && { salesRepId: selectedSalesRep }),
        ...(selectedSource !== "all" && { sourceId: selectedSource })
      });
      const response = await fetch(`/api/sales/reports/opportunity-status?${params}`);
      if (!response.ok) throw new Error('Failed to fetch opportunity status report');
      return response.json();
    },
    enabled: activeTab === "reports" && reportType === "opportunity-status",
    refetchOnWindowFocus: false,
  });

  // Fetch Opportunity Value Report data
  const { data: opportunityValueReport, isLoading: opportunityValueLoading } = useQuery({
    queryKey: ["/api/sales/reports/opportunity-value", dateRange.startDate, dateRange.endDate, selectedSalesRep, selectedSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedSalesRep !== "all" && { salesRepId: selectedSalesRep }),
        ...(selectedSource !== "all" && { sourceId: selectedSource })
      });
      const response = await fetch(`/api/sales/reports/opportunity-value?${params}`);
      if (!response.ok) throw new Error('Failed to fetch opportunity value report');
      return response.json();
    },
    enabled: activeTab === "reports" && reportType === "opportunity-value",
    refetchOnWindowFocus: false,
  });

  // Fetch Sales Targets
  const { data: salesTargets = [] } = useQuery({
    queryKey: ["/api/sales-targets"],
    refetchOnWindowFocus: false,
  });

  // Create/Update Sales Target Mutation
  const createTargetMutation = useMutation({
    mutationFn: async (target: { year: number; month: number; targetAmount: string }) => {
      return await apiRequest("POST", "/api/sales-targets", target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-targets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets/revenue_this_month/data"] });
      toast({ title: "Target created successfully" });
      setIsTargetDialogOpen(false);
      setTargetFormData({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, targetAmount: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating target", description: error.message, variant: "destructive" });
    },
  });

  const updateTargetMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; year?: number; month?: number; targetAmount?: string }) => {
      return await apiRequest("PATCH", `/api/sales-targets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-targets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets/revenue_this_month/data"] });
      toast({ title: "Target updated successfully" });
      setIsTargetDialogOpen(false);
      setEditingTargetId(null);
      setTargetFormData({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, targetAmount: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating target", description: error.message, variant: "destructive" });
    },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sales-targets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-targets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets/revenue_this_month/data"] });
      toast({ title: "Target deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting target", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitTarget = () => {
    if (!targetFormData.targetAmount || parseFloat(targetFormData.targetAmount) <= 0) {
      toast({ title: "Please enter a valid target amount", variant: "destructive" });
      return;
    }

    if (editingTargetId) {
      updateTargetMutation.mutate({
        id: editingTargetId,
        ...targetFormData,
      });
    } else {
      createTargetMutation.mutate(targetFormData);
    }
  };

  const handleEditTarget = (target: any) => {
    setEditingTargetId(target.id);
    setTargetFormData({
      year: target.year,
      month: target.month,
      targetAmount: target.targetAmount,
    });
    setIsTargetDialogOpen(true);
  };

  const handleNewTarget = () => {
    setEditingTargetId(null);
    setTargetFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      targetAmount: "",
    });
    setIsTargetDialogOpen(true);
  };

  // Filter targets based on selected time period
  const getFilteredTargets = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentQuarter = Math.ceil(currentMonth / 3); // 1-4

    return salesTargets.filter((target: any) => {
      switch (targetTimeFilter) {
        case "all":
          return true;
        
        case "this-year":
          return target.year === currentYear;
        
        case "last-year":
          return target.year === currentYear - 1;
        
        case "next-year":
          return target.year === currentYear + 1;
        
        case "this-quarter":
          const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
          const quarterEndMonth = currentQuarter * 3;
          return target.year === currentYear && 
                 target.month >= quarterStartMonth && 
                 target.month <= quarterEndMonth;
        
        case "next-quarter":
          const nextQuarter = currentQuarter === 4 ? 1 : currentQuarter + 1;
          const nextQuarterYear = currentQuarter === 4 ? currentYear + 1 : currentYear;
          const nextQuarterStartMonth = (nextQuarter - 1) * 3 + 1;
          const nextQuarterEndMonth = nextQuarter * 3;
          return target.year === nextQuarterYear && 
                 target.month >= nextQuarterStartMonth && 
                 target.month <= nextQuarterEndMonth;
        
        case "this-month":
          return target.year === currentYear && target.month === currentMonth;
        
        default:
          return true;
      }
    });
  };

  // Sales Rep Report Sorting
  const handleSalesRepSort = (field: SalesRepSortField) => {
    if (salesRepSortField === field) {
      setSalesRepSortOrder(salesRepSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSalesRepSortField(field);
      setSalesRepSortOrder('asc');
    }
  };

  const sortedSalesReps = useMemo(() => {
    if (!salesRepReport?.salesReps) return [];
    
    return [...salesRepReport.salesReps].sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (salesRepSortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'appointments':
          aValue = a.metrics.appointments;
          bValue = b.metrics.appointments;
          break;
        case 'pitches':
          aValue = a.metrics.pitches;
          bValue = b.metrics.pitches;
          break;
        case 'closedDeals':
          aValue = a.metrics.closedDeals;
          bValue = b.metrics.closedDeals;
          break;
        case 'totalLeads':
          aValue = a.metrics.totalLeads;
          bValue = b.metrics.totalLeads;
          break;
        case 'closeRate':
          aValue = a.metrics.closeRate;
          bValue = b.metrics.closeRate;
          break;
        case 'avgMRR':
          aValue = a.metrics.avgMRR;
          bValue = b.metrics.avgMRR;
          break;
        case 'totalValue':
          aValue = a.metrics.totalValue;
          bValue = b.metrics.totalValue;
          break;
      }

      if (typeof aValue === 'string') {
        return salesRepSortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return salesRepSortOrder === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [salesRepReport, salesRepSortField, salesRepSortOrder]);

  // Sortable Header Component for Sales Rep Table
  const SalesRepSortableHeader = ({ field, children, align = 'left' }: { field: SalesRepSortField; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <th 
      className={`px-4 py-3 text-sm font-medium cursor-pointer hover:bg-muted transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => handleSalesRepSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-between'}`}>
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              salesRepSortField === field && salesRepSortOrder === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              salesRepSortField === field && salesRepSortOrder === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
        </div>
      </div>
    </th>
  );

  // Fetch bundle products when a bundle is selected
  const fetchBundleProducts = async (bundleId: string) => {
    if (bundleProductsData[bundleId]) {
      return bundleProductsData[bundleId]; // Return cached data
    }
    
    try {
      const response = await fetch(`/api/product-bundles/${bundleId}/products`);
      const bundleProducts = await response.json();
      setBundleProductsData(prev => ({ ...prev, [bundleId]: bundleProducts }));
      return bundleProducts;
    } catch (error) {
      console.error('Error fetching bundle products:', error);
      return [];
    }
  };

  const calculateBundleCost = (bundleId: string, customQuantities?: Record<string, number>) => {
    const bundleProducts = bundleProductsData[bundleId] || [];
    return bundleProducts.reduce((sum, bp) => {
      const cost = parseFloat(bp.productCost || '0');
      const qty = customQuantities?.[bp.productId] || 1;
      return sum + (cost * qty);
    }, 0);
  };

  const fetchPackageDetails = async (packageId: string) => {
    if (packageItemsData[packageId]) {
      return packageItemsData[packageId];
    }
    
    try {
      const response = await fetch(`/api/product-packages/${packageId}`);
      const packageDetail = await response.json();
      setPackageItemsData(prev => ({ ...prev, [packageId]: packageDetail }));
      return packageDetail;
    } catch (error) {
      console.error('Error fetching package details:', error);
      return null;
    }
  };

  const calculatePackageCost = (packageId: string, customQuantities?: Record<string, number>, customBuildFee?: string) => {
    const packageDetail = packageItemsData[packageId];
    if (!packageDetail || !packageDetail.items) return 0;
    let oneTimeCost = 0;
    let recurringCost = 0;
    packageDetail.items.forEach((item: any) => {
      const itemKey = item.id || `${item.itemType}-${item.productId || item.bundleId}`;
      const qty = customQuantities?.[itemKey] ?? (item.quantity || 1);
      if (item.itemType === 'product' && item.product) {
        const cost = parseFloat(item.product.cost || '0') * qty;
        if (item.product.type === 'recurring') {
          recurringCost += cost;
        } else {
          oneTimeCost += cost;
        }
      } else if (item.itemType === 'bundle' && item.bundle) {
        const bundleType = item.bundle.type || 'recurring';
        const bundleProds = item.bundle.products || [];
        let bundleTotalCost = 0;
        bundleProds.forEach((bp: any) => {
          const bpKey = `${itemKey}_bp_${bp.productId}`;
          const bpQty = customQuantities?.[bpKey] ?? (bp.quantity || 1);
          bundleTotalCost += parseFloat(bp.productCost || '0') * bpQty;
        });
        if (bundleType === 'one_time') {
          oneTimeCost += bundleTotalCost * qty;
        } else {
          recurringCost += bundleTotalCost * qty;
        }
      }
    });
    const buildFee = customBuildFee !== undefined ? parseFloat(customBuildFee || '0') : parseFloat(packageDetail.buildFee || '0');
    return { oneTimeCost, buildFee, recurringCost, totalCost: oneTimeCost + recurringCost };
  };

  // Quote Builder helper functions
  const calculateQuoteTotals = () => {
    const budget = parseFloat(quoteData.budget) || 0;
    const desiredMargin = parseFloat(quoteData.margin) || 0;
    
    // Calculate total cost of selected products/bundles with quantities
    let monthlyCost = 0;
    let oneTimeCost = 0;
    let buildFeeCost = 0;
    selectedProducts.forEach(item => {
      const quantity = item.quantity || 1;
      if (item.type === 'product') {
        const product = products.find(p => p.id === item.productId);
        if (product && product.cost) {
          const cost = parseFloat(product.cost) * quantity;
          if (product.type === 'recurring') {
            monthlyCost += cost;
          } else {
            oneTimeCost += cost;
          }
        }
      } else if (item.type === 'bundle') {
        const bundle = bundles.find((b: any) => b.id === item.productId);
        const bundleType = bundle?.type || 'recurring';
        const bundleCost = calculateBundleCost(item.productId, item.customQuantities);
        const bundleCostWithQty = bundleCost * quantity;
        if (bundleType === 'recurring') {
          monthlyCost += bundleCostWithQty;
        } else {
          oneTimeCost += bundleCostWithQty;
        }
      } else if (item.type === 'package') {
        const pkgCosts = calculatePackageCost(item.productId, item.customQuantities, item.customBuildFee);
        if (typeof pkgCosts === 'number') {
          monthlyCost += pkgCosts * quantity;
        } else {
          monthlyCost += pkgCosts.recurringCost * quantity;
          oneTimeCost += pkgCosts.oneTimeCost * quantity;
          buildFeeCost += pkgCosts.buildFee * quantity; // Build fee is revenue, not cost
        }
      }
    });

    const totalCost = monthlyCost;

    // Correct calculation logic:
    // revenue = budget (what client pays monthly)
    // profit = revenue - monthlyCost (recurring monthly costs only)
    // actualMargin = (profit / revenue) * 100
    // One-time costs (build fees, setup) are tracked separately
    const revenue = budget;
    const profit = revenue - monthlyCost;
    const actualMargin = revenue > 0 ? ((profit / revenue) * 100) : 0;
    
    // Target revenue based on desired margin
    const targetRevenue = monthlyCost > 0 ? (monthlyCost / (1 - desiredMargin / 100)) : budget;

    return {
      budget: revenue,
      desiredMargin,
      totalCost,
      oneTimeCost,
      buildFeeCost,
      monthlyCost,
      profit,
      actualMargin,
      targetRevenue,
      isMarginValid: actualMargin >= minimumMarginThreshold,
      isMarginAchievable: budget >= targetRevenue
    };
  };

  const addProductToQuote = (type: 'product' | 'bundle' | 'package') => {
    setSelectedProducts([...selectedProducts, { productId: "", type, quantity: 1 }]);
  };

  const removeProductFromQuote = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateQuoteProduct = async (index: number, productId: string) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], productId };
    
    if (updated[index].type === 'bundle' && productId) {
      await fetchBundleProducts(productId);
    }
    
    if (updated[index].type === 'package' && productId) {
      await fetchPackageDetails(productId);
    }
    
    setSelectedProducts(updated);
  };

  const updateQuoteQuantity = (index: number, quantity: number) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], quantity: Math.max(1, quantity) };
    setSelectedProducts(updated);
  };

  const updateBundleProductQuantity = (bundleIndex: number, productId: string, quantity: number) => {
    const updated = [...selectedProducts];
    const currentCustomQuantities = updated[bundleIndex].customQuantities || {};
    updated[bundleIndex] = {
      ...updated[bundleIndex],
      customQuantities: {
        ...currentCustomQuantities,
        [productId]: Math.max(1, quantity)
      }
    };
    setSelectedProducts(updated);
  };

  const updatePackageItemQuantity = (packageIndex: number, itemKey: string, quantity: number) => {
    const updated = [...selectedProducts];
    const currentCustomQuantities = updated[packageIndex].customQuantities || {};
    updated[packageIndex] = {
      ...updated[packageIndex],
      customQuantities: {
        ...currentCustomQuantities,
        [itemKey]: Math.max(0, quantity)
      }
    };
    setSelectedProducts(updated);
  };

  const updatePackageBuildFee = (packageIndex: number, buildFee: string) => {
    const updated = [...selectedProducts];
    updated[packageIndex] = { ...updated[packageIndex], customBuildFee: buildFee };
    setSelectedProducts(updated);
  };

  const resetQuoteBuilder = () => {
    setQuoteData({
      name: "",
      clientId: "",
      leadId: "",
      budget: "",
      buildFee: "",
      margin: "",
      description: "",
    });
    setSelectedProducts([]);
    setProductSearch("");
    setIsEditMode(false);
    setEditingQuoteId(null);
    setCustomAgreement(null);
    setIsCustomAgreementOpen(false);
  };

  const loadQuoteForEdit = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      const quote = await response.json();
      
      setQuoteData({
        name: quote.name,
        clientId: quote.clientId || "",
        leadId: quote.leadId || "",
        budget: quote.clientBudget,
        buildFee: quote.buildFee || "",
        margin: quote.desiredMargin,
        description: quote.notes || "",
      });
      
      const items = quote.items || [];
      const loadedProducts = await Promise.all(items.map(async (item: any) => {
        const productId = item.productId || item.bundleId || item.packageId;
        
        if (item.itemType === 'bundle' && productId) {
          await fetchBundleProducts(productId);
        }
        
        if (item.itemType === 'package' && productId) {
          await fetchPackageDetails(productId);
        }
        
        const rawCustom = item.customQuantities as Record<string, any> | null;
        let customQuantities: Record<string, number> | undefined;
        let customBuildFee: string | undefined;
        if (rawCustom && typeof rawCustom === 'object') {
          if ('__buildFee' in rawCustom) {
            customBuildFee = String(rawCustom.__buildFee);
            const { __buildFee, ...rest } = rawCustom;
            customQuantities = Object.keys(rest).length > 0 ? rest as Record<string, number> : undefined;
          } else {
            customQuantities = rawCustom as Record<string, number>;
          }
        }
        return {
          productId,
          type: item.itemType,
          quantity: item.quantity || 1,
          customQuantities,
          customBuildFee: item.itemType === 'package' ? customBuildFee : undefined,
        };
      }));
      
      setSelectedProducts(loadedProducts);
      setCustomAgreement(quote.customAgreement || null);
      setIsEditMode(true);
      setEditingQuoteId(quoteId);
      setIsQuoteBuilderOpen(true);
    } catch (error) {
      console.error("Error loading quote:", error);
      toast({
        title: "Error",
        description: "Failed to load quote for editing",
        variant: "destructive",
      });
    }
  };

  // Save quote mutation
  const saveQuoteMutation = useMutation({
    mutationFn: async (quotePayload: any) => {
      // Guard against missing editingQuoteId in edit mode
      if (isEditMode && !editingQuoteId) {
        throw new Error("Cannot update quote: missing quote ID");
      }
      
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `/api/quotes/${editingQuoteId}` : "/api/quotes";
      
      return await apiRequest(method, url, quotePayload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setIsQuoteBuilderOpen(false);
      resetQuoteBuilder();
      
      const isLowMargin = parseFloat(quoteData.margin) < minimumMarginThreshold;
      if (isLowMargin) {
        toast({
          title: "Quote Requires Approval",
          description: `Quote submitted with ${quoteData.margin}% desired margin. Sales Manager approval required before proceeding.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          variant: "default",
          description: "Quote saved successfully",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save quote",
        variant: "destructive",
      });
    },
  });

  // Approve quote mutation
  const approveQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return await apiRequest("PUT", `/api/quotes/${quoteId}/approval`, { action: "approve" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote Approved",
        variant: "default",
        description: "The quote has been successfully approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to approve quote.",
        variant: "destructive",
      });
    },
  });

  // Reject quote mutation
  const rejectQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return await apiRequest("PUT", `/api/quotes/${quoteId}/approval`, { action: "reject" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote Rejected",
        variant: "default",
        description: "The quote has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reject quote.",
        variant: "destructive",
      });
    },
  });

  const sendProposalMutation = useMutation({
    mutationFn: async ({ quoteId, recipientEmail, paymentAmountType, customPaymentAmount, billingMode }: { quoteId: string; recipientEmail?: string; paymentAmountType?: string; customPaymentAmount?: string; billingMode?: string }) => {
      return await apiRequest("POST", `/api/quotes/${quoteId}/send-proposal`, { recipientEmail, paymentAmountType, customPaymentAmount, billingMode });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setSendProposalQuote(null);
      setSendProposalEmail("");
      setSendProposalPaymentType("full");
      setSendProposalCustomAmount("");
      setSendProposalBillingMode("trial");
      toast({
        title: "Proposal Sent",
        variant: "default",
        description: data?.recipientEmail ? `Proposal email sent to ${data.recipientEmail}` : "Proposal has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send proposal.",
        variant: "destructive",
      });
    },
  });

  const resendProposalMutation = useMutation({
    mutationFn: async ({ quoteId, recipientEmail }: { quoteId: string; recipientEmail?: string }) => {
      return await apiRequest("POST", `/api/quotes/${quoteId}/resend-proposal`, { recipientEmail });
    },
    onSuccess: () => {
      toast({
        title: "Proposal Resent",
        variant: "default",
        description: "Proposal email has been resent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to resend proposal.",
        variant: "destructive",
      });
    },
  });

  const handleQuoteStatusChange = (quoteId: string, newStatus: string, quote: any) => {
    if (newStatus === "sent") {
      setSendProposalQuote(quote);
      setSendProposalEmail("");
      setSendProposalPaymentType("full");
      setSendProposalCustomAmount("");
      return;
    }
    updateQuoteStatusMutation.mutate({ quoteId, newStatus });
  };

  const handleCopyProposalLink = async (quoteId: string, publicToken?: string | null) => {
    try {
      let token = publicToken;
      if (!token) {
        const res = await fetch(`/api/quotes/${quoteId}/generate-token`, { method: "POST", headers: { "Content-Type": "application/json" } });
        if (!res.ok) throw new Error("Failed to generate link");
        const data = await res.json();
        token = data.publicToken;
        queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      }
      const appUrl = window.location.origin;
      const url = `${appUrl}/proposal/${token}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        variant: "default",
        description: "Proposal link copied to clipboard.",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy proposal link.", variant: "destructive" });
    }
  };

  // Update quote status mutation
  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ quoteId, newStatus }: { quoteId: string; newStatus: string }) => {
      return await apiRequest("PATCH", `/api/quotes/${quoteId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Status Updated",
        variant: "default",
        description: "Quote status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update quote status.",
        variant: "destructive",
      });
    },
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return await apiRequest("DELETE", `/api/quotes/${quoteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setDeleteConfirmQuoteId(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Quote deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete quote",
      });
    },
  });

  // Handle save quote with approval logic
  const handleSaveQuote = () => {
    const totals = calculateQuoteTotals();
    const desiredMargin = parseFloat(quoteData.margin) || 0;
    const isLowMargin = desiredMargin < minimumMarginThreshold;
    
    const quotePayload = {
      name: quoteData.name,
      clientId: quoteData.clientId || null,
      leadId: quoteData.leadId || null,
      clientBudget: quoteData.budget || '0',
      buildFee: quoteData.buildFee || '0',
      desiredMargin: quoteData.margin || '0',
      totalCost: totals.totalCost.toString(),
      oneTimeCost: (totals.oneTimeCost + (totals.buildFeeCost || 0)).toString(),
      monthlyCost: totals.monthlyCost.toString(),
      status: isLowMargin ? "pending_approval" : "draft",
      notes: quoteData.description || null,
      customAgreement: customAgreement || null,
      items: selectedProducts.map(item => {
        let unitCost = 0;
        const quantity = item.quantity || 1;
        
        if (item.type === 'product') {
          unitCost = parseFloat(products.find(p => p.id === item.productId)?.cost || '0');
        } else if (item.type === 'bundle') {
          unitCost = calculateBundleCost(item.productId, item.customQuantities);
        } else if (item.type === 'package') {
          const pkgCosts = calculatePackageCost(item.productId, item.customQuantities, item.customBuildFee);
          unitCost = typeof pkgCosts === 'number' ? pkgCosts : pkgCosts.totalCost;
        }
        
        const itemTotalCost = unitCost * quantity;
        
        return {
          productId: item.type === 'product' ? item.productId : null,
          bundleId: item.type === 'bundle' ? item.productId : null,
          packageId: item.type === 'package' ? item.productId : null,
          itemType: item.type,
          quantity: quantity,
          unitCost: unitCost.toString(),
          totalCost: itemTotalCost.toString(),
          customQuantities: (() => {
            if (item.type === 'bundle' && item.customQuantities) return item.customQuantities;
            if (item.type === 'package') {
              const pkgCustom: Record<string, any> = { ...(item.customQuantities || {}) };
              if (item.customBuildFee !== undefined) pkgCustom.__buildFee = item.customBuildFee;
              return Object.keys(pkgCustom).length > 0 ? pkgCustom : undefined;
            }
            return undefined;
          })(),
        };
      }),
    };

    // Always save the quote, regardless of margin status
    saveQuoteMutation.mutate(quotePayload);
  };

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredBundles = bundles.filter((bundle: any) =>
    bundle.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (bundle.description && bundle.description.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredPackages = packages.filter((pkg: any) =>
    pkg.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (pkg.description && pkg.description.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Helper function for quote status badge styling
  const getQuoteStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800";
      case "signed":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };


  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-muted-foreground">
              Manage quotes and sales reports
            </p>
          </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 mt-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "quotes", name: "Quotes", icon: Quote },
            { id: "reports", name: "Sales Reports", icon: BarChart3 },
            { id: "targets", name: "Targets", icon: Target }
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
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sales Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Report Controls */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Reports
                </CardTitle>
                
                {/* Date Range and Sales Rep Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="start-date" className="text-sm whitespace-nowrap">Start Date:</Label>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-40 pl-3 text-left font-normal",
                            !dateRange.startDate && "text-muted-foreground"
                          )}
                          data-testid="input-start-date"
                        >
                          {dateRange.startDate ? (
                            format(parseISO(dateRange.startDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.startDate ? parseISO(dateRange.startDate) : undefined}
                          onSelect={(date) => {
                            setDateRange(prev => ({ ...prev, startDate: date ? format(date, "yyyy-MM-dd") : "" }));
                            setStartDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-date" className="text-sm whitespace-nowrap">End Date:</Label>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-40 pl-3 text-left font-normal",
                            !dateRange.endDate && "text-muted-foreground"
                          )}
                          data-testid="input-end-date"
                        >
                          {dateRange.endDate ? (
                            format(parseISO(dateRange.endDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.endDate ? parseISO(dateRange.endDate) : undefined}
                          onSelect={(date) => {
                            setDateRange(prev => ({ ...prev, endDate: date ? format(date, "yyyy-MM-dd") : "" }));
                            setEndDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sales-rep-filter" className="text-sm whitespace-nowrap">Sales Rep:</Label>
                    <Select
                      value={selectedSalesRep}
                      onValueChange={setSelectedSalesRep}
                    >
                      <SelectTrigger id="sales-rep-filter" className="w-48" data-testid="select-sales-rep-filter">
                        <SelectValue placeholder="All Sales Reps" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sales Reps</SelectItem>
                        {staffData.map((staff: any) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName} {staff.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="source-filter" className="text-sm whitespace-nowrap">Source:</Label>
                    <Select
                      value={selectedSource}
                      onValueChange={setSelectedSource}
                    >
                      <SelectTrigger id="source-filter" className="w-48" data-testid="select-source-filter">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {leadSources.map((source: any) => (
                          <SelectItem key={source.id} value={source.name}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Report Type Tabs */}
            <CardContent>
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setReportType("pipeline")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      reportType === "pipeline"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    data-testid="button-pipeline-report"
                  >
                    Pipeline Report
                  </button>
                  <button
                    onClick={() => setReportType("sales-reps")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      reportType === "sales-reps"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    data-testid="button-sales-rep-report"
                  >
                    Sales Rep Report
                  </button>
                  <button
                    onClick={() => setReportType("opportunity-status")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      reportType === "opportunity-status"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    data-testid="button-opportunity-status-report"
                  >
                    Opportunity Status
                  </button>
                  <button
                    onClick={() => setReportType("opportunity-value")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      reportType === "opportunity-value"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    data-testid="button-opportunity-value-report"
                  >
                    Opportunity Value
                  </button>
                </nav>
              </div>

              {/* Pipeline Report Content */}
              {reportType === "pipeline" && (
                <div className="space-y-6">
                  {pipelineReportLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading pipeline data...</div>
                  ) : pipelineReport ? (
                    <>
                      {/* Total Value Header */}
                      <div className="mb-6">
                        <div className="text-4xl font-bold" data-testid="text-total-value">
                          ${((pipelineReport.summary?.totalValue || 0) / 1000).toFixed(2)}K
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {pipelineReport.summary?.totalLeads || 0} leads in pipeline
                          </span>
                        </div>
                      </div>

                      {/* Pipeline Funnel Visualization */}
                      {pipelineReport.stages?.length > 0 ? (
                        <div className="space-y-0">
                          {/* Dynamic Scale Header */}
                          {(() => {
                            const stages = pipelineReport.stages;
                            const maxLeads = Math.max(...stages.map((s: any) => s.leadCount || 0), 1);
                            // Calculate nice round numbers for the scale
                            const magnitude = Math.pow(10, Math.floor(Math.log10(maxLeads)));
                            const niceMax = Math.ceil(maxLeads / magnitude) * magnitude;
                            const tickCount = 6;
                            const tickInterval = niceMax / tickCount;
                            const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(i * tickInterval));
                            
                            return (
                              <div className="flex items-end mb-2">
                                <div className="flex-1 pr-4">
                                  <div className="flex justify-between text-xs text-muted-foreground border-b pb-1">
                                    {ticks.map((tick, i) => (
                                      <span key={i} className="text-center" style={{ width: `${100 / tickCount}%` }}>
                                        {tick >= 1000 ? `${(tick / 1000).toFixed(0)}K` : tick.toLocaleString()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="w-24 text-center text-xs font-semibold text-muted-foreground cursor-help flex items-center justify-center gap-1">
                                        Cumulative <Info className="h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p>Percentage of leads from the first stage that have made it to this stage. Shows overall funnel retention.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="w-24 text-center text-xs font-semibold text-muted-foreground cursor-help flex items-center justify-center gap-1">
                                        Next Step<br/>Conversion <Info className="h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p>Percentage of leads in this stage that successfully move to the next stage. Shows stage-by-stage conversion rate.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            );
                          })()}
                          
                          {/* Stage Bars */}
                          {(() => {
                            const stages = pipelineReport.stages;
                            const maxLeads = Math.max(...stages.map((s: any) => s.leadCount || 0), 1);
                            const magnitude = Math.pow(10, Math.floor(Math.log10(maxLeads)));
                            const maxValue = Math.ceil(maxLeads / magnitude) * magnitude;
                            const firstStageLeads = stages[0]?.leadCount || 1;
                            
                            return stages.map((stage: any, index: number) => {
                              const barWidth = Math.max((stage.leadCount / maxValue) * 100, 5);
                              const cumulativePercent = ((stage.leadCount / firstStageLeads) * 100).toFixed(2);
                              const nextStage = stages[index + 1];
                              const conversionPercent = nextStage 
                                ? ((nextStage.leadCount / (stage.leadCount || 1)) * 100).toFixed(2)
                                : "100.00";
                              const formattedValue = stage.totalValue >= 1000 
                                ? `$${(stage.totalValue / 1000).toFixed(2)}K` 
                                : `$${stage.totalValue?.toLocaleString() || 0}`;
                              
                              return (
                                <div key={stage.id} className="flex items-center py-1 group">
                                  {/* Bar Container */}
                                  <div className="flex-1 pr-4">
                                    <div 
                                      className="relative h-10 rounded-sm flex items-center px-3 transition-all group-hover:opacity-90"
                                      style={{ 
                                        width: `${barWidth}%`,
                                        backgroundColor: stage.color || '#3b82f6',
                                        minWidth: '120px'
                                      }}
                                      data-testid={`bar-stage-${stage.id}`}
                                    >
                                      <span className="text-white text-sm font-medium truncate">
                                        {stage.name}
                                      </span>
                                      <span className="text-white text-sm font-medium ml-2">
                                        {formattedValue}
                                      </span>
                                      {/* Tooltip on hover */}
                                      <div className="absolute left-full ml-2 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                                        <div className="font-medium">{stage.name} - {formattedValue}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                                          {stage.leadCount} leads
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Cumulative % */}
                                  <div className="w-24 text-center">
                                    <span className="text-sm font-medium" data-testid={`text-cumulative-${stage.id}`}>
                                      {cumulativePercent}%
                                    </span>
                                  </div>
                                  
                                  {/* Next Step Conversion % */}
                                  <div className="w-24 text-center">
                                    <span className="text-sm font-medium" data-testid={`text-conversion-${stage.id}`}>
                                      {conversionPercent}%
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No pipeline data available for the selected date range
                        </div>
                      )}

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Leads</div>
                          <div className="text-xl font-bold" data-testid="text-total-leads">
                            {pipelineReport.summary?.totalLeads || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Value</div>
                          <div className="text-xl font-bold">
                            ${pipelineReport.summary?.totalValue?.toLocaleString() || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Transitions</div>
                          <div className="text-xl font-bold" data-testid="text-total-transitions">
                            {pipelineReport.summary?.totalTransitions || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Avg Value</div>
                          <div className="text-xl font-bold" data-testid="text-average-value">
                            ${pipelineReport.summary?.averageValue?.toFixed(0) || 0}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data available</div>
                  )}
                </div>
              )}

              {/* Sales Rep Report Content */}
              {reportType === "sales-reps" && (
                <div className="space-y-6">
                  {salesRepReportLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading sales rep data...</div>
                  ) : salesRepReport ? (
                    <>
                      {/* Team Summary */}
                      {salesRepReport.totals && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Total Appointments</div>
                              <div className="text-2xl font-bold">{salesRepReport.totals.appointments}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Total Pitches</div>
                              <div className="text-2xl font-bold">{salesRepReport.totals.pitches}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Closed Deals</div>
                              <div className="text-2xl font-bold">{salesRepReport.totals.closedDeals}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Total Leads</div>
                              <div className="text-2xl font-bold">{salesRepReport.totals.totalLeads}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Avg Close Rate</div>
                              <div className="text-2xl font-bold">{salesRepReport.totals.avgCloseRate?.toFixed(1)}%</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Total Revenue</div>
                              <div className="text-2xl font-bold">${salesRepReport.totals.totalValue?.toLocaleString()}</div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Sales Rep Performance Table */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Sales Rep Performance</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <SalesRepSortableHeader field="name">Rep Name</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="department">Department</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="appointments" align="right">Appointments</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="pitches" align="right">Pitches</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="closedDeals" align="right">Closed</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="totalLeads" align="right">Total Leads</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="closeRate" align="right">Close Rate</SalesRepSortableHeader>
                                <SalesRepSortableHeader field="avgMRR" align="right">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="flex items-center gap-1 cursor-help">
                                          Avg MRR <Info className="h-3 w-3" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>Average Monthly Recurring Revenue per closed deal</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </SalesRepSortableHeader>
                                <SalesRepSortableHeader field="totalValue" align="right">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="flex items-center gap-1 cursor-help">
                                          Total Value <Info className="h-3 w-3" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>Annual Recurring Revenue (MRR × 12 months)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </SalesRepSortableHeader>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {sortedSalesReps && sortedSalesReps.length > 0 ? (
                                sortedSalesReps.map((rep: any) => (
                                  <tr key={rep.id} className="hover:bg-muted/50" data-testid={`row-sales-rep-${rep.id}`}>
                                    <td className="px-4 py-3 text-sm font-medium">{rep.name}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{rep.department || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-right">{rep.metrics.appointments}</td>
                                    <td className="px-4 py-3 text-sm text-right">{rep.metrics.pitches}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold">{rep.metrics.closedDeals}</td>
                                    <td className="px-4 py-3 text-sm text-right">{rep.metrics.totalLeads}</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      <span className={rep.metrics.closeRate > 30 ? 'text-green-600 font-medium' : ''}>
                                        {rep.metrics.closeRate.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">${rep.metrics.avgMRR.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold">
                                      ${rep.metrics.totalValue.toLocaleString()}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                    No sales rep data available for the selected date range
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data available</div>
                  )}
                </div>
              )}

              {/* Opportunity Status Report Content */}
              {reportType === "opportunity-status" && (
                <div className="space-y-6">
                  {opportunityStatusLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading opportunity status data...</div>
                  ) : opportunityStatusReport ? (
                    <>
                      {/* Total Count Header */}
                      <div className="mb-6">
                        <div className="text-4xl font-bold" data-testid="text-opportunity-total">
                          {opportunityStatusReport.total >= 1000 
                            ? `${(opportunityStatusReport.total / 1000).toFixed(2)}K`
                            : opportunityStatusReport.total.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                            opportunityStatusReport.percentChange >= 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {opportunityStatusReport.percentChange >= 0 ? '↑' : '↓'} {Math.abs(opportunityStatusReport.percentChange).toFixed(2)}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            vs Previous Period
                          </span>
                        </div>
                      </div>

                      {/* Donut Chart and Legend */}
                      <div className="flex items-center justify-center gap-12">
                        <div className="relative">
                          <ResponsiveContainer width={250} height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Open', value: opportunityStatusReport.breakdown.open, fill: '#3B82F6' },
                                  { name: 'Won', value: opportunityStatusReport.breakdown.won, fill: '#06B6D4' },
                                  { name: 'Lost', value: opportunityStatusReport.breakdown.lost, fill: '#8B5CF6' }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                              >
                              </Pie>
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-popover border rounded-md shadow-md px-3 py-2">
                                        <p className="text-sm font-medium">{payload[0].name}: {payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Center text */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold">
                              {opportunityStatusReport.total >= 1000 
                                ? `${(opportunityStatusReport.total / 1000).toFixed(2)}K`
                                : opportunityStatusReport.total.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#3B82F6' }}></div>
                            <span className="text-sm">Open - {opportunityStatusReport.breakdown.open.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#06B6D4' }}></div>
                            <span className="text-sm">Won - {opportunityStatusReport.breakdown.won.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#8B5CF6' }}></div>
                            <span className="text-sm">Lost - {opportunityStatusReport.breakdown.lost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data available</div>
                  )}
                </div>
              )}

              {/* Opportunity Value Report Content */}
              {reportType === "opportunity-value" && (
                <div className="space-y-6">
                  {opportunityValueLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading opportunity value data...</div>
                  ) : opportunityValueReport ? (
                    <>
                      {/* Total Revenue Header */}
                      <div className="mb-6">
                        <div className="text-4xl font-bold" data-testid="text-opportunity-value">
                          ${opportunityValueReport.totalRevenue >= 1000000 
                            ? `${(opportunityValueReport.totalRevenue / 1000000).toFixed(2)}M`
                            : opportunityValueReport.totalRevenue >= 1000
                            ? `${(opportunityValueReport.totalRevenue / 1000).toFixed(2)}K`
                            : opportunityValueReport.totalRevenue.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                            opportunityValueReport.percentChange >= 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {opportunityValueReport.percentChange >= 0 ? '↑' : '↓'} {Math.abs(opportunityValueReport.percentChange).toFixed(2)}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            vs Previous Period
                          </span>
                        </div>
                      </div>

                      {/* Horizontal Bar Chart */}
                      <div className="space-y-4">
                        {(() => {
                          const maxValue = Math.max(
                            opportunityValueReport.breakdown.open,
                            opportunityValueReport.breakdown.won,
                            opportunityValueReport.breakdown.lost,
                            1
                          );
                          const formatValue = (val: number) => {
                            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                            if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
                            return `$${val.toLocaleString()}`;
                          };
                          
                          return (
                            <>
                              {/* Lost */}
                              <div className="flex items-center gap-4">
                                <div className="w-12 text-sm text-right text-muted-foreground">Lost</div>
                                <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                                  <div 
                                    className="h-full rounded transition-all duration-500"
                                    style={{ 
                                      width: `${(opportunityValueReport.breakdown.lost / maxValue) * 100}%`,
                                      backgroundColor: '#8B5CF6',
                                      minWidth: opportunityValueReport.breakdown.lost > 0 ? '8px' : '0'
                                    }}
                                  />
                                </div>
                                <div className="w-20 text-sm text-right">{formatValue(opportunityValueReport.breakdown.lost)}</div>
                              </div>
                              {/* Won */}
                              <div className="flex items-center gap-4">
                                <div className="w-12 text-sm text-right text-muted-foreground">Won</div>
                                <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                                  <div 
                                    className="h-full rounded transition-all duration-500"
                                    style={{ 
                                      width: `${(opportunityValueReport.breakdown.won / maxValue) * 100}%`,
                                      backgroundColor: '#06B6D4',
                                      minWidth: opportunityValueReport.breakdown.won > 0 ? '8px' : '0'
                                    }}
                                  />
                                </div>
                                <div className="w-20 text-sm text-right">{formatValue(opportunityValueReport.breakdown.won)}</div>
                              </div>
                              {/* Open */}
                              <div className="flex items-center gap-4">
                                <div className="w-12 text-sm text-right text-muted-foreground">Open</div>
                                <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                                  <div 
                                    className="h-full rounded transition-all duration-500"
                                    style={{ 
                                      width: `${(opportunityValueReport.breakdown.open / maxValue) * 100}%`,
                                      backgroundColor: '#3B82F6',
                                      minWidth: opportunityValueReport.breakdown.open > 0 ? '8px' : '0'
                                    }}
                                  />
                                </div>
                                <div className="w-20 text-sm text-right">{formatValue(opportunityValueReport.breakdown.open)}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Total Revenue Summary */}
                      <div className="pt-4 border-t mt-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Total revenue</div>
                          <div className="text-2xl font-bold">
                            ${opportunityValueReport.totalRevenue >= 1000000 
                              ? `${(opportunityValueReport.totalRevenue / 1000000).toFixed(2)}M`
                              : opportunityValueReport.totalRevenue >= 1000
                              ? `${(opportunityValueReport.totalRevenue / 1000).toFixed(2)}K`
                              : opportunityValueReport.totalRevenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data available</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Quotes Tab */}
      {activeTab === "quotes" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5" />
                  Quote Management
                </CardTitle>
                <Dialog open={isQuoteBuilderOpen} onOpenChange={(open) => {
                  setIsQuoteBuilderOpen(open);
                  if (!open) resetQuoteBuilder();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-quote">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Quote</DialogTitle>
                      <DialogDescription>
                        Build a customized quote with client budget, desired margin, and product packages
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Quote Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quote-name">Quote Name</Label>
                          <Input
                            id="quote-name"
                            placeholder="Enter quote name..."
                            value={quoteData.name}
                            onChange={(e) => setQuoteData(prev => ({ ...prev, name: e.target.value }))}
                            data-testid="input-quote-name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="quote-client">Client/Lead</Label>
                          <Select value={quoteData.clientId ? `client:${quoteData.clientId}` : quoteData.leadId ? `lead:${quoteData.leadId}` : ""} onValueChange={(value) => {
                            if (value.startsWith('client:')) {
                              const clientId = value.replace('client:', '');
                              setQuoteData(prev => ({ ...prev, clientId, leadId: "" }));
                            } else if (value.startsWith('lead:')) {
                              const leadId = value.replace('lead:', '');
                              setQuoteData(prev => ({ ...prev, leadId, clientId: "" }));
                            }
                          }}>
                            <SelectTrigger data-testid="select-quote-client">
                              <SelectValue placeholder="Select client or lead" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clients-header" disabled>--- CLIENTS ---</SelectItem>
                              {clients.map((client: any) => (
                                <SelectItem key={client.id} value={`client:${client.id}`}>
                                  {client.company || client.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="leads-header" disabled>--- LEADS ---</SelectItem>
                              {leads.map((lead: any) => (
                                <SelectItem key={lead.id} value={`lead:${lead.id}`}>
                                  {lead.name} - {lead.company || 'No Company'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Budget, Build Fee, and Margin */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quote-budget">Client Budget ($)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>What is their MONTHLY budget?</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="quote-budget"
                              type="number"
                              placeholder="0.00"
                              value={quoteData.budget}
                              onChange={(e) => setQuoteData(prev => ({ ...prev, budget: e.target.value }))}
                              className="pl-10"
                              data-testid="input-quote-budget"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quote-build-fee">Build Fee ($)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>One-time setup/build fee the client pays upfront</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="quote-build-fee"
                              type="number"
                              placeholder="0.00"
                              value={quoteData.buildFee}
                              onChange={(e) => setQuoteData(prev => ({ ...prev, buildFee: e.target.value }))}
                              className="pl-10"
                              data-testid="input-quote-build-fee"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quote-margin">Desired Margin (%)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>The MINIMUM margin is {minimumMarginThreshold}% by default. If you go BELOW that margin, it will require manager approval.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="quote-margin"
                              type="number"
                              placeholder={`${minimumMarginThreshold}.00`}
                              value={quoteData.margin}
                              onChange={(e) => setQuoteData(prev => ({ ...prev, margin: e.target.value }))}
                              className={`pl-10 ${parseFloat(quoteData.margin) < minimumMarginThreshold ? 'border-red-300 focus:border-red-500' : ''}`}
                              data-testid="input-quote-margin"
                            />
                          </div>
                          {parseFloat(quoteData.margin) < minimumMarginThreshold && quoteData.margin && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Margin below {minimumMarginThreshold}% requires Sales Manager approval</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="quote-description">Description (Optional)</Label>
                        <Textarea
                          id="quote-description"
                          placeholder="Add any additional notes or description for this quote..."
                          value={quoteData.description}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, description: e.target.value }))}
                          data-testid="input-quote-description"
                        />
                      </div>

                      {/* Quote Summary - Moved Above Search */}
                      {(quoteData.budget || selectedProducts.length > 0) && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-semibold">Quote Summary</h3>
                          {(() => {
                            const totals = calculateQuoteTotals();
                            return (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Client Budget (Monthly):</span>
                                    <p className="font-medium" data-testid="quote-summary-budget">
                                      ${totals.budget.toLocaleString()}
                                    </p>
                                    {(parseFloat(quoteData.buildFee) > 0 || totals.buildFeeCost > 0) && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        + ${(parseFloat(quoteData.buildFee) || totals.buildFeeCost).toLocaleString()} build fee
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Monthly Cost:</span>
                                    <p className="font-medium" data-testid="quote-summary-cost">
                                      ${totals.monthlyCost.toLocaleString()}
                                    </p>
                                    {totals.oneTimeCost > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        + ${totals.oneTimeCost.toLocaleString()} one-time cost
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Monthly Profit:</span>
                                    <p className={`font-medium ${totals.profit < 0 ? 'text-red-600' : 'text-green-600'}`} data-testid="quote-summary-profit">
                                      ${totals.profit.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Monthly Margin:</span>
                                    <p className={`font-medium ${totals.actualMargin < minimumMarginThreshold ? 'text-red-600' : 'text-green-600'}`} data-testid="quote-summary-margin">
                                      {totals.actualMargin.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Margin Analysis */}
                                {selectedProducts.length > 0 && totals.totalCost > 0 && (
                                  <div className="mt-4 p-3 border rounded-lg">
                                    <h4 className="text-sm font-medium mb-2">Margin Analysis</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Desired Margin:</span>
                                        <span className="ml-2 font-medium">{totals.desiredMargin}%</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Needed Revenue:</span>
                                        <span className="ml-2 font-medium">${totals.targetRevenue.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    
                                    {!totals.isMarginValid && (
                                      <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>
                                          Current margin ({totals.actualMargin.toFixed(1)}%) is below {minimumMarginThreshold}% minimum
                                        </span>
                                      </div>
                                    )}
                                    
                                    {!totals.isMarginAchievable && totals.desiredMargin > 0 && (
                                      <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>
                                          Budget too low for {totals.desiredMargin}% margin. Need ${totals.targetRevenue.toLocaleString()} revenue.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Product/Bundle Selection */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Products, Bundles & Packages</Label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => addProductToQuote('product')} data-testid="button-add-product">
                              <Package className="w-4 h-4 mr-2" />
                              Add Product
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => addProductToQuote('bundle')} data-testid="button-add-bundle">
                              <Package className="w-4 h-4 mr-2" />
                              Add Bundle
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => addProductToQuote('package')} data-testid="button-add-package">
                              <Package className="w-4 h-4 mr-2" />
                              Add Package
                            </Button>
                          </div>
                        </div>
                        
                        {/* Product Search */}
                        {selectedProducts.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="product-search">Search Products, Bundles & Packages</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                id="product-search"
                                placeholder="Search products, bundles, and packages..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="pl-10"
                                data-testid="input-product-search"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Selected Products/Bundles */}
                        <div className="space-y-3">
                          {selectedProducts.map((item, index) => (
                            <div key={index} className="border rounded-lg" data-testid={`product-item-${index}`}>
                              <div className="flex gap-2 items-end p-3">
                                <div className="flex-1">
                                  <Label>{item.type === 'product' ? 'Product' : item.type === 'bundle' ? 'Bundle' : 'Package'}</Label>
                                  <Select
                                    value={item.productId}
                                    onValueChange={(value) => updateQuoteProduct(index, value)}
                                  >
                                    <SelectTrigger data-testid={`select-${item.type}-${index}`}>
                                      <SelectValue placeholder={`Select ${item.type}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.type === 'product' ? (
                                        filteredProducts.map((product: any) => (
                                          <SelectItem key={product.id} value={product.id}>
                                            {product.name} - ${product.cost || '0.00'} cost
                                          </SelectItem>
                                        ))
                                      ) : item.type === 'bundle' ? (
                                        filteredBundles.map((bundle: any) => {
                                          const bundleCost = calculateBundleCost(bundle.id, item.customQuantities);
                                          return (
                                            <SelectItem key={bundle.id} value={bundle.id}>
                                              {bundle.name} - ${bundleCost.toFixed(2)} cost
                                            </SelectItem>
                                          );
                                        })
                                      ) : (
                                        filteredPackages.map((pkg: any) => {
                                          const pkgCosts = calculatePackageCost(pkg.id);
                                          const displayCost = typeof pkgCosts === 'number' ? pkgCosts : pkgCosts.totalCost;
                                          return (
                                            <SelectItem key={pkg.id} value={pkg.id}>
                                              {pkg.name} - ${displayCost.toFixed(2)} cost
                                            </SelectItem>
                                          );
                                        })
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {item.type === 'product' && item.productId && (() => {
                                  const selectedProduct = products.find((p: any) => p.id === item.productId);
                                  return selectedProduct?.salesTooltip ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-4 w-4 text-amber-500 shrink-0 cursor-help mt-6" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                          <p className="text-sm">{selectedProduct.salesTooltip}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : null;
                                })()}
                                <div className="w-24">
                                  <Label>Quantity</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => updateQuoteQuantity(index, parseInt(e.target.value) || 1)}
                                    data-testid={`input-quantity-${index}`}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeProductFromQuote(index)}
                                  data-testid={`button-remove-${item.type}-${index}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {/* Bundle Products - Collapsible Section */}
                              {item.type === 'bundle' && item.productId && bundleProductsData[item.productId] && (
                                <Collapsible className="border-t">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm hover:bg-muted/50 transition-colors" data-testid={`button-toggle-bundle-products-${index}`}>
                                    <span className="font-medium">Edit Bundle Products ({bundleProductsData[item.productId].length} items)</span>
                                    <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="p-3 space-y-2 bg-muted/20">
                                    {bundleProductsData[item.productId].map((bundleProduct: any) => {
                                      const customQty = item.customQuantities?.[bundleProduct.productId] || 1;
                                      return (
                                        <div key={bundleProduct.productId} className="flex items-center gap-2 p-2 bg-background rounded border">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-1">
                                              <p className="text-sm font-medium">{bundleProduct.productName}</p>
                                              {bundleProduct.productSalesTooltip && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                      <p className="text-sm">{bundleProduct.productSalesTooltip}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">${bundleProduct.productCost || '0.00'} each</p>
                                          </div>
                                          <div className="w-20">
                                            <Input
                                              type="number"
                                              min="1"
                                              value={customQty}
                                              onChange={(e) => updateBundleProductQuantity(index, bundleProduct.productId, parseInt(e.target.value) || 1)}
                                              className="text-sm"
                                              data-testid={`input-bundle-product-quantity-${index}-${bundleProduct.productId}`}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                              
                              {/* Package Items - Collapsible Section */}
                              {item.type === 'package' && item.productId && packageItemsData[item.productId] && packageItemsData[item.productId].items && (
                                <Collapsible className="border-t">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm hover:bg-muted/50 transition-colors" data-testid={`button-toggle-package-items-${index}`}>
                                    <span className="font-medium">Edit Package Items ({packageItemsData[item.productId].items.length} items)</span>
                                    <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="p-3 space-y-3 bg-muted/20">
                                    <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">Build Fee</p>
                                        <p className="text-xs text-muted-foreground">One-time setup cost</p>
                                      </div>
                                      <div className="w-28">
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={item.customBuildFee !== undefined ? item.customBuildFee : (packageItemsData[item.productId].buildFee || '0')}
                                          onChange={(e) => updatePackageBuildFee(index, e.target.value)}
                                          className="text-sm"
                                          data-testid={`input-package-build-fee-${index}`}
                                        />
                                      </div>
                                    </div>
                                    {packageItemsData[item.productId].items.map((pkgItem: any, pkgIdx: number) => {
                                      const itemName = pkgItem.itemType === 'product' 
                                        ? (pkgItem.product?.name || 'Unknown Product')
                                        : (pkgItem.bundle?.name || 'Unknown Bundle');
                                      const itemKey = pkgItem.id || `${pkgItem.itemType}-${pkgItem.productId || pkgItem.bundleId}`;
                                      const itemQty = item.customQuantities?.[itemKey] ?? (pkgItem.quantity || 1);
                                      
                                      if (pkgItem.itemType === 'bundle' && pkgItem.bundle) {
                                        const bundleProds = pkgItem.bundle.products || [];
                                        const bundleCost = bundleProds.reduce((sum: number, bp: any) => {
                                          const bpKey = `${itemKey}_bp_${bp.productId}`;
                                          const bpQty = item.customQuantities?.[bpKey] ?? (bp.quantity || 1);
                                          return sum + parseFloat(bp.productCost || '0') * bpQty;
                                        }, 0);
                                        return (
                                          <div key={pkgIdx} className="p-2 bg-background rounded border">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex-1">
                                                <p className="text-sm font-medium">{itemName}</p>
                                                <p className="text-xs text-muted-foreground">Bundle</p>
                                              </div>
                                              <div className="w-20 mr-2">
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  value={itemQty}
                                                  onChange={(e) => updatePackageItemQuantity(index, itemKey, parseInt(e.target.value) || 1)}
                                                  className="text-sm"
                                                  data-testid={`input-package-item-qty-${index}-${pkgIdx}`}
                                                />
                                              </div>
                                              <p className="text-sm font-medium text-primary w-24 text-right">${(bundleCost * itemQty).toFixed(2)}</p>
                                            </div>
                                            {bundleProds.length > 0 && (
                                              <div className="ml-4 space-y-1.5 border-l-2 border-muted pl-3">
                                                {bundleProds.map((bp: any, bpIdx: number) => {
                                                  const bpKey = `${itemKey}_bp_${bp.productId}`;
                                                  const bpQty = item.customQuantities?.[bpKey] ?? (bp.quantity || 1);
                                                  const bpCost = parseFloat(bp.productCost || '0') * bpQty;
                                                  return (
                                                    <div key={bp.id || bp.productId} className="flex items-center justify-between text-xs text-muted-foreground">
                                                      <span className="flex-1 flex items-center gap-1">
                                                        {bp.productName} {bp.productType === 'recurring' ? '(recurring)' : ''}
                                                        {bp.productSalesTooltip && (
                                                          <TooltipProvider>
                                                            <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                <Info className="h-3 w-3 text-amber-500 shrink-0 cursor-help" />
                                                              </TooltipTrigger>
                                                              <TooltipContent side="top" className="max-w-xs">
                                                                <p className="text-sm">{bp.productSalesTooltip}</p>
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          </TooltipProvider>
                                                        )}
                                                      </span>
                                                      <div className="w-16 mx-2">
                                                        <Input
                                                          type="number"
                                                          min="0"
                                                          value={bpQty}
                                                          onChange={(e) => { const v = parseInt(e.target.value); updatePackageItemQuantity(index, bpKey, isNaN(v) ? 0 : v); }}
                                                          className="h-6 text-xs px-1"
                                                          data-testid={`input-package-bp-qty-${index}-${pkgIdx}-${bpIdx}`}
                                                        />
                                                      </div>
                                                      <span className="w-16 text-right">${bpCost.toFixed(2)}</span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      
                                      const productCost = parseFloat(pkgItem.product?.cost || '0');
                                      return (
                                        <div key={pkgIdx} className="flex items-center justify-between p-2 bg-background rounded border">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-1">
                                              <p className="text-sm font-medium">{itemName}</p>
                                              {pkgItem.product?.salesTooltip && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                      <p className="text-sm">{pkgItem.product.salesTooltip}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Product {pkgItem.product?.type === 'recurring' ? '(recurring)' : ''}
                                            </p>
                                          </div>
                                          <div className="w-20 mr-2">
                                            <Input
                                              type="number"
                                              min="0"
                                              value={itemQty}
                                              onChange={(e) => { const v = parseInt(e.target.value); updatePackageItemQuantity(index, itemKey, isNaN(v) ? 0 : v); }}
                                              className="text-sm"
                                              data-testid={`input-package-item-qty-${index}-${pkgIdx}`}
                                            />
                                          </div>
                                          <p className="text-sm font-medium text-primary w-24 text-right">${(productCost * itemQty).toFixed(2)}</p>
                                        </div>
                                      );
                                    })}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {isCustomAgreementOpen && (
                        <div className="border rounded-lg p-4 space-y-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-amber-600" />
                              <span className="font-medium text-sm text-amber-800 dark:text-amber-200">Custom Service Agreement</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                              onClick={() => {
                                setCustomAgreement(null);
                                setIsCustomAgreementOpen(false);
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove & Use Default
                            </Button>
                          </div>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            This custom agreement will be used instead of the default Terms & Conditions for this quote's online signup.
                          </p>
                          <div className="bg-white dark:bg-gray-900 rounded border">
                            <RichTextEditor
                              content={customAgreement || ""}
                              onChange={(html) => setCustomAgreement(html)}
                              placeholder="Paste or type the custom agreement content here..."
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-between">
                        <div>
                          {!isCustomAgreementOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30"
                              onClick={async () => {
                                if (!customAgreement) {
                                  try {
                                    const termsRes = await fetch("/api/proposal-terms");
                                    const termsData = await termsRes.json();
                                    const activeTerms = Array.isArray(termsData)
                                      ? termsData.find((t: any) => t.isActive) || termsData[0]
                                      : termsData;
                                    if (activeTerms?.content) {
                                      setCustomAgreement(activeTerms.content);
                                    }
                                  } catch (e) {
                                    console.error("Failed to load default terms:", e);
                                  }
                                }
                                setIsCustomAgreementOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {customAgreement ? "Edit Custom Agreement" : "Use Custom Agreement"}
                            </Button>
                          )}
                          {customAgreement && !isCustomAgreementOpen && (
                            <Badge variant="outline" className="ml-2 text-amber-700 border-amber-300 bg-amber-50">
                              Custom Agreement Set
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => {
                            setIsQuoteBuilderOpen(false);
                            resetQuoteBuilder();
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleSaveQuote}
                            disabled={!quoteData.name || (!quoteData.clientId && !quoteData.leadId) || !quoteData.budget || saveQuoteMutation.isPending}
                            data-testid="button-save-quote"
                          >
                            {saveQuoteMutation.isPending ? "Saving..." : (isEditMode ? "Update Quote" : "Save Quote")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search quotes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-quotes"
                    />
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end p-4 bg-muted/30 rounded-lg border">
                  {/* Status Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={quotesStatusFilter}
                      onValueChange={(value) => {
                        setQuotesStatusFilter(value);
                        setQuotesPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9" data-testid="select-filter-status">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client/Lead Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Client/Lead</Label>
                    <Select
                      value={quotesClientFilter}
                      onValueChange={(value) => {
                        setQuotesClientFilter(value);
                        setQuotesPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9" data-testid="select-filter-client">
                        <SelectValue placeholder="All Clients/Leads" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients/Leads</SelectItem>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company || client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Created By Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Created By</Label>
                    <Select
                      value={quotesCreatedByFilter}
                      onValueChange={(value) => {
                        setQuotesCreatedByFilter(value);
                        setQuotesPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9" data-testid="select-filter-created-by">
                        <SelectValue placeholder="All Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staffData.map((staff: any) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName} {staff.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From Date</Label>
                    <Popover open={quotesDateFromOpen} onOpenChange={setQuotesDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] h-9 pl-3 text-left font-normal",
                            !quotesDateFrom && "text-muted-foreground"
                          )}
                          data-testid="input-filter-date-from"
                        >
                          {quotesDateFrom ? (
                            format(parseISO(quotesDateFrom), "MMM d, yyyy")
                          ) : (
                            <span>mm/dd/yyyy</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={quotesDateFrom ? parseISO(quotesDateFrom) : undefined}
                          onSelect={(date) => {
                            setQuotesDateFrom(date ? format(date, "yyyy-MM-dd") : "");
                            setQuotesPage(1);
                            setQuotesDateFromOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To Date</Label>
                    <Popover open={quotesDateToOpen} onOpenChange={setQuotesDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] h-9 pl-3 text-left font-normal",
                            !quotesDateTo && "text-muted-foreground"
                          )}
                          data-testid="input-filter-date-to"
                        >
                          {quotesDateTo ? (
                            format(parseISO(quotesDateTo), "MMM d, yyyy")
                          ) : (
                            <span>mm/dd/yyyy</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={quotesDateTo ? parseISO(quotesDateTo) : undefined}
                          onSelect={(date) => {
                            setQuotesDateTo(date ? format(date, "yyyy-MM-dd") : "");
                            setQuotesPage(1);
                            setQuotesDateToOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Low Margin Filter */}
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2 cursor-pointer h-9">
                      <input
                        type="checkbox"
                        checked={quotesShowLowMarginOnly}
                        onChange={(e) => {
                          setQuotesShowLowMarginOnly(e.target.checked);
                          setQuotesPage(1);
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                        data-testid="checkbox-filter-low-margin"
                      />
                      <span className="text-sm">Low Margin (&lt;{minimumMarginThreshold}%)</span>
                    </label>
                  </div>
                </div>

                {/* Quotes List */}
                <div className="space-y-4">
                  {(() => {
                    // Apply all filters
                    let filteredQuotes = quotesData.filter((quote: any) => {
                      // Search filter
                      const matchesSearch = !searchTerm || 
                        quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quote.clientName || quote.leadName || '').toLowerCase().includes(searchTerm.toLowerCase());
                      
                      // Status filter
                      const matchesStatus = quotesStatusFilter === "all" || quote.status === quotesStatusFilter;
                      
                      // Client filter
                      const matchesClient = quotesClientFilter === "all" || quote.clientId === quotesClientFilter;
                      
                      // Created by filter
                      const matchesCreatedBy = quotesCreatedByFilter === "all" || quote.createdBy === quotesCreatedByFilter;
                      
                      // Date range filter
                      const quoteDate = new Date(quote.createdAt);
                      const matchesDateFrom = !quotesDateFrom || quoteDate >= new Date(quotesDateFrom);
                      const matchesDateTo = !quotesDateTo || quoteDate <= new Date(quotesDateTo + 'T23:59:59');
                      
                      // Low margin filter
                      const matchesMargin = !quotesShowLowMarginOnly || parseFloat(quote.desiredMargin || 100) < minimumMarginThreshold;
                      
                      return matchesSearch && matchesStatus && matchesClient && matchesCreatedBy && 
                             matchesDateFrom && matchesDateTo && matchesMargin;
                    });

                    // Apply sorting
                    const sortedQuotes = [...filteredQuotes].sort((a, b) => {
                      let aVal: any;
                      let bVal: any;
                      
                      switch (quotesSortField) {
                        case 'name':
                          aVal = a.name || '';
                          bVal = b.name || '';
                          break;
                        case 'clientName':
                          aVal = (a.clientName || a.leadName || '').toLowerCase();
                          bVal = (b.clientName || b.leadName || '').toLowerCase();
                          break;
                        case 'createdBy':
                          aVal = `${a.createdByName || ''} ${a.createdByLastName || ''}`.trim().toLowerCase();
                          bVal = `${b.createdByName || ''} ${b.createdByLastName || ''}`.trim().toLowerCase();
                          break;
                        case 'createdAt':
                          aVal = new Date(a.createdAt);
                          bVal = new Date(b.createdAt);
                          break;
                        case 'oneTimeCost':
                          aVal = parseFloat(a.oneTimeCost || 0);
                          bVal = parseFloat(b.oneTimeCost || 0);
                          break;
                        case 'monthlyCost':
                          aVal = parseFloat(a.monthlyCost || a.totalCost || 0);
                          bVal = parseFloat(b.monthlyCost || b.totalCost || 0);
                          break;
                        case 'desiredMargin':
                          aVal = parseFloat(a.desiredMargin || 0);
                          bVal = parseFloat(b.desiredMargin || 0);
                          break;
                        case 'status':
                          // Define status order for sorting
                          const statusOrder = ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected'];
                          aVal = statusOrder.indexOf(a.status);
                          bVal = statusOrder.indexOf(b.status);
                          break;
                        default:
                          return 0;
                      }
                      
                      if (aVal < bVal) return quotesSortOrder === 'asc' ? -1 : 1;
                      if (aVal > bVal) return quotesSortOrder === 'asc' ? 1 : -1;
                      return 0;
                    });

                    // Calculate pagination
                    const totalQuotes = sortedQuotes.length;
                    const totalPages = Math.ceil(totalQuotes / quotesPageSize);
                    const startIndex = (quotesPage - 1) * quotesPageSize;
                    const endIndex = startIndex + quotesPageSize;
                    const paginatedQuotes = sortedQuotes.slice(startIndex, endIndex);

                    // Ensure current page is valid
                    if (quotesPage > totalPages && totalPages > 0) {
                      setQuotesPage(1);
                    }

                    const handleQuoteSort = (field: QuotesSortField) => {
                      if (quotesSortField === field) {
                        setQuotesSortOrder(quotesSortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setQuotesSortField(field);
                        setQuotesSortOrder('asc');
                      }
                    };

                    const SortableQuoteHeader = ({ field, children }: { field: QuotesSortField; children: React.ReactNode }) => {
                      const isActive = quotesSortField === field;
                      return (
                        <TableHead 
                          className="cursor-pointer hover:bg-slate-50 select-none"
                          onClick={() => handleQuoteSort(field)}
                        >
                          <div className="flex items-center gap-1">
                            {children}
                            <div className="flex flex-col ml-1">
                              <ChevronUp 
                                className={`h-3 w-3 ${
                                  isActive && quotesSortOrder === 'asc' 
                                    ? 'text-primary' 
                                    : 'text-gray-400'
                                }`} 
                              />
                              <ChevronDown 
                                className={`h-3 w-3 -mt-1 ${
                                  isActive && quotesSortOrder === 'desc' 
                                    ? 'text-primary' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            </div>
                          </div>
                        </TableHead>
                      );
                    };

                    if (sortedQuotes.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          {searchTerm || quotesStatusFilter !== "all" || quotesClientFilter !== "all" || quotesCreatedByFilter !== "all" || quotesDateFrom || quotesDateTo || quotesShowLowMarginOnly
                            ? 'No quotes found matching your filters.' 
                            : 'No quotes found. Create your first quote to get started.'}
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortableQuoteHeader field="name">Quote Name</SortableQuoteHeader>
                                <SortableQuoteHeader field="clientName">Client/Lead</SortableQuoteHeader>
                                <SortableQuoteHeader field="createdBy">Created By</SortableQuoteHeader>
                                <SortableQuoteHeader field="createdAt">Created</SortableQuoteHeader>
                                <SortableQuoteHeader field="oneTimeCost">One-Time Cost</SortableQuoteHeader>
                                <SortableQuoteHeader field="monthlyCost">Monthly Cost</SortableQuoteHeader>
                                <SortableQuoteHeader field="desiredMargin">Margin %</SortableQuoteHeader>
                                <SortableQuoteHeader field="status">Status</SortableQuoteHeader>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedQuotes.map((quote: any) => {
                                const isLowMargin = parseFloat(quote.desiredMargin || 100) < minimumMarginThreshold;
                                return (
                                  <TableRow 
                                    key={quote.id} 
                                    className={`hover:bg-slate-50 ${isLowMargin ? 'bg-red-50/50 border-l-4 border-l-red-400' : ''}`}
                                    data-testid={`row-quote-${quote.id}`}
                                  >
                                    {/* Quote Name */}
                                    <TableCell className="font-medium" data-testid={`text-quote-name-${quote.id}`}>
                                      {quote.name}
                                    </TableCell>
                                    
                                    {/* Client/Lead */}
                                    <TableCell data-testid={`text-quote-client-${quote.id}`}>
                                      {quote.clientName || quote.leadName || 'Unknown'}
                                    </TableCell>
                                    
                                    {/* Created By */}
                                    <TableCell data-testid={`text-quote-created-${quote.id}`}>
                                      {quote.createdByName} {quote.createdByLastName}
                                    </TableCell>
                                    
                                    {/* Created Date */}
                                    <TableCell>
                                      {new Date(quote.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    
                                    {/* One-Time Cost */}
                                    <TableCell className="font-medium" data-testid={`text-quote-onetime-cost-${quote.id}`}>
                                      ${parseFloat(quote.oneTimeCost || 0).toLocaleString()}
                                    </TableCell>
                                    
                                    {/* Monthly Cost */}
                                    <TableCell className="font-medium" data-testid={`text-quote-monthly-cost-${quote.id}`}>
                                      ${parseFloat(quote.monthlyCost || quote.totalCost || 0).toLocaleString()}
                                    </TableCell>
                                    
                                    {/* Margin % */}
                                    <TableCell data-testid={`text-quote-margin-${quote.id}`}>
                                      <span className={isLowMargin ? 'text-red-600 font-semibold' : 'text-green-600 font-medium'}>
                                        {parseFloat(quote.desiredMargin || 0)}%
                                      </span>
                                    </TableCell>
                                    
                                    {/* Status */}
                                    <TableCell>
                                      {quote.status !== 'rejected' ? (
                                        <Select
                                          value={quote.status}
                                          onValueChange={(newStatus) => handleQuoteStatusChange(quote.id, newStatus, quote)}
                                          disabled={updateQuoteStatusMutation.isPending || sendProposalMutation.isPending}
                                        >
                                          <SelectTrigger className="w-[140px] h-8" data-testid={`select-quote-status-${quote.id}`}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {/* Only show valid status transitions */}
                                            {quote.status === 'draft' && (
                                              <>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="sent">Sent</SelectItem>
                                              </>
                                            )}
                                            {quote.status === 'pending_approval' && (
                                              <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                            )}
                                            {quote.status === 'approved' && (
                                              <>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="sent">Sent</SelectItem>
                                              </>
                                            )}
                                            {quote.status === 'sent' && (
                                              <>
                                                <SelectItem value="sent">Sent</SelectItem>
                                                <SelectItem value="accepted">Accepted</SelectItem>
                                              </>
                                            )}
                                            {quote.status === 'signed' && (
                                              <SelectItem value="signed">Signed</SelectItem>
                                            )}
                                            {quote.status === 'completed' && (
                                              <SelectItem value="completed">Completed</SelectItem>
                                            )}
                                            {quote.status === 'accepted' && (
                                              <SelectItem value="accepted">Accepted</SelectItem>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Badge className="bg-red-100 text-red-800" data-testid={`text-quote-status-${quote.id}`}>
                                          REJECTED
                                        </Badge>
                                      )}
                                    </TableCell>
                                    
                                    {/* Actions */}
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        {/* Show approve/reject buttons for quotes pending approval - only for Sales Managers */}
                                        {quote.status === 'pending_approval' && isSalesManager && (
                                          <>
                                            <Button 
                                              variant="default"
                                              size="sm" 
                                              className="bg-primary hover:bg-primary/90 h-8 px-2"
                                              data-testid={`button-approve-quote-${quote.id}`}
                                              onClick={() => approveQuoteMutation.mutate(quote.id)}
                                              disabled={approveQuoteMutation.isPending}
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              variant="destructive" 
                                              size="sm" 
                                              className="h-8 px-2"
                                              data-testid={`button-reject-quote-${quote.id}`}
                                              onClick={() => rejectQuoteMutation.mutate(quote.id)}
                                              disabled={rejectQuoteMutation.isPending}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              className="h-8 px-2"
                                              data-testid={`button-view-quote-${quote.id}`}
                                              onClick={() => setViewingQuoteId(quote.id)}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View Quote</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              className="h-8 px-2"
                                              data-testid={`button-edit-quote-${quote.id}`}
                                              onClick={() => loadQuoteForEdit(quote.id)}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Edit Quote</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        {quote.publicToken && (
                                          <div className="flex items-center gap-1 mr-1">
                                            {quote.signedAt && (
                                              <Tooltip>
                                                <TooltipTrigger>
                                                  <Badge className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5">
                                                    <PenTool className="h-3 w-3 mr-0.5" />
                                                    Signed
                                                  </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>Signed by {quote.signedByName}</TooltipContent>
                                              </Tooltip>
                                            )}
                                            {quote.paymentStatus === 'paid' && (
                                              <Badge className="bg-teal-100 text-teal-800 text-xs px-1.5 py-0.5">
                                                <CreditCard className="h-3 w-3 mr-0.5" />
                                                Paid
                                              </Badge>
                                            )}
                                            {quote.paymentStatus === 'processing' && (
                                              <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">
                                                <Clock className="h-3 w-3 mr-0.5" />
                                                ACH Processing
                                              </Badge>
                                            )}
                                            {quote.paymentStatus === 'pending' && (
                                              <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                                                <Clock className="h-3 w-3 mr-0.5" />
                                                Payment Pending
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {!quote.publicToken && quote.status !== 'rejected' && (
                                              <DropdownMenuItem
                                                onClick={() => handleQuoteStatusChange(quote.id, 'sent', quote)}
                                              >
                                                <Send className="mr-2 h-4 w-4" />
                                                Send as Proposal
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              onClick={() => handleCopyProposalLink(quote.id, quote.publicToken)}
                                            >
                                              <Copy className="mr-2 h-4 w-4" />
                                              Copy Proposal Link
                                            </DropdownMenuItem>
                                            {quote.publicToken && (
                                              <DropdownMenuItem
                                                onClick={() => resendProposalMutation.mutate({ quoteId: quote.id })}
                                                disabled={resendProposalMutation.isPending}
                                              >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Resend Email
                                              </DropdownMenuItem>
                                            )}
                                            {quote.leadId && (quote.paymentStatus === 'paid' || quote.paymentStatus === 'processing') && !quote.clientId && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  apiRequest('POST', `/api/quotes/${quote.id}/retry-fulfillment`).then(async (res) => {
                                                    const data = await res.json();
                                                    queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
                                                    queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                                                    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                                                    toast({
                                                      title: "Success",
                                                      description: data.message || "Fulfillment triggered",
                                                    });
                                                  }).catch(() => {
                                                    toast({
                                                      title: "Error",
                                                      description: "Failed to retry fulfillment",
                                                      variant: "destructive",
                                                    });
                                                  });
                                                }}
                                              >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Retry Lead Conversion
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              onClick={() => setDeleteConfirmQuoteId(quote.id)}
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                              data-testid={`button-delete-quote-${quote.id}`}
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete Quote
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between border-t pt-4 mt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Rows per page:</span>
                            <Select
                              value={quotesPageSize.toString()}
                              onValueChange={(value) => {
                                setQuotesPageSize(Number(value));
                                setQuotesPage(1);
                              }}
                            >
                              <SelectTrigger className="w-[70px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">
                              {startIndex + 1}-{Math.min(endIndex, totalQuotes)} of {totalQuotes}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuotesPage(1)}
                              disabled={quotesPage === 1}
                            >
                              First
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuotesPage(Math.max(1, quotesPage - 1))}
                              disabled={quotesPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                              Page {quotesPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuotesPage(Math.min(totalPages, quotesPage + 1))}
                              disabled={quotesPage >= totalPages}
                            >
                              Next
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuotesPage(totalPages)}
                              disabled={quotesPage >= totalPages}
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Quote Dialog */}
      <Dialog open={viewingQuoteId !== null} onOpenChange={(open) => !open && setViewingQuoteId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          {viewingQuoteId && (() => {
            const listQuote = (quotesData as any[] | undefined)?.find((q: any) => q.id === viewingQuoteId);
            // Merge the list row (header fields like createdByName) with the
            // detailed quote (items, customQuantities, etc) once it loads.
            const quote: any = { ...(listQuote || {}), ...(viewingQuoteDetail || {}) };
            if (!quote || !quote.id) return null;

            const safeStatus = typeof quote.status === 'string' ? quote.status : '';
            const statusLabel = safeStatus ? safeStatus.replace('_', ' ').toUpperCase() : 'UNKNOWN';
            const safeFloat = (v: any) => {
              const n = parseFloat(v);
              return isNaN(n) ? 0 : n;
            };
            const createdAtDate = quote.createdAt ? new Date(quote.createdAt) : null;
            const createdAtLabel = createdAtDate && !isNaN(createdAtDate.getTime())
              ? createdAtDate.toLocaleDateString()
              : '—';

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Quote Name</Label>
                    <p className="font-medium" data-testid="text-view-quote-name">{quote.name || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div>
                      <Badge className={getQuoteStatusBadge(safeStatus)} data-testid="text-view-quote-status">
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Client/Lead</Label>
                    <p className="font-medium" data-testid="text-view-quote-client">{quote.clientName || quote.leadName || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Budget</Label>
                    <p className="font-medium" data-testid="text-view-quote-budget">${safeFloat(quote.clientBudget).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Desired Margin</Label>
                    <p className={`font-medium ${safeFloat(quote.desiredMargin) < minimumMarginThreshold ? 'text-red-600' : 'text-green-600'}`} data-testid="text-view-quote-margin">
                      {safeFloat(quote.desiredMargin)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">One-Time Cost</Label>
                    <p className="font-medium" data-testid="text-view-quote-onetime-cost">${safeFloat(quote.oneTimeCost).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Monthly Cost</Label>
                    <p className="font-medium" data-testid="text-view-quote-monthly-cost">${safeFloat(quote.monthlyCost || quote.totalCost).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created By</Label>
                    <p className="font-medium" data-testid="text-view-quote-creator">
                      {(quote.createdByName || quote.createdByLastName)
                        ? `${quote.createdByName || ''} ${quote.createdByLastName || ''}`.trim()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created At</Label>
                    <p className="font-medium" data-testid="text-view-quote-created-at">{createdAtLabel}</p>
                  </div>
                </div>
                
                {quote.notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm" data-testid="text-view-quote-notes">{quote.notes}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Quote Items</Label>
                  <div className="border rounded-md divide-y">
                    {isViewingQuoteLoading && !viewingQuoteDetail ? (
                      <p className="p-3 text-sm text-muted-foreground">Loading items…</p>
                    ) : quote.items && quote.items.length > 0 ? (
                      quote.items.map((item: any, index: number) => {
                        const refId = item.bundleId || item.packageId || item.productId;
                        const itemKey = `${item.id || refId || 'item'}-${index}`;
                        const itemTypeLabel = item.itemType === 'product' ? 'Product' : item.itemType === 'bundle' ? 'Bundle' : 'Package';
                        const itemName = item.productName || item.bundleName || item.packageName || 'Unknown';
                        const totalCost = parseFloat(item.totalCost || 0);
                        const isOpen = !!openViewItems[itemKey];
                        const bundleProds = item.itemType === 'bundle' && refId ? bundleProductsData[refId] : null;
                        const packageInfo = item.itemType === 'package' && refId ? packageItemsData[refId] : null;
                        const hasNested = (item.itemType === 'bundle' && bundleProds && bundleProds.length > 0)
                          || (item.itemType === 'package' && packageInfo && Array.isArray(packageInfo.items));

                        const customQuantities = (item.customQuantities && typeof item.customQuantities === 'object')
                          ? item.customQuantities as Record<string, any>
                          : {};

                        const header = (
                          <div className="flex items-center justify-between w-full p-3" data-testid={`div-quote-item-${index}`}>
                            <div className="flex items-center gap-2 text-left">
                              {hasNested && (
                                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              )}
                              <div>
                                <p className="font-medium">{itemName}</p>
                                <p className="text-sm text-muted-foreground">{itemTypeLabel}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${totalCost.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        );

                        if (!hasNested) {
                          return <div key={itemKey}>{header}</div>;
                        }

                        return (
                          <Collapsible
                            key={itemKey}
                            open={isOpen}
                            onOpenChange={(open) => setOpenViewItems(prev => ({ ...prev, [itemKey]: open }))}
                          >
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="w-full text-left hover:bg-muted/50 transition-colors"
                                data-testid={`button-toggle-view-item-${index}`}
                              >
                                {header}
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-3 pb-3 bg-muted/20 space-y-2">
                              {item.itemType === 'bundle' && bundleProds && bundleProds.map((bp: any) => {
                                const qty = customQuantities[bp.productId] || bp.quantity || 1;
                                return (
                                  <div key={bp.productId} className="flex items-center justify-between p-2 bg-background rounded border">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{bp.productName}</p>
                                      <p className="text-xs text-muted-foreground">${bp.productCost || '0.00'} each</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground w-20 text-right">Qty: {qty}</p>
                                  </div>
                                );
                              })}

                              {item.itemType === 'package' && packageInfo && (
                                <>
                                  {(packageInfo.buildFee !== undefined || customQuantities.__buildFee !== undefined) && (
                                    <div className="flex items-center justify-between p-2 bg-background rounded border">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">Build Fee</p>
                                        <p className="text-xs text-muted-foreground">One-time setup cost</p>
                                      </div>
                                      <p className="text-sm font-medium w-28 text-right">
                                        ${parseFloat(String(customQuantities.__buildFee ?? packageInfo.buildFee ?? 0)).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  {Array.isArray(packageInfo.items) && packageInfo.items.map((pkgItem: any, pkgIdx: number) => {
                                    const pkgItemName = pkgItem.itemType === 'product'
                                      ? (pkgItem.product?.name || 'Unknown Product')
                                      : (pkgItem.bundle?.name || 'Unknown Bundle');
                                    const pkgItemKey = pkgItem.id || `${pkgItem.itemType}-${pkgItem.productId || pkgItem.bundleId}`;
                                    const pkgQty = customQuantities[pkgItemKey] ?? (pkgItem.quantity || 1);
                                    const pkgItemTypeLabel = pkgItem.itemType === 'product' ? 'Product' : 'Bundle';
                                    return (
                                      <div key={pkgIdx} className="p-2 bg-background rounded border">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">{pkgItemName}</p>
                                            <p className="text-xs text-muted-foreground">{pkgItemTypeLabel}</p>
                                          </div>
                                          <p className="text-sm text-muted-foreground w-20 text-right">Qty: {pkgQty}</p>
                                        </div>
                                        {pkgItem.itemType === 'bundle' && pkgItem.bundle?.products?.length > 0 && (
                                          <div className="mt-2 ml-3 pl-3 border-l space-y-1">
                                            {pkgItem.bundle.products.map((bp: any) => {
                                              const bpKey = `${pkgItemKey}_bp_${bp.productId}`;
                                              const bpQty = customQuantities[bpKey] ?? (bp.quantity || 1);
                                              return (
                                                <div key={bp.productId} className="flex items-center justify-between text-xs">
                                                  <span>{bp.productName}</span>
                                                  <span className="text-muted-foreground">Qty: {bpQty}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })
                    ) : (
                      <p className="p-3 text-sm text-muted-foreground">No items</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Targets Tab */}
      {activeTab === "targets" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Monthly Sales Targets
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={targetTimeFilter} onValueChange={setTargetTimeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-target-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="next-quarter">Next Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                      <SelectItem value="next-year">Next Year</SelectItem>
                    </SelectContent>
                  </Select>
                  {canManageTargets() && (
                    <Button 
                      onClick={handleNewTarget}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-create-target"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Set Target
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredTargets().length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sales targets found</p>
                    <p className="text-sm">
                      {salesTargets.length === 0 
                        ? "Set monthly targets to track your revenue progress"
                        : "Try adjusting the time filter to see more targets"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {getFilteredTargets().map((target: any) => {
                      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      const monthName = monthNames[target.month - 1];
                      const isCurrentMonth = new Date().getMonth() + 1 === target.month && new Date().getFullYear() === target.year;
                      
                      return (
                        <Card key={target.id} className={isCurrentMonth ? "border-primary" : ""} data-testid={`card-target-${target.id}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-semibold" data-testid={`text-month-${target.id}`}>
                                    {monthName} {target.year}
                                  </h4>
                                  {isCurrentMonth && (
                                    <Badge variant="default" className="bg-primary">Current Month</Badge>
                                  )}
                                </div>
                                <p className="text-2xl font-bold text-primary" data-testid={`text-amount-${target.id}`}>
                                  ${parseFloat(target.targetAmount).toLocaleString()}
                                </p>
                              </div>
                              {canManageTargets() && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditTarget(target)}
                                    data-testid={`button-edit-target-${target.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteTargetMutation.mutate(target.id)}
                                    data-testid={`button-delete-target-${target.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Target Dialog */}
      <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTargetId ? "Edit" : "Create"} Sales Target</DialogTitle>
            <DialogDescription>
              Set a monthly revenue target to track your sales performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-year">Year</Label>
                <Select
                  value={targetFormData.year.toString()}
                  onValueChange={(value) => setTargetFormData(prev => ({ ...prev, year: parseInt(value) }))}
                >
                  <SelectTrigger id="target-year" data-testid="select-target-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={year.toString()} data-testid={`option-year-${year}`}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-month">Month</Label>
                <Select
                  value={targetFormData.month.toString()}
                  onValueChange={(value) => setTargetFormData(prev => ({ ...prev, month: parseInt(value) }))}
                >
                  <SelectTrigger id="target-month" data-testid="select-target-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()} data-testid={`option-month-${idx + 1}`}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-amount">Target Amount ($)</Label>
              <Input
                id="target-amount"
                type="number"
                placeholder="Enter target amount..."
                value={targetFormData.targetAmount}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                data-testid="input-target-amount"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsTargetDialogOpen(false)} data-testid="button-cancel-target">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTarget}
                disabled={createTargetMutation.isPending || updateTargetMutation.isPending}
                data-testid="button-save-target"
              >
                {(createTargetMutation.isPending || updateTargetMutation.isPending) ? "Saving..." : editingTargetId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Proposal Dialog */}
      <Dialog open={sendProposalQuote !== null} onOpenChange={(open) => !open && setSendProposalQuote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send as Proposal</DialogTitle>
            <DialogDescription>
              Send this quote to the client as a proposal with a signing and payment link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quote</Label>
              <p className="text-sm font-medium mt-1">{sendProposalQuote?.name}</p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Build Fee (one-time)</span>
                <span className="font-medium">${parseFloat(sendProposalQuote?.oneTimeCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Fee (recurring)</span>
                <span className="font-medium">${parseFloat(sendProposalQuote?.clientBudget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Due Today</span>
                <span className="font-bold text-primary">
                  ${(
                    parseFloat(sendProposalQuote?.oneTimeCost || 0) +
                    (sendProposalBillingMode === "immediate" ? parseFloat(sendProposalQuote?.clientBudget || 0) : 0)
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="Leave empty to use lead/client email"
                value={sendProposalEmail}
                onChange={(e) => setSendProposalEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If left empty, the system will use the lead or client email on file.
              </p>
            </div>

            {parseFloat(sendProposalQuote?.clientBudget || 0) > 0 && (
              <div>
                <Label>Billing Mode</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSendProposalBillingMode("trial")}
                    className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                      sendProposalBillingMode === "trial"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="font-medium">30-Day Trial</div>
                    <p className="text-xs text-muted-foreground mt-0.5">Monthly billing starts 30 days after build fee payment</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendProposalBillingMode("immediate")}
                    className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                      sendProposalBillingMode === "immediate"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="font-medium">Immediate</div>
                    <p className="text-xs text-muted-foreground mt-0.5">First month charged with build fee upfront</p>
                  </button>
                </div>
              </div>
            )}

            <div>
              <Label>Payment Amount</Label>
              <Select value={sendProposalPaymentType} onValueChange={setSendProposalPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Amount</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sendProposalPaymentType === "custom" && (
              <div>
                <Label htmlFor="custom-amount">Custom Payment Amount ($)</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={sendProposalCustomAmount}
                  onChange={(e) => setSendProposalCustomAmount(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSendProposalQuote(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (sendProposalQuote) {
                    sendProposalMutation.mutate({
                      quoteId: sendProposalQuote.id,
                      recipientEmail: sendProposalEmail || undefined,
                      paymentAmountType: sendProposalPaymentType,
                      customPaymentAmount: sendProposalPaymentType === "custom" ? sendProposalCustomAmount : undefined,
                      billingMode: sendProposalBillingMode,
                    });
                  }
                }}
                disabled={sendProposalMutation.isPending}
              >
                {sendProposalMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Proposal
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmQuoteId !== null} onOpenChange={(open) => !open && setDeleteConfirmQuoteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this quote? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmQuoteId(null)}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteConfirmQuoteId && deleteQuoteMutation.mutate(deleteConfirmQuoteId)}
                disabled={deleteQuoteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteQuoteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
