import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { 
  ArrowLeft, 
  Settings, 
  Banknote,
  Percent,
  Save,
  Shield,
  FileText,
  Palette,
  Upload,
  X,
  Eye
} from "lucide-react";

export default function SalesSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const [minimumMargin, setMinimumMargin] = useState("");

  const [termsTitle, setTermsTitle] = useState("");
  const [termsContent, setTermsContent] = useState("");

  const [brandingLogo, setBrandingLogo] = useState("");
  const [brandingCompanyName, setBrandingCompanyName] = useState("");
  const [brandingColor, setBrandingColor] = useState("#00C9C6");
  const [brandingFooterText, setBrandingFooterText] = useState("");

  const { data: salesSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/sales-settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { minimumMarginThreshold: string }) => {
      const res = await apiRequest('PATCH', '/api/sales-settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-settings'] });
      toast({
        title: "Settings Updated",
        variant: "default",
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

  const { data: proposalTermsList = [] } = useQuery<any[]>({
    queryKey: ['/api/proposal-terms'],
  });

  const activeTerms = proposalTermsList.find((t: any) => t.isActive);

  const updateTermsMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest('PUT', '/api/proposal-terms', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposal-terms'] });
      toast({ title: "Terms & Conditions Updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update terms", variant: "destructive" });
    },
  });

  const { data: brandingData, isLoading: isLoadingBranding } = useQuery<any>({
    queryKey: ['/api/settings/proposal-branding'],
  });

  const saveBrandingMutation = useMutation({
    mutationFn: async (data: { logoUrl: string; companyName: string; primaryColor: string; footerText: string }) => {
      const res = await apiRequest('PUT', '/api/settings/proposal-branding', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/proposal-branding'] });
      toast({ title: "Proposal Branding Saved", description: "Your branding settings have been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save branding", variant: "destructive" });
    },
  });

  const profileImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const response = await fetch("/api/profile-images", {
        method: "PUT",
        body: JSON.stringify({ profileImageURL: imageURL }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to save image");
      return response.json();
    },
  });

  useEffect(() => {
    if (salesSettings && salesSettings.minimumMarginThreshold !== undefined && salesSettings.minimumMarginThreshold !== null) {
      setMinimumMargin(salesSettings.minimumMarginThreshold.toString());
    }
  }, [salesSettings]);

  useEffect(() => {
    if (activeTerms) {
      setTermsTitle(activeTerms.title);
      setTermsContent(activeTerms.content);
    }
  }, [activeTerms]);

  useEffect(() => {
    if (brandingData) {
      setBrandingLogo(brandingData.logoUrl || "");
      setBrandingCompanyName(brandingData.companyName || "");
      setBrandingColor(brandingData.primaryColor || "#00C9C6");
      setBrandingFooterText(brandingData.footerText || "");
    }
  }, [brandingData]);

  const handleSaveSettings = () => {
    if (!minimumMargin || parseFloat(minimumMargin) < 0 || parseFloat(minimumMargin) > 100) {
      toast({
        title: "Invalid Value",
        description: "Minimum margin must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    
    updateSettingsMutation.mutate({
      minimumMarginThreshold: minimumMargin
    });
  };

  const handleSaveBranding = () => {
    const colorToSave = /^#[0-9A-Fa-f]{6}$/.test(brandingColor) ? brandingColor : "#00C9C6";
    if (colorToSave !== brandingColor) {
      setBrandingColor(colorToSave);
      toast({ title: "Invalid color reset to default", description: "Color must be a valid 6-digit hex value (e.g. #00C9C6).", variant: "destructive" });
      return;
    }
    saveBrandingMutation.mutate({
      logoUrl: brandingLogo,
      companyName: brandingCompanyName,
      primaryColor: colorToSave,
      footerText: brandingFooterText,
    });
  };

  const darkenColor = (hex: string, amount: number): string => {
    let color = hex.replace('#', '');
    if (color.length === 3) color = color.split('').map(c => c + c).join('');
    const num = parseInt(color, 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
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

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "general", name: "General Settings", icon: Settings },
            { id: "terms", name: "Terms & Conditions", icon: Shield },
            { id: "branding", name: "Proposal Branding", icon: Palette }
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

      {activeTab === "terms" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Proposal Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These terms will be displayed on client-facing proposals. Clients must accept them before signing.
              </p>

              {activeTerms && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="outline">Version {activeTerms.version}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date(activeTerms.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="terms-title">Title</Label>
                <Input
                  id="terms-title"
                  value={termsTitle}
                  onChange={(e) => setTermsTitle(e.target.value)}
                  placeholder="Terms & Conditions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms-content">Content (HTML supported)</Label>
                <Textarea
                  id="terms-content"
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  placeholder="Enter your terms and conditions here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!termsTitle || !termsContent) {
                      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
                      return;
                    }
                    updateTermsMutation.mutate({ title: termsTitle, content: termsContent });
                  }}
                  disabled={updateTermsMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateTermsMutation.isPending ? "Saving..." : "Save Terms & Conditions"}
                </Button>
              </div>

              {activeTerms && (
                <div className="border-t pt-4 mt-4">
                  <Label className="text-muted-foreground text-xs mb-2 block">Preview</Label>
                  <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: termsContent }} />
                </div>
              )}
            </CardContent>
          </Card>

          {proposalTermsList.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {proposalTermsList.map((term: any) => (
                    <div key={term.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={term.isActive ? "default" : "secondary"}>
                          v{term.version}
                        </Badge>
                        <span className="text-sm">{term.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(term.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Proposal Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Customize the appearance of client-facing proposals and emails. These settings override defaults from your Business Profile.
                </p>

                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {brandingLogo ? (
                      <div className="relative">
                        <img
                          src={brandingLogo}
                          alt="Logo"
                          className="h-16 w-auto max-w-[200px] object-contain rounded border p-1"
                        />
                        <button
                          onClick={() => setBrandingLogo("")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                        No logo
                      </div>
                    )}
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        const response = await fetch("/api/objects/upload", { method: "POST" });
                        const data = await response.json();
                        return { method: "PUT" as const, url: data.uploadURL };
                      }}
                      onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                        const uploadedFile = result.successful[0];
                        if (uploadedFile?.uploadURL) {
                          profileImageMutation.mutate(uploadedFile.uploadURL as string, {
                            onSuccess: (data) => {
                              setBrandingLogo(data.objectPath);
                              toast({ title: "Logo Uploaded" });
                            },
                            onError: () => {
                              toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
                            }
                          });
                        }
                      }}
                      buttonClassName="h-9"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </ObjectUploader>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG or JPG, max 10MB. Displayed in proposal header and emails.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branding-company-name">Company Name</Label>
                  <Input
                    id="branding-company-name"
                    value={brandingCompanyName}
                    onChange={(e) => setBrandingCompanyName(e.target.value)}
                    placeholder="Your Company Name"
                  />
                  <p className="text-xs text-muted-foreground">Shown in proposal header and emails.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branding-color">Primary Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="branding-color-picker"
                      value={brandingColor}
                      onChange={(e) => setBrandingColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer p-0"
                    />
                    <Input
                      id="branding-color"
                      value={brandingColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === "") {
                          setBrandingColor(val);
                        }
                      }}
                      placeholder="#00C9C6"
                      className="max-w-[140px] font-mono"
                    />
                    <div
                      className="h-10 flex-1 rounded border"
                      style={{ background: `linear-gradient(135deg, ${brandingColor} 0%, ${darkenColor(brandingColor, -20)} 100%)` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for buttons, headers, and accents on proposals.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branding-footer">Footer Text</Label>
                  <Textarea
                    id="branding-footer"
                    value={brandingFooterText}
                    onChange={(e) => setBrandingFooterText(e.target.value)}
                    placeholder="e.g., Powered by Your Agency | www.youragency.com"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">Optional tagline displayed at the bottom of proposals and emails.</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveBranding}
                    disabled={saveBrandingMutation.isPending || isLoadingBranding}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saveBrandingMutation.isPending ? "Saving..." : "Save Branding"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </div>
            <Card className="overflow-hidden shadow-lg">
              <div
                className="p-6 text-white text-center"
                style={{ background: `linear-gradient(135deg, ${brandingColor} 0%, ${darkenColor(brandingColor, -20)} 100%)` }}
              >
                {brandingLogo && (
                  <div className="inline-block bg-white/90 rounded-lg px-3 py-2 mb-3">
                    <img
                      src={brandingLogo}
                      alt="Logo"
                      className="h-10 max-w-[160px] object-contain mx-auto"
                    />
                  </div>
                )}
                {brandingCompanyName && (
                  <p className="text-xs opacity-85 tracking-wider mb-2">{brandingCompanyName}</p>
                )}
                <h3 className="text-xl font-bold">Your Proposal is Ready</h3>
                <p className="text-sm opacity-90 mt-1">Review, sign, and pay — all in one place</p>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">Hi Client Name,</p>
                <p className="text-sm text-gray-600 mb-4">We've prepared a proposal for you...</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Proposal</p>
                  <p className="font-semibold">Sample Service Package</p>
                </div>
                <div className="text-center mb-4">
                  <button
                    className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm"
                    style={{ backgroundColor: brandingColor }}
                  >
                    View & Sign Proposal
                  </button>
                </div>
                {brandingFooterText && (
                  <div className="border-t pt-3 mt-4 text-center">
                    <p className="text-xs text-gray-400">{brandingFooterText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
