import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Calculator, 
  Settings, 
  Banknote,
  DollarSign,
  Percent,
  Plus,
  Minus
} from "lucide-react";

export default function SalesSettings() {
  const [activeTab, setActiveTab] = useState("calculator");
  
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sales Settings</h1>
            <p className="text-muted-foreground">Manage sales calculations and commission settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "calculator", name: "Sales Calculator", icon: Calculator },
            { id: "general", name: "General Settings", icon: Settings }
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
                    <Label htmlFor="dealValue">Deal Value ($)</Label>
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
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
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
                    <Label htmlFor="bonusAmount">Bonus Amount ($)</Label>
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
                    <Label htmlFor="deductions">Deductions ($)</Label>
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

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Sales Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                General sales configuration options will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}