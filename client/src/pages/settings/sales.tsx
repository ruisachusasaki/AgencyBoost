import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCustomFieldMergeTags } from "@/hooks/use-custom-field-merge-tags";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/rich-text-editor";
import { Code } from "lucide-react";
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
  Eye,
  Mail,
  RotateCcw,
  Info
} from "lucide-react";

export default function SalesSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const [minimumMargin, setMinimumMargin] = useState("");

  const [termsTitle, setTermsTitle] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const termsEditorRef = useRef<RichTextEditorHandle | null>(null);
  const [showMergeTagDropdown, setShowMergeTagDropdown] = useState(false);
  const { customFieldsList } = useCustomFieldMergeTags();

  const termsMergeTags = [
    { category: "Client", tags: [
      { tag: "{{clientCompany}}", label: "Company Name" },
      { tag: "{{clientContactName}}", label: "Contact Name" },
      { tag: "{{clientEmail}}", label: "Email" },
      { tag: "{{clientPhone}}", label: "Phone" },
      { tag: "{{clientAddress}}", label: "Address" },
      { tag: "{{clientAddress2}}", label: "Address Line 2" },
      { tag: "{{clientCity}}", label: "City" },
      { tag: "{{clientState}}", label: "State" },
      { tag: "{{clientZipCode}}", label: "Zip Code" },
      { tag: "{{clientCityStateZip}}", label: "City, State ZIP" },
      { tag: "{{clientWebsite}}", label: "Website" },
    ]},
    { category: "Quote / Proposal", tags: [
      { tag: "{{proposalName}}", label: "Proposal Name" },
      { tag: "{{effectiveDate}}", label: "Effective Date" },
      { tag: "{{buildInvestment}}", label: "Build Investment (one-time)" },
      { tag: "{{monthlyInvestment}}", label: "Monthly Investment (recurring)" },
      { tag: "{{servicesList}}", label: "Services List (line items)" },
      { tag: "{{billingFrequency}}", label: "Billing Frequency" },
    ]},
    { category: "Your Business", tags: [
      { tag: "{{businessName}}", label: "Business Name" },
      { tag: "{{businessEmail}}", label: "Business Email" },
      { tag: "{{businessPhone}}", label: "Business Phone" },
      { tag: "{{businessAddress}}", label: "Business Address" },
      { tag: "{{businessCity}}", label: "Business City" },
      { tag: "{{businessState}}", label: "Business State" },
      { tag: "{{businessZipCode}}", label: "Business Zip Code" },
    ]},
    { category: "Signature (filled at signing)", tags: [
      { tag: "{{signerName}}", label: "Signer Name" },
      { tag: "{{signerEmail}}", label: "Signer Email" },
      { tag: "{{signerIpAddress}}", label: "Signer IP Address" },
      { tag: "{{signatureDate}}", label: "Signature Date" },
    ]},
    ...(customFieldsList.length > 0 ? [{ category: "Custom Fields", tags: customFieldsList.map((field) => ({
      tag: `{{custom.${field.name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase()}}}`,
      label: field.name,
    }))}] : []),
  ];

  const [brandingLogo, setBrandingLogo] = useState("");
  const [brandingCompanyName, setBrandingCompanyName] = useState("");
  const [brandingColor, setBrandingColor] = useState("#00C9C6");
  const [brandingFooterText, setBrandingFooterText] = useState("");

  const emailTemplateDefaults = {
    subjectLine: "Your Proposal: {{proposalName}}",
    headerTitle: "Your Proposal is Ready",
    headerSubtitle: "Review, sign, and pay — all in one place",
    greeting: "Hi {{clientName}},",
    introText: "We've prepared a proposal for you. Please review the details, sign, and complete payment to get started.",
    step1: "Review the proposal details and pricing",
    step2: "Accept terms and sign electronically",
    step3: "Complete payment via credit card or bank transfer",
    buttonText: "View & Sign Proposal",
    closingText: "If you have any questions, please don't hesitate to reach out.",
  };
  const [emailTemplate, setEmailTemplate] = useState(emailTemplateDefaults);

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

  const { data: emailTemplateData, isLoading: isLoadingEmailTemplate } = useQuery<any>({
    queryKey: ['/api/settings/proposal-email-template'],
  });

  const saveEmailTemplateMutation = useMutation({
    mutationFn: async (data: typeof emailTemplateDefaults) => {
      const res = await apiRequest('PUT', '/api/settings/proposal-email-template', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/proposal-email-template'] });
      toast({ title: "Email Template Saved", description: "Your proposal email template has been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save email template", variant: "destructive" });
    },
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

  useEffect(() => {
    if (emailTemplateData) {
      setEmailTemplate({ ...emailTemplateDefaults, ...emailTemplateData });
    }
  }, [emailTemplateData]);

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
            { id: "branding", name: "Proposal Branding", icon: Palette },
            { id: "email-template", name: "Email Template", icon: Mail }
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
                <div className="flex items-center justify-between">
                  <Label>Content</Label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setShowMergeTagDropdown(!showMergeTagDropdown)}
                    >
                      <Code className="h-3.5 w-3.5" />
                      Insert Merge Tag
                    </Button>
                    {showMergeTagDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMergeTagDropdown(false)} />
                        <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-white dark:bg-gray-900 border rounded-lg shadow-xl max-h-80 overflow-y-auto">
                          {termsMergeTags.map((group) => (
                            <div key={group.category}>
                              <div className="px-3 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0">
                                {group.category}
                              </div>
                              {group.tags.map((item) => (
                                <button
                                  key={item.tag}
                                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center justify-between gap-2"
                                  onClick={() => {
                                    termsEditorRef.current?.insertText(item.tag);
                                    setShowMergeTagDropdown(false);
                                  }}
                                >
                                  <span>{item.label}</span>
                                  <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded font-mono">{item.tag}</code>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <RichTextEditor
                  content={termsContent}
                  onChange={(html) => setTermsContent(html)}
                  placeholder="Enter your terms and conditions here..."
                  editorRef={termsEditorRef}
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

      {activeTab === "email-template" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Proposal Email Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg bg-muted/50 border p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{"{{clientName}}"}</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{"{{proposalName}}"}</code> as merge tags. They will be replaced with the actual client name and proposal name when the email is sent.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tpl-subject">Email Subject Line</Label>
                  <Input
                    id="tpl-subject"
                    value={emailTemplate.subjectLine}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, subjectLine: e.target.value }))}
                    placeholder="Your Proposal: {{proposalName}}"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tpl-header-title">Header Title</Label>
                    <Input
                      id="tpl-header-title"
                      value={emailTemplate.headerTitle}
                      onChange={(e) => setEmailTemplate(prev => ({ ...prev, headerTitle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-header-subtitle">Header Subtitle</Label>
                    <Input
                      id="tpl-header-subtitle"
                      value={emailTemplate.headerSubtitle}
                      onChange={(e) => setEmailTemplate(prev => ({ ...prev, headerSubtitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tpl-greeting">Greeting</Label>
                  <Input
                    id="tpl-greeting"
                    value={emailTemplate.greeting}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, greeting: e.target.value }))}
                    placeholder="Hi {{clientName}},"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tpl-intro">Introduction Text</Label>
                  <Textarea
                    id="tpl-intro"
                    value={emailTemplate.introText}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, introText: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Steps (shown as numbered list)</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                      <Input
                        value={emailTemplate.step1}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, step1: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                      <Input
                        value={emailTemplate.step2}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, step2: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                      <Input
                        value={emailTemplate.step3}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, step3: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tpl-button">Button Text</Label>
                  <Input
                    id="tpl-button"
                    value={emailTemplate.buttonText}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, buttonText: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tpl-closing">Closing Text</Label>
                  <Input
                    id="tpl-closing"
                    value={emailTemplate.closingText}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, closingText: e.target.value }))}
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailTemplate(emailTemplateDefaults);
                      toast({ title: "Template Reset", description: "Fields reset to defaults. Click Save to apply." });
                    }}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={() => saveEmailTemplateMutation.mutate(emailTemplate)}
                    disabled={saveEmailTemplateMutation.isPending || isLoadingEmailTemplate}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saveEmailTemplateMutation.isPending ? "Saving..." : "Save Template"}
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
              <div className="px-4 py-2 bg-muted border-b flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="font-medium">Subject:</span>
                <span>{emailTemplate.subjectLine.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</span>
              </div>
              <div
                className="p-6 text-white text-center"
                style={{ background: `linear-gradient(135deg, ${brandingColor} 0%, ${darkenColor(brandingColor, -20)} 100%)` }}
              >
                {brandingLogo && (
                  <div className="inline-block bg-white/90 rounded-lg px-3 py-2 mb-3">
                    <img src={brandingLogo} alt="Logo" className="h-10 max-w-[160px] object-contain mx-auto" />
                  </div>
                )}
                {brandingCompanyName && (
                  <p className="text-xs opacity-85 tracking-wider mb-2">{brandingCompanyName}</p>
                )}
                <h3 className="text-xl font-bold">{emailTemplate.headerTitle.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</h3>
                <p className="text-sm opacity-90 mt-1">{emailTemplate.headerSubtitle.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</p>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-3 font-medium">{emailTemplate.greeting.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</p>
                <p className="text-sm text-gray-600 mb-4">{emailTemplate.introText.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Proposal</p>
                  <p className="font-semibold">Website Redesign Package</p>
                </div>
                <div className="space-y-2.5 mb-5">
                  {[emailTemplate.step1, emailTemplate.step2, emailTemplate.step3].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: brandingColor }}
                      >{i + 1}</span>
                      <span className="text-sm text-gray-700">{step.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center mb-4">
                  <button
                    className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm"
                    style={{ backgroundColor: brandingColor }}
                  >
                    {emailTemplate.buttonText.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}
                  </button>
                </div>
                <p className="text-sm text-gray-500">{emailTemplate.closingText.replace(/\{\{clientName\}\}/g, "John Smith").replace(/\{\{proposalName\}\}/g, "Website Redesign Package")}</p>
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
