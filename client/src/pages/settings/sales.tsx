import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Settings, 
  Banknote,
  Percent,
  Save
} from "lucide-react";

export default function SalesSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  // Sales Settings state
  const [minimumMargin, setMinimumMargin] = useState("");

  // Fetch sales settings
  const { data: salesSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/sales-settings'],
  });

  // Update sales settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { minimumMarginThreshold: string }) => {
      const res = await apiRequest('PATCH', '/api/sales-settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-settings'] });
      toast({
        title: "Settings Updated",
        variant: "success",
        description: "Sales settings have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sales settings",
        variant: "destructive",
      });
    },
  });

  // Initialize minimum margin from settings
  useEffect(() => {
    if (salesSettings && salesSettings.minimumMarginThreshold !== undefined && salesSettings.minimumMarginThreshold !== null) {
      setMinimumMargin(salesSettings.minimumMarginThreshold.toString());
    }
  }, [salesSettings]);

  const handleSaveSettings = () => {
    if (!minimumMargin || parseFloat(minimumMargin) < 0 || parseFloat(minimumMargin) > 100) {
      toast({
        title: "Invalid Value",
        variant: "success",
        description: "Minimum margin must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    
    updateSettingsMutation.mutate({
      minimumMarginThreshold: minimumMargin
    });
  };

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

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quote Approval Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumMargin">
                    Minimum Margin Threshold (%)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Quotes with margins below this threshold will require approval from a Sales Manager or Admin before being sent to clients.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative max-w-xs">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="minimumMargin"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="35.00"
                        value={minimumMargin}
                        onChange={(e) => setMinimumMargin(e.target.value)}
                        className="pl-10"
                        data-testid="input-minimum-margin"
                        disabled={isLoadingSettings}
                      />
                    </div>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={updateSettingsMutation.isPending || isLoadingSettings}
                      className="gap-2"
                      data-testid="button-save-settings"
                    >
                      <Save className="h-4 w-4" />
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </div>

                {salesSettings && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Current Setting:</strong> Quotes with margins below {salesSettings.minimumMarginThreshold}% require approval.
                    </p>
                    {salesSettings.updatedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date(salesSettings.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}