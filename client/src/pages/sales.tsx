import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SALES_CONFIG, ROLE_NAMES, QUOTE_STATUS } from "@shared/constants";
import { 
  DollarSign, 
  Users, 
  Plus,
  Search,
  Calendar,
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
  CheckCircle
} from "lucide-react";

export default function Sales() {
  const [activeTab, setActiveTab] = useState("quotes");
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState<"pipeline" | "sales-reps">("pipeline");
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user to check for Sales Manager role
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
  });
  
  // Check if current user is a Sales Manager or Admin
  const isSalesManager = currentUser?.roles?.includes(ROLE_NAMES.SALES_MANAGER) || currentUser?.roles?.includes('Admin');
  

  // Quote Builder state
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({
    name: "",
    clientId: "",
    leadId: "", 
    budget: "",
    margin: "",
    description: "",
  });
  const [selectedProducts, setSelectedProducts] = useState<Array<{productId: string, type: 'product' | 'bundle', quantity: number, customQuantities?: Record<string, number>}>>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [bundleProductsData, setBundleProductsData] = useState<Record<string, any[]>>({});
  const [viewingQuoteId, setViewingQuoteId] = useState<string | null>(null);
  const [deleteConfirmQuoteId, setDeleteConfirmQuoteId] = useState<string | null>(null);


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

  // Fetch quotes for the quotes tab
  const { data: quotesData = [] } = useQuery({
    queryKey: ["/api/quotes"],
    refetchOnWindowFocus: false,
  });

  // Fetch staff for sales rep filter
  const { data: staffData = [] } = useQuery({
    queryKey: ["/api/staff"],
    refetchOnWindowFocus: false,
  });

  // Fetch Pipeline Report data
  const { data: pipelineReport, isLoading: pipelineReportLoading } = useQuery({
    queryKey: ["/api/sales/reports/pipeline", dateRange.startDate, dateRange.endDate, selectedSalesRep],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedSalesRep !== "all" && { salesRepId: selectedSalesRep })
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

  // Calculate bundle cost based on constituent products and custom quantities
  const calculateBundleCost = (bundleId: string, customQuantities?: Record<string, number>) => {
    const bundleProducts = bundleProductsData[bundleId] || [];
    return bundleProducts.reduce((sum, bp) => {
      const cost = parseFloat(bp.productCost || '0');
      const qty = customQuantities?.[bp.productId] || 1; // Default to 1 if no custom quantity
      return sum + (cost * qty);
    }, 0);
  };

  // Quote Builder helper functions
  const calculateQuoteTotals = () => {
    const budget = parseFloat(quoteData.budget) || 0;
    const desiredMargin = parseFloat(quoteData.margin) || 0;
    
    // Calculate total cost of selected products/bundles with quantities
    let totalCost = 0;
    selectedProducts.forEach(item => {
      const quantity = item.quantity || 1;
      if (item.type === 'product') {
        const product = products.find(p => p.id === item.productId);
        if (product && product.cost) {
          totalCost += parseFloat(product.cost) * quantity;
        }
      } else if (item.type === 'bundle') {
        // Calculate bundle cost from constituent products
        const bundleCost = calculateBundleCost(item.productId, item.customQuantities);
        totalCost += bundleCost * quantity;
      }
    });

    // Correct calculation logic:
    // revenue = budget (what client pays)
    // profit = revenue - totalCost
    // actualMargin = (profit / revenue) * 100
    const revenue = budget;
    const profit = revenue - totalCost;
    const actualMargin = revenue > 0 ? ((profit / revenue) * 100) : 0;
    
    // Target revenue based on desired margin
    const targetRevenue = totalCost > 0 ? (totalCost / (1 - desiredMargin / 100)) : budget;

    return {
      budget: revenue,
      desiredMargin,
      totalCost,
      profit,
      actualMargin,
      targetRevenue,
      isMarginValid: actualMargin >= SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD,
      isMarginAchievable: budget >= targetRevenue
    };
  };

  const addProductToQuote = (type: 'product' | 'bundle') => {
    setSelectedProducts([...selectedProducts, { productId: "", type, quantity: 1 }]);
  };

  const removeProductFromQuote = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateQuoteProduct = async (index: number, productId: string) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], productId };
    
    // If it's a bundle, fetch bundle products
    if (updated[index].type === 'bundle' && productId) {
      await fetchBundleProducts(productId);
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

  const resetQuoteBuilder = () => {
    setQuoteData({
      name: "",
      clientId: "",
      leadId: "",
      budget: "",
      margin: "",
      description: "",
    });
    setSelectedProducts([]);
    setProductSearch("");
    setIsEditMode(false);
    setEditingQuoteId(null);
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
        margin: quote.desiredMargin,
        description: quote.notes || "",
      });
      
      // Load quote items
      const items = quote.items || [];
      const loadedProducts = await Promise.all(items.map(async (item: any) => {
        const productId = item.productId || item.bundleId;
        
        // If it's a bundle, fetch bundle products
        if (item.itemType === 'bundle' && productId) {
          await fetchBundleProducts(productId);
        }
        
        return {
          productId,
          type: item.itemType,
          quantity: item.quantity || 1,
          customQuantities: item.customQuantities || undefined,
        };
      }));
      
      setSelectedProducts(loadedProducts);
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
      
      const isLowMargin = parseFloat(quoteData.margin) < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD;
      if (isLowMargin) {
        toast({
          title: "Quote Requires Approval",
          description: `Quote submitted with ${quoteData.margin}% desired margin. Sales Manager approval required before proceeding.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
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

  // Update quote status mutation
  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ quoteId, newStatus }: { quoteId: string; newStatus: string }) => {
      return await apiRequest("PATCH", `/api/quotes/${quoteId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Status Updated",
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
    const isLowMargin = desiredMargin < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD;
    
    const quotePayload = {
      name: quoteData.name,
      clientId: quoteData.clientId || null,
      leadId: quoteData.leadId || null,
      clientBudget: quoteData.budget, // Keep as string for decimal schema
      desiredMargin: quoteData.margin, // Keep as string for decimal schema
      totalCost: totals.totalCost.toString(),
      status: isLowMargin ? "pending_approval" : "draft",
      notes: quoteData.description || null,
      items: selectedProducts.map(item => {
        let unitCost = 0;
        const quantity = item.quantity || 1;
        
        if (item.type === 'product') {
          unitCost = parseFloat(products.find(p => p.id === item.productId)?.cost || '0');
        } else if (item.type === 'bundle') {
          // Calculate bundle cost from constituent products with custom quantities
          unitCost = calculateBundleCost(item.productId, item.customQuantities);
        }
        
        const itemTotalCost = unitCost * quantity;
        
        return {
          productId: item.type === 'product' ? item.productId : null,
          bundleId: item.type === 'bundle' ? item.productId : null,
          itemType: item.type,
          quantity: quantity,
          unitCost: unitCost.toString(), // Convert to string for decimal schema
          totalCost: itemTotalCost.toString(), // Convert to string for decimal schema
          customQuantities: item.type === 'bundle' && item.customQuantities ? item.customQuantities : undefined,
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
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };


  return (
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
            { id: "reports", name: "Sales Reports", icon: BarChart3 }
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
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-40"
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-date" className="text-sm whitespace-nowrap">End Date:</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-40"
                      data-testid="input-end-date"
                    />
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
                </nav>
              </div>

              {/* Pipeline Report Content */}
              {reportType === "pipeline" && (
                <div className="space-y-6">
                  {pipelineReportLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading pipeline data...</div>
                  ) : pipelineReport ? (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Total Leads</div>
                            <div className="text-2xl font-bold" data-testid="text-total-leads">
                              {pipelineReport.summary?.totalLeads || 0}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Total Value</div>
                            <div className="text-2xl font-bold" data-testid="text-total-value">
                              ${pipelineReport.summary?.totalValue?.toLocaleString() || 0}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Total Transitions</div>
                            <div className="text-2xl font-bold" data-testid="text-total-transitions">
                              {pipelineReport.summary?.totalTransitions || 0}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Average Value</div>
                            <div className="text-2xl font-bold" data-testid="text-average-value">
                              ${pipelineReport.summary?.averageValue?.toFixed(2) || 0}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Pipeline Stages */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Pipeline Stages</h3>
                        {pipelineReport.stages?.length > 0 ? (
                          pipelineReport.stages.map((stage: any) => (
                            <Card key={stage.id} className="border-l-4" style={{ borderLeftColor: stage.color }}>
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: stage.color }}
                                    />
                                    <h4 className="font-semibold text-lg" data-testid={`text-stage-name-${stage.id}`}>
                                      {stage.name}
                                    </h4>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold" data-testid={`text-stage-count-${stage.id}`}>
                                      {stage.leadCount} leads
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      ${stage.totalValue?.toLocaleString()} value
                                    </div>
                                  </div>
                                </div>

                                {/* Conversion Rates */}
                                {stage.conversions && stage.conversions.length > 0 && (
                                  <div className="mt-4 pl-7">
                                    <div className="text-sm font-medium text-muted-foreground mb-2">Conversions:</div>
                                    <div className="space-y-2">
                                      {stage.conversions.map((conversion: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                          <span>→ {conversion.toStageName}</span>
                                          <span className="font-medium">
                                            {conversion.count} leads ({conversion.rate.toFixed(1)}%)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No pipeline data available for the selected date range
                          </div>
                        )}
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
                                <th className="px-4 py-3 text-left text-sm font-medium">Rep Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Appointments</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Pitches</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Closed</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Total Leads</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Close Rate</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Avg MRR</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Total Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {salesRepReport.salesReps && salesRepReport.salesReps.length > 0 ? (
                                salesRepReport.salesReps.map((rep: any) => (
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
                                  {client.name} - {client.company || 'No Company'}
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

                      {/* Budget and Margin */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quote-budget">Client Budget ($)</Label>
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
                          <Label htmlFor="quote-margin">Desired Margin (%)</Label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="quote-margin"
                              type="number"
                              placeholder={`${SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD}.00`}
                              value={quoteData.margin}
                              onChange={(e) => setQuoteData(prev => ({ ...prev, margin: e.target.value }))}
                              className={`pl-10 ${parseFloat(quoteData.margin) < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD ? 'border-red-300 focus:border-red-500' : ''}`}
                              data-testid="input-quote-margin"
                            />
                          </div>
                          {parseFloat(quoteData.margin) < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD && quoteData.margin && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Margin below {SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD}% requires Sales Manager approval</span>
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
                                    <span className="text-muted-foreground">Client Budget:</span>
                                    <p className="font-medium" data-testid="quote-summary-budget">
                                      ${totals.budget.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Total Cost:</span>
                                    <p className="font-medium" data-testid="quote-summary-cost">
                                      ${totals.totalCost.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Profit:</span>
                                    <p className={`font-medium ${totals.profit < 0 ? 'text-red-600' : 'text-green-600'}`} data-testid="quote-summary-profit">
                                      ${totals.profit.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Actual Margin:</span>
                                    <p className={`font-medium ${totals.actualMargin < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD ? 'text-red-600' : 'text-green-600'}`} data-testid="quote-summary-margin">
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
                                          Current margin ({totals.actualMargin.toFixed(1)}%) is below {SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD}% minimum
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
                          <Label>Products & Bundles</Label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => addProductToQuote('product')} data-testid="button-add-product">
                              <Package className="w-4 h-4 mr-2" />
                              Add Product
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => addProductToQuote('bundle')} data-testid="button-add-bundle">
                              <Package className="w-4 h-4 mr-2" />
                              Add Bundle
                            </Button>
                          </div>
                        </div>
                        
                        {/* Product Search */}
                        {selectedProducts.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="product-search">Search Products & Bundles</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                id="product-search"
                                placeholder="Search products and bundles..."
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
                                  <Label>{item.type === 'product' ? 'Product' : 'Bundle'}</Label>
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
                                      ) : (
                                        filteredBundles.map((bundle: any) => {
                                          const bundleCost = calculateBundleCost(bundle.id, item.customQuantities);
                                          return (
                                            <SelectItem key={bundle.id} value={bundle.id}>
                                              {bundle.name} - ${bundleCost.toFixed(2)} cost
                                            </SelectItem>
                                          );
                                        })
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
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
                                            <p className="text-sm font-medium">{bundleProduct.productName}</p>
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
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2">
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

                {/* Quotes List */}
                <div className="space-y-4">
                  {(() => {
                    const filteredQuotes = quotesData.filter((quote: any) => 
                      quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (quote.clientName || quote.leadName || '').toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    if (filteredQuotes.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No quotes found matching your search.' : 'No quotes found. Create your first quote to get started.'}
                        </div>
                      );
                    }

                    return filteredQuotes.map((quote: any) => (
                    <div key={quote.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg" data-testid={`text-quote-name-${quote.id}`}>
                            {quote.name}
                          </h3>
                          <Badge 
                            className={getQuoteStatusBadge(quote.status)}
                            data-testid={`text-quote-status-${quote.id}`}
                          >
                            {quote.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Show approve/reject buttons for quotes pending approval - only for Sales Managers */}
                          {quote.status === 'pending_approval' && isSalesManager && (
                            <>
                              <Button 
                                variant="default"
                                size="sm" 
                                className="bg-primary hover:bg-primary/90"
                                data-testid={`button-approve-quote-${quote.id}`}
                                onClick={() => approveQuoteMutation.mutate(quote.id)}
                                disabled={approveQuoteMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {approveQuoteMutation.isPending ? "Approving..." : "Approve"}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                data-testid={`button-reject-quote-${quote.id}`}
                                onClick={() => rejectQuoteMutation.mutate(quote.id)}
                                disabled={rejectQuoteMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                {rejectQuoteMutation.isPending ? "Rejecting..." : "Reject"}
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-view-quote-${quote.id}`}
                            onClick={() => setViewingQuoteId(quote.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-edit-quote-${quote.id}`}
                            onClick={() => loadQuoteForEdit(quote.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-delete-quote-${quote.id}`}
                            onClick={() => setDeleteConfirmQuoteId(quote.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Client/Lead:</span>
                          <p className="font-medium" data-testid={`text-quote-client-${quote.id}`}>
                            {quote.clientName || quote.leadName || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <p className="font-medium" data-testid={`text-quote-budget-${quote.id}`}>
                            ${parseFloat(quote.clientBudget || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Desired Margin:</span>
                          <p className={`font-medium ${parseFloat(quote.desiredMargin) < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD ? 'text-red-600' : 'text-green-600'}`} data-testid={`text-quote-margin-${quote.id}`}>
                            {parseFloat(quote.desiredMargin || 0)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Cost:</span>
                          <p className="font-medium" data-testid={`text-quote-total-cost-${quote.id}`}>
                            ${parseFloat(quote.totalCost || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground" data-testid={`text-quote-created-${quote.id}`}>
                          Created: {new Date(quote.createdAt).toLocaleDateString()} by {quote.createdByName} {quote.createdByLastName}
                        </div>
                        
                        {/* Status Update Dropdown - don't show for rejected quotes */}
                        {quote.status !== 'rejected' && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Update Status:</Label>
                            <Select
                              value={quote.status}
                              onValueChange={(newStatus) => updateQuoteStatusMutation.mutate({ quoteId: quote.id, newStatus })}
                              disabled={updateQuoteStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`select-quote-status-${quote.id}`}>
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
                                {quote.status === 'accepted' && (
                                  <SelectItem value="accepted">Accepted</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                  })()}
                  
                  {/* Empty State - only show when no quotes match filter */}
                  {window.currentFilteredQuotes && window.currentFilteredQuotes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Quote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quotes found. Create your first quote to get started.</p>
                    </div>
                  )}
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
            const quote = quotesData.find((q: any) => q.id === viewingQuoteId);
            if (!quote) return null;
            
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Quote Name</Label>
                    <p className="font-medium" data-testid="text-view-quote-name">{quote.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div>
                      <Badge className={getQuoteStatusBadge(quote.status)} data-testid="text-view-quote-status">
                        {quote.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Client/Lead</Label>
                    <p className="font-medium" data-testid="text-view-quote-client">{quote.clientName || quote.leadName || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Budget</Label>
                    <p className="font-medium" data-testid="text-view-quote-budget">${parseFloat(quote.clientBudget || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Desired Margin</Label>
                    <p className={`font-medium ${parseFloat(quote.desiredMargin) < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD ? 'text-red-600' : 'text-green-600'}`} data-testid="text-view-quote-margin">
                      {parseFloat(quote.desiredMargin || 0)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Cost</Label>
                    <p className="font-medium" data-testid="text-view-quote-cost">${parseFloat(quote.totalCost || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created By</Label>
                    <p className="font-medium" data-testid="text-view-quote-creator">{quote.createdByName} {quote.createdByLastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created At</Label>
                    <p className="font-medium" data-testid="text-view-quote-created-at">{new Date(quote.createdAt).toLocaleDateString()}</p>
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
                    {quote.items && quote.items.length > 0 ? (
                      quote.items.map((item: any, index: number) => (
                        <div key={index} className="p-3 flex justify-between items-center" data-testid={`div-quote-item-${index}`}>
                          <div>
                            <p className="font-medium">{item.productName || item.bundleName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.itemType === 'product' ? 'Product' : 'Bundle'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${parseFloat(item.totalCost || 0).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))
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
  );
}