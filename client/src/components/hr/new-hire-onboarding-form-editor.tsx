import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Type, 
  Mail, 
  Phone, 
  FileText, 
  Calendar,
  User,
  MapPin,
  CreditCard,
  Heart,
  Shirt,
  Copy,
  ExternalLink,
  Upload,
  Download,
  X,
  Loader2,
  Paintbrush,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  welcomeHeading: string;
  welcomeDescription: string;
  submitButtonText: string;
  successHeading: string;
  successDescription: string;
}

const defaultBranding: OnboardingBranding = {
  companyName: '',
  logoUrl: '',
  primaryColor: '#16a34a',
  welcomeHeading: 'Welcome to the Team!',
  welcomeDescription: "We're excited to have you join us! Please complete the onboarding form below to help us get everything set up for your first day.",
  submitButtonText: 'Submit Onboarding Information',
  successHeading: 'Onboarding Information Submitted!',
  successDescription: 'Thank you for completing your onboarding form. Our HR team will review your information and contact you with next steps.',
};

const colorPresets = [
  { name: 'Green', value: '#16a34a' },
  { name: 'Teal', value: '#00C9C6' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Slate', value: '#475569' },
];

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select' | 'file';
  placeholder?: string;
  required: boolean;
  options?: string[];
  templateFileUrl?: string;
  templateFileName?: string;
  acceptedFileTypes?: string;
  order: number;
}

const defaultFields: FormField[] = [
  {
    id: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
    order: 0
  },
  {
    id: 'address',
    label: 'Address',
    type: 'textarea',
    placeholder: 'Enter your full address',
    required: true,
    order: 1
  },
  {
    id: 'phone_number',
    label: 'Phone Number',
    type: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: true,
    order: 2
  },
  {
    id: 'date_of_birth',
    label: 'Date of Birth',
    type: 'date',
    required: true,
    order: 3
  },
  {
    id: 'start_date',
    label: 'Start Date',
    type: 'date',
    required: true,
    order: 4
  },
  {
    id: 'emergency_contact_name',
    label: 'Emergency Contact Name',
    type: 'text',
    placeholder: 'Enter emergency contact name',
    required: true,
    order: 5
  },
  {
    id: 'emergency_contact_number',
    label: 'Emergency Contact Number',
    type: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: true,
    order: 6
  },
  {
    id: 'emergency_contact_relationship',
    label: 'Emergency Contact Relationship',
    type: 'select',
    required: true,
    options: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'],
    order: 7
  },
  {
    id: 'tshirt_size',
    label: 'T-shirt Size',
    type: 'select',
    required: true,
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    order: 8
  },
  {
    id: 'payment_platform',
    label: 'Payment Platform',
    type: 'select',
    required: true,
    options: ['PayPal', 'Direct Deposit', 'Zelle', 'Venmo', 'Cash App', 'Wire Transfer'],
    order: 9
  },
  {
    id: 'payment_email',
    label: 'Email linked to Payment Platform',
    type: 'email',
    placeholder: 'payment@example.com',
    required: true,
    order: 10
  }
];

export default function NewHireOnboardingFormEditor() {
  // Load form configuration from backend
  const { data: configData, isLoading } = useQuery({
    queryKey: ['/api/new-hire-onboarding-form-config'],
    enabled: true,
  });

  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [branding, setBranding] = useState<OnboardingBranding>(defaultBranding);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldForm, setFieldForm] = useState<Partial<FormField>>({
    label: '',
    type: 'text',
    placeholder: '',
    required: false,
    options: [],
    templateFileUrl: '',
    templateFileName: ''
  });
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"fields" | "branding">("fields");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved configuration or use defaults
  useEffect(() => {
    if (configData?.fields) {
      setFields(configData.fields);
    }
    if (configData?.branding) {
      setBranding({ ...defaultBranding, ...configData.branding });
    }
  }, [configData]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (payload: { fields: FormField[]; branding: OnboardingBranding }) => {
      return apiRequest('POST', '/api/new-hire-onboarding-form-config', payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        variant: "default",
        description: "Onboarding form configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/new-hire-onboarding-form-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    }
  });

  const handleSaveConfiguration = () => {
    saveConfigMutation.mutate({ fields, branding });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFields(updatedItems);
  };

  const handleAddField = () => {
    if (!fieldForm.label) return;

    const newField: FormField = {
      id: `custom_${Date.now()}`,
      label: fieldForm.label!,
      type: fieldForm.type!,
      placeholder: fieldForm.placeholder,
      required: fieldForm.required!,
      options: fieldForm.options?.filter(opt => opt.trim()),
      templateFileUrl: fieldForm.type === 'file' ? fieldForm.templateFileUrl : undefined,
      templateFileName: fieldForm.type === 'file' ? fieldForm.templateFileName : undefined,
      acceptedFileTypes: fieldForm.type === 'file' ? '.pdf,.doc,.docx,.jpg,.png' : undefined,
      order: fields.length
    };

    setFields([...fields, newField]);
    setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [], templateFileUrl: '', templateFileName: '' });
    setIsFieldModalOpen(false);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFieldForm({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options || [],
      templateFileUrl: field.templateFileUrl || '',
      templateFileName: field.templateFileName || '',
    });
    setIsFieldModalOpen(true);
  };

  const handleUpdateField = () => {
    if (!editingField || !fieldForm.label) return;

    const updatedFields = fields.map(field =>
      field.id === editingField.id
        ? {
            ...field,
            label: fieldForm.label!,
            type: fieldForm.type!,
            placeholder: fieldForm.placeholder,
            required: fieldForm.required!,
            options: fieldForm.options?.filter(opt => opt.trim()),
            templateFileUrl: fieldForm.type === 'file' ? fieldForm.templateFileUrl : undefined,
            templateFileName: fieldForm.type === 'file' ? fieldForm.templateFileName : undefined,
            acceptedFileTypes: fieldForm.type === 'file' ? '.pdf,.doc,.docx,.jpg,.png' : undefined,
          }
        : field
    );

    setFields(updatedFields);
    setEditingField(null);
    setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [], templateFileUrl: '', templateFileName: '' });
    setIsFieldModalOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const handleResetToDefaults = () => {
    setFields(defaultFields);
    toast({
      title: "Success",
      variant: "default",
      description: "Form has been reset to default fields",
    });
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/onboarding-template-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload template file');
      }

      const result = await response.json();
      setFieldForm(prev => ({
        ...prev,
        templateFileUrl: result.fileUrl,
        templateFileName: file.name,
      }));

      toast({
        title: "Template Uploaded",
        variant: "default",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload template file",
        variant: "destructive",
      });
    } finally {
      setUploadingTemplate(false);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/onboarding-logo-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const result = await response.json();
      setBranding(prev => ({ ...prev, logoUrl: result.fileUrl }));

      toast({
        title: "Logo Uploaded",
        variant: "default",
        description: "Company logo uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  };

  const lightenColor = (hex: string, amount: number): string => {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'select': return <Type className="h-4 w-4" />;
      case 'file': return <Upload className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getFieldBadgeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'textarea': return 'bg-purple-100 text-purple-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      case 'select': return 'bg-yellow-100 text-yellow-800';
      case 'file': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Copy onboarding URL handler
  const handleCopyOnboardingUrl = () => {
    const onboardingUrl = `${window.location.origin}/onboarding`;
    navigator.clipboard.writeText(onboardingUrl);
    toast({
      title: "Success",
      variant: "default",
      description: "Onboarding URL copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">New Hire Onboarding Form</h2>
        <p className="text-slate-600">Configure the form that new hires will fill out when joining your company</p>
      </div>

      {/* Onboarding URL Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Onboarding Form URL
          </CardTitle>
          <CardDescription>
            Share this URL with new hires to complete their onboarding information. They will fill out the fields you configure below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1 font-mono text-sm break-all">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding`}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyOnboardingUrl}
                data-testid="button-copy-onboarding-url"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(`${window.location.origin}/onboarding`, '_blank')}
                data-testid="button-open-onboarding-url"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveEditorTab("fields")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeEditorTab === "fields"
                ? "text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            style={activeEditorTab === "fields" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
          >
            Form Fields
          </button>
          <button
            onClick={() => setActiveEditorTab("branding")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeEditorTab === "branding"
                ? "text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            style={activeEditorTab === "branding" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            Branding & Style
          </button>
        </div>

        {activeEditorTab === "branding" && (<div className="space-y-6">
          {/* Branding Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Branding & Style
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your public onboarding form. Changes apply to the page new hires see when filling out the form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Company Logo */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Company Logo</Label>
                <p className="text-sm text-muted-foreground">Upload your company logo to display at the top of the onboarding form. Recommended: PNG or SVG, at least 200px wide.</p>
                <div className="flex items-start gap-4">
                  {branding.logoUrl ? (
                    <div className="relative group">
                      <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                        <img src={branding.logoUrl} alt="Company logo" className="max-w-full max-h-full object-contain p-2" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-colors">
                        {uploadingLogo ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-xs text-center">Upload Logo</span>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Your Company Name"
                      value={branding.companyName}
                      onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Displayed alongside the logo in the header. Leave empty to hide.</p>
                  </div>
                </div>
              </div>

              {/* Primary Color */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Primary Color</Label>
                <p className="text-sm text-muted-foreground">This color is used for the background gradient, buttons, icons, and accents on the onboarding form.</p>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, primaryColor: preset.value }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          branding.primaryColor === preset.value
                            ? 'border-slate-900 shadow-sm'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-slate-200"
                          style={{ backgroundColor: preset.value }}
                        />
                        <span className="text-sm">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="custom-color" className="shrink-0">Custom:</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer border border-slate-200"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                            setBranding(prev => ({ ...prev, primaryColor: v }));
                          }
                        }}
                        className="w-28 font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Customization */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Text Customization</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-heading">Welcome Heading</Label>
                    <Input
                      id="welcome-heading"
                      value={branding.welcomeHeading}
                      onChange={(e) => setBranding(prev => ({ ...prev, welcomeHeading: e.target.value }))}
                      placeholder="Welcome to the Team!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-description">Welcome Description</Label>
                    <Textarea
                      id="welcome-description"
                      value={branding.welcomeDescription}
                      onChange={(e) => setBranding(prev => ({ ...prev, welcomeDescription: e.target.value }))}
                      placeholder="We're excited to have you join us..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submit-button-text">Submit Button Text</Label>
                    <Input
                      id="submit-button-text"
                      value={branding.submitButtonText}
                      onChange={(e) => setBranding(prev => ({ ...prev, submitButtonText: e.target.value }))}
                      placeholder="Submit Onboarding Information"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="success-heading">Success Heading</Label>
                    <Input
                      id="success-heading"
                      value={branding.successHeading}
                      onChange={(e) => setBranding(prev => ({ ...prev, successHeading: e.target.value }))}
                      placeholder="Onboarding Information Submitted!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="success-description">Success Description</Label>
                    <Textarea
                      id="success-description"
                      value={branding.successDescription}
                      onChange={(e) => setBranding(prev => ({ ...prev, successDescription: e.target.value }))}
                      placeholder="Thank you for completing your onboarding form..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Preview</Label>
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${lightenColor(branding.primaryColor, 200)} 0%, ${lightenColor(branding.primaryColor, 180)} 100%)`
                  }}
                >
                  <div className="bg-white border-b px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {branding.logoUrl && (
                        <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                      )}
                      {branding.companyName && (
                        <span className="text-lg font-semibold text-slate-800">{branding.companyName}</span>
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div
                          className="p-1.5 rounded-full"
                          style={{ backgroundColor: lightenColor(branding.primaryColor, 200) }}
                        >
                          <User className="h-4 w-4" style={{ color: branding.primaryColor }} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{branding.welcomeHeading || 'Welcome to the Team!'}</h3>
                      </div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto line-clamp-2">{branding.welcomeDescription}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="bg-white rounded-lg border p-4 space-y-3">
                      <div className="h-3 bg-slate-100 rounded w-24" />
                      <div className="h-8 bg-slate-50 rounded border" />
                      <div className="h-3 bg-slate-100 rounded w-32" />
                      <div className="h-8 bg-slate-50 rounded border" />
                      <button
                        className="w-full py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: branding.primaryColor }}
                        disabled
                      >
                        {branding.submitButtonText || 'Submit Onboarding Information'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveConfiguration}
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>)}

        {activeEditorTab === "fields" && (<div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingField(null);
                  setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [] });
                }}
                data-testid="button-add-field"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
                <DialogDescription>
                  {editingField ? 'Modify the field details' : 'Add a new custom field to the onboarding form'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="field-label">Field Label *</Label>
                  <Input
                    id="field-label"
                    value={fieldForm.label || ''}
                    onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                    placeholder="e.g., Department Preference"
                    data-testid="input-field-label"
                  />
                </div>
                
                <div>
                  <Label htmlFor="field-type">Field Type</Label>
                  <Select 
                    value={fieldForm.type} 
                    onValueChange={(value) => setFieldForm({ ...fieldForm, type: value as FormField['type'] })}
                  >
                    <SelectTrigger data-testid="select-field-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Input</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                      <SelectItem value="textarea">Multi-line Text</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Dropdown Select</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="field-placeholder">Placeholder Text</Label>
                  <Input
                    id="field-placeholder"
                    value={fieldForm.placeholder || ''}
                    onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                    placeholder="e.g., Enter your preference..."
                    data-testid="input-field-placeholder"
                  />
                </div>
                
                {fieldForm.type === 'select' && (
                  <div>
                    <Label htmlFor="field-options">Options (one per line)</Label>
                    <Textarea
                      id="field-options"
                      value={fieldForm.options?.join('\n') || ''}
                      onChange={(e) => setFieldForm({ 
                        ...fieldForm, 
                        options: e.target.value.split('\n')
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                        }
                      }}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      rows={5}
                      data-testid="textarea-field-options"
                    />
                  </div>
                )}

                {fieldForm.type === 'file' && (
                  <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <div>
                      <Label className="text-sm font-medium">Downloadable Template (Optional)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a form template (e.g., W-9, W-8BEN) that new hires can download, fill out, and re-upload.
                      </p>
                      
                      {fieldForm.templateFileUrl ? (
                        <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-background">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{fieldForm.templateFileName || 'Template file'}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFieldForm(prev => ({ ...prev, templateFileUrl: '', templateFileName: '' }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                              onChange={handleTemplateUpload}
                              disabled={uploadingTemplate}
                            />
                            <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                              {uploadingTemplate ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4" />
                                  Click to upload template file
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Accepted file types: PDF, DOC, DOCX, JPG, PNG
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="field-required"
                    checked={fieldForm.required || false}
                    onCheckedChange={(checked) => setFieldForm({ ...fieldForm, required: checked })}
                    data-testid="switch-field-required"
                  />
                  <Label htmlFor="field-required">Required Field</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={editingField ? handleUpdateField : handleAddField}
                    disabled={!fieldForm.label}
                    data-testid="button-save-field"
                  >
                    {editingField ? 'Update Field' : 'Add Field'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsFieldModalOpen(false);
                      setEditingField(null);
                      setFieldForm({ label: '', type: 'text', placeholder: '', required: false, options: [], templateFileUrl: '', templateFileName: '' });
                    }}
                    data-testid="button-cancel-field"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleResetToDefaults}
            data-testid="button-reset-defaults"
          >
            Reset to Defaults
          </Button>
        </div>
        
        <Button 
          onClick={handleSaveConfiguration}
          disabled={saveConfigMutation.isPending}
          data-testid="button-save-configuration"
        >
          {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      {/* Form Fields List */}
      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
          <CardDescription>
            Drag and drop to reorder fields. The form will display fields in this order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="form-fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {fields
                    .sort((a, b) => a.order - b.order)
                    .map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {getFieldIcon(field.type)}
                                <span className="font-medium">{field.label}</span>
                                {field.required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                                {field.type === 'file' && field.templateFileUrl && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Download className="h-3 w-3" />
                                    Has Template
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge className={getFieldBadgeColor(field.type)}>
                                {field.type.replace('_', ' ')}
                              </Badge>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField(field)}
                                data-testid={`button-edit-field-${field.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              
                              {field.id.startsWith('custom_') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteField(field.id)}
                                  data-testid={`button-delete-field-${field.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>
        </div>)}
      </div>
    </div>
  );
}