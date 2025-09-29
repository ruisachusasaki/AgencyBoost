import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
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
  Minus
} from "lucide-react";

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Sales Calculator state
  const [calculatorData, setCalculatorData] = useState({
    dealValue: "",
    commissionRate: "",
    bonusAmount: "",
    deductions: "",
  });

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
            { id: "calculator", name: "Sales Calculator", icon: Calculator }
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
    </div>
  );
}