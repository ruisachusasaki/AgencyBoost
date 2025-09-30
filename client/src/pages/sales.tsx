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
import { SALES_CONFIG, ROLE_NAMES } from "@shared/constants";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  Plus,
  Search,
  Calendar,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Banknote,
  PieChart,
  BarChart3,
  Calculator,
  Percent,
  Minus,
  Quote,
  Edit,
  Trash2,
  Eye,
  Package,
  X,
  AlertTriangle,
  ChevronDown
} from "lucide-react";

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user to check for Sales Manager role
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
  });
  
  // Check if current user is a Sales Manager or Admin
  const isSalesManager = currentUser?.roles?.includes(ROLE_NAMES.SALES_MANAGER) || currentUser?.roles?.includes('Admin');
  
  // Sales Calculator state
  const [calculatorData, setCalculatorData] = useState({
    dealValue: "",
    commissionRate: "",
    bonusAmount: "",
    deductions: "",
  });

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

  const calculateCommission = () => {
    const deal = parseFloat(calculatorData.dealValue) || 0;
    const rate = parseFloat(calculatorData.commissionRate) || 0;
    const bonus = parseFloat(calculatorData.bonusAmount) || 0;
    const deductions = parseFloat(calculatorData.deductions) || 0;
    
    const baseCommission = (deal * rate) / 100;
    const totalCommission = baseCommission + bonus - deductions;
    
    return {
      baseCommission,
      totalCommission,
      dealValue: deal
    };
  };

  const results = calculateCommission();

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

  // Fetch data for sales dashboard
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["/api/sales-overview"],
    enabled: false, // Disable for now as we don't have the endpoint yet
  });

  // Mock data for development (replace with real data later)
  const mockSalesStats = {
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    activeDeals: 24,
    conversionRate: 18.5,
    avgDealSize: 5200,
    targetAchievement: 85.3
  };

  const mockDeals = [
    {
      id: "1",
      title: "Website Redesign Project",
      client: "TechCorp Inc.",
      value: 15000,
      stage: "Proposal Sent",
      probability: 75,
      closeDate: "2025-02-15",
      status: "active"
    },
    {
      id: "2", 
      title: "Social Media Management",
      client: "LocalBiz LLC",
      value: 3500,
      stage: "Negotiation",
      probability: 60,
      closeDate: "2025-01-30",
      status: "active"
    },
    {
      id: "3",
      title: "Brand Identity Package",
      client: "StartupXYZ",
      value: 8500,
      stage: "Closed Won",
      probability: 100,
      closeDate: "2025-01-10",
      status: "won"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return "text-green-600";
    if (probability >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-muted-foreground">Loading sales data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-muted-foreground">
              Manage your sales pipeline and track revenue performance
            </p>
          </div>
        </div>
        <Button data-testid="button-add-deal">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockSalesStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{mockSalesStats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSalesStats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(mockSalesStats.avgDealSize)} avg deal size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSalesStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Lead to customer conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSalesStats.targetAchievement}%</div>
            <p className="text-xs text-muted-foreground">
              Of monthly target achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 mt-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", name: "Pipeline Overview", icon: PieChart },
            { id: "deals", name: "Active Deals", icon: Target },
            { id: "reports", name: "Sales Reports", icon: BarChart3 },
            { id: "calculator", name: "Sales Calculator", icon: Calculator },
            { id: "quotes", name: "Quotes", icon: Quote }
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

      {/* Pipeline Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Pipeline visualization and stage management will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Deals Tab */}
      {activeTab === "deals" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Deals</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-deals"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDeals.map((deal) => (
                  <div key={deal.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{deal.title}</h3>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.stage}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(deal.value)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{deal.client}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(deal.closeDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={`font-medium ${getProbabilityColor(deal.probability)}`}>
                        {deal.probability}% probability
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed sales analytics and reporting features will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Calculator Tab */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Commission Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Deal Information</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="dealValue" className="block text-sm font-medium">Deal Value ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="dealValue"
                        type="number"
                        placeholder="0.00"
                        value={calculatorData.dealValue}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, dealValue: e.target.value }))}
                        className="pl-10"
                        data-testid="input-deal-value"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="commissionRate" className="block text-sm font-medium">Commission Rate (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="commissionRate"
                        type="number"
                        placeholder="0.00"
                        value={calculatorData.commissionRate}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, commissionRate: e.target.value }))}
                        className="pl-10"
                        data-testid="input-commission-rate"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bonusAmount" className="block text-sm font-medium">Bonus Amount ($)</label>
                    <div className="relative">
                      <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="bonusAmount"
                        type="number"
                        placeholder="0.00"
                        value={calculatorData.bonusAmount}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, bonusAmount: e.target.value }))}
                        className="pl-10"
                        data-testid="input-bonus-amount"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="deductions" className="block text-sm font-medium">Deductions ($)</label>
                    <div className="relative">
                      <Minus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="deductions"
                        type="number"
                        placeholder="0.00"
                        value={calculatorData.deductions}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, deductions: e.target.value }))}
                        className="pl-10"
                        data-testid="input-deductions"
                      />
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Commission Results</h3>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Deal Value</p>
                          <p className="text-2xl font-bold text-gray-900" data-testid="result-deal-value">
                            ${results.dealValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Base Commission</p>
                          <p className="text-2xl font-bold text-blue-600" data-testid="result-base-commission">
                            ${results.baseCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Commission</p>
                          <p className="text-3xl font-bold text-primary" data-testid="result-total-commission">
                            ${results.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
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
                            onClick={() => console.log('View quote:', quote.id)}
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
                            onClick={() => console.log('Delete quote:', quote.id)}
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

                      <div className="mt-3 text-xs text-muted-foreground" data-testid={`text-quote-created-${quote.id}`}>
                        Created: {new Date(quote.createdAt).toLocaleDateString()} by {quote.createdByName} {quote.createdByLastName}
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
    </div>
  );
}