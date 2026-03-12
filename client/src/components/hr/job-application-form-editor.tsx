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
  Link as LinkIcon,
  DollarSign,
  User,
  Briefcase,
  Copy,
  ExternalLink,
  Paintbrush,
  Image as ImageIcon,
  X,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JobApplicationBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  pageHeading: string;
  pageDescription: string;
  applyButtonText: string;
  successHeading: string;
  successDescription: string;
  whyWorkHeading: string;
  benefit1Title: string;
  benefit1Description: string;
  benefit2Title: string;
  benefit2Description: string;
  benefit3Title: string;
  benefit3Description: string;
}

const defaultBranding: JobApplicationBranding = {
  companyName: '',
  logoUrl: '',
  primaryColor: '#2563eb',
  pageHeading: 'Join Our Team',
  pageDescription: "We're looking for talented individuals to help us build the future. Explore our open positions and become part of something amazing.",
  applyButtonText: 'Apply Now',
  successHeading: 'Application Submitted Successfully!',
  successDescription: 'Thank you for your interest. We\'ll review your application and get back to you soon.',
  whyWorkHeading: 'Why Work With Us?',
  benefit1Title: 'Growth Opportunities',
  benefit1Description: 'We invest in our people with continuous learning and career development programs.',
  benefit2Title: 'Great Benefits',
  benefit2Description: 'Comprehensive health coverage, flexible time off, and competitive compensation packages.',
  benefit3Title: 'Great Culture',
  benefit3Description: 'Join a collaborative team that values innovation, creativity, and work-life balance.',
};

const colorPresets = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Teal', value: '#00C9C6' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Slate', value: '#475569' },
];

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'url' | 'number' | 'select' | 'job_selection';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

const defaultFields: FormField[] = [
  {
    id: 'job_opening',
    label: 'Position Applied For',
    type: 'job_selection',
    required: true,
    order: 0
  },
  {
    id: 'full_name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
    order: 1
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your.email@example.com',
    required: true,
    order: 2
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: false,
    order: 3
  },
  {
    id: 'resume_url',
    label: 'Resume/CV URL',
    type: 'url',
    placeholder: 'https://drive.google.com/...',
    required: true,
    order: 4
  },
  {
    id: 'cover_letter_url',
    label: 'Cover Letter URL',
    type: 'url',
    placeholder: 'https://...',
    required: false,
    order: 5
  },
  {
    id: 'portfolio_url',
    label: 'Portfolio/Website URL',
    type: 'url',
    placeholder: 'https://...',
    required: false,
    order: 6
  },
  {
    id: 'experience_level',
    label: 'Experience Level',
    type: 'select',
    required: true,
    options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive Level'],
    order: 7
  },
  {
    id: 'salary_expectation',
    label: 'Salary Expectation (Annual USD)',
    type: 'number',
    placeholder: '75000',
    required: false,
    order: 8
  },
  {
    id: 'additional_info',
    label: 'Additional Information',
    type: 'textarea',
    placeholder: 'Tell us why you\'re interested in this position...',
    required: false,
    order: 9
  }
];

export default function JobApplicationFormEditor() {
  const { data: configData, isLoading } = useQuery<{ fields: FormField[]; branding?: JobApplicationBranding }>({
    queryKey: ['/api/job-application-form-config'],
    retry: false,
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [branding, setBranding] = useState<JobApplicationBranding>(defaultBranding);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"fields" | "branding">("fields");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (configData?.fields) {
      setFields(configData.fields);
    }
    if (configData?.branding) {
      setBranding({ ...defaultBranding, ...configData.branding });
    }
  }, [configData]);

  const saveConfigMutation = useMutation({
    mutationFn: async (payload: { fields: FormField[]; branding: JobApplicationBranding }) => {
      return await apiRequest('PUT', '/api/job-application-form-config', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-application-form-config'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Form configuration saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save form configuration",
        variant: "destructive",
      });
    },
  });

  const handleSaveConfiguration = () => {
    saveConfigMutation.mutate({ fields, branding });
  };

  useEffect(() => {
    if (fields.length > 0 && configData?.fields) {
      const hasFieldChanges = JSON.stringify(fields) !== JSON.stringify(configData.fields);
      const hasBrandingChanges = JSON.stringify(branding) !== JSON.stringify(configData?.branding ? { ...defaultBranding, ...configData.branding } : defaultBranding);
      if (hasFieldChanges || hasBrandingChanges) {
        const timeoutId = setTimeout(() => {
          saveConfigMutation.mutate({ fields, branding });
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [fields, branding]);

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
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const lightenColor = (hex: string, amount: number): string => {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'url': return <LinkIcon className="h-4 w-4" />;
      case 'number': return <DollarSign className="h-4 w-4" />;
      case 'select': return <User className="h-4 w-4" />;
      case 'job_selection': return <Briefcase className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setIsDialogOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setIsDialogOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (fieldId === 'job_opening') {
      toast({
        title: "Cannot Delete",
        description: "The job position selection field is required and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this field?")) {
      setFields(prev => prev.filter(field => field.id !== fieldId));
      toast({
        title: "Success",
        variant: "default",
        description: "Field deleted successfully",
      });
    }
  };

  const handleSaveField = (fieldData: Partial<FormField>) => {
    const cleanedData = {
      ...fieldData,
      options: fieldData.options?.filter(opt => opt.trim())
    };
    if (editingField) {
      setFields(prev => prev.map(field => 
        field.id === editingField.id 
          ? { ...field, ...cleanedData }
          : field
      ));
    } else {
      const newField: FormField = {
        id: `field_${Date.now()}`,
        label: cleanedData.label || '',
        type: cleanedData.type || 'text',
        placeholder: cleanedData.placeholder || '',
        required: cleanedData.required || false,
        options: cleanedData.options || [],
        order: fields.length
      };
      setFields(prev => [...prev, newField]);
    }
    
    setIsDialogOpen(false);
    toast({
      title: "Success",
      variant: "default",
      description: `Field ${editingField ? 'updated' : 'added'} successfully`,
    });
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedFields = items.map((field, index) => ({
      ...field,
      order: index
    }));

    setFields(prev => {
      const fieldMap = new Map(updatedFields.map(field => [field.id, field]));
      return prev.map(field => fieldMap.get(field.id) || field);
    });

    toast({
      title: "Success",
      variant: "default", 
      description: "Field order updated successfully",
    });
  };

  const handleCopyUrl = () => {
    const careersUrl = `${window.location.origin}/careers`;
    navigator.clipboard.writeText(careersUrl);
    toast({
      title: "Success",
      variant: "default",
      description: "Careers URL copied to clipboard",
    });
  };

  const careersUrl = `${window.location.origin}/careers`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Job Application Form Configuration</h3>
          <p className="text-muted-foreground">
            Customize the fields and branding shown to job applicants on the careers page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveConfiguration} disabled={saveConfigMutation.isPending} variant="default">
            {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Configuration
          </Button>
          {activeEditorTab === "fields" && (
            <Button onClick={handleAddField} data-testid="button-add-field" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Public Application Form URL
          </CardTitle>
          <CardDescription>
            Share this URL with potential applicants or post it on your website. This page displays all open positions and the application form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1 font-mono text-sm break-all">
              {careersUrl}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyUrl}
                data-testid="button-copy-url"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(careersUrl, '_blank')}
                data-testid="button-open-url"
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
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeEditorTab === "fields"
                ? "text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            style={activeEditorTab === "fields" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
          >
            <FileText className="h-3.5 w-3.5" />
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

        {activeEditorTab === "branding" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paintbrush className="h-5 w-5" />
                  Branding & Style
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your public careers page. Changes apply to the page applicants see when browsing jobs and submitting applications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Company Logo</Label>
                  <p className="text-sm text-muted-foreground">Upload your company logo to display at the top of the careers page. Recommended: PNG or SVG, at least 200px wide.</p>
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

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Primary Color</Label>
                  <p className="text-sm text-muted-foreground">This color is used for the background gradient, buttons, icons, and accents on the careers page.</p>
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

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Page Text</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-heading">Page Heading</Label>
                      <Input
                        id="page-heading"
                        value={branding.pageHeading}
                        onChange={(e) => setBranding(prev => ({ ...prev, pageHeading: e.target.value }))}
                        placeholder="Join Our Team"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="page-description">Page Description</Label>
                      <Textarea
                        id="page-description"
                        value={branding.pageDescription}
                        onChange={(e) => setBranding(prev => ({ ...prev, pageDescription: e.target.value }))}
                        placeholder="We're looking for talented individuals..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apply-button-text">Apply Button Text</Label>
                      <Input
                        id="apply-button-text"
                        value={branding.applyButtonText}
                        onChange={(e) => setBranding(prev => ({ ...prev, applyButtonText: e.target.value }))}
                        placeholder="Apply Now"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="success-heading">Success Heading</Label>
                      <Input
                        id="success-heading"
                        value={branding.successHeading}
                        onChange={(e) => setBranding(prev => ({ ...prev, successHeading: e.target.value }))}
                        placeholder="Application Submitted Successfully!"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="success-description">Success Description</Label>
                      <Textarea
                        id="success-description"
                        value={branding.successDescription}
                        onChange={(e) => setBranding(prev => ({ ...prev, successDescription: e.target.value }))}
                        placeholder="Thank you for your interest..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">"Why Work With Us" Section</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="why-work-heading">Section Heading</Label>
                      <Input
                        id="why-work-heading"
                        value={branding.whyWorkHeading}
                        onChange={(e) => setBranding(prev => ({ ...prev, whyWorkHeading: e.target.value }))}
                        placeholder="Why Work With Us?"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 p-4 border rounded-lg">
                        <Label>Benefit 1 Title</Label>
                        <Input
                          value={branding.benefit1Title}
                          onChange={(e) => setBranding(prev => ({ ...prev, benefit1Title: e.target.value }))}
                          placeholder="Growth Opportunities"
                        />
                        <Label>Description</Label>
                        <Textarea
                          value={branding.benefit1Description}
                          onChange={(e) => setBranding(prev => ({ ...prev, benefit1Description: e.target.value }))}
                          placeholder="We invest in our people..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2 p-4 border rounded-lg">
                        <Label>Benefit 2 Title</Label>
                        <Input
                          value={branding.benefit2Title}
                          onChange={(e) => setBranding(prev => ({ ...prev, benefit2Title: e.target.value }))}
                          placeholder="Great Benefits"
                        />
                        <Label>Description</Label>
                        <Textarea
                          value={branding.benefit2Description}
                          onChange={(e) => setBranding(prev => ({ ...prev, benefit2Description: e.target.value }))}
                          placeholder="Comprehensive health coverage..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2 p-4 border rounded-lg">
                        <Label>Benefit 3 Title</Label>
                        <Input
                          value={branding.benefit3Title}
                          onChange={(e) => setBranding(prev => ({ ...prev, benefit3Title: e.target.value }))}
                          placeholder="Great Culture"
                        />
                        <Label>Description</Label>
                        <Textarea
                          value={branding.benefit3Description}
                          onChange={(e) => setBranding(prev => ({ ...prev, benefit3Description: e.target.value }))}
                          placeholder="Join a collaborative team..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>

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
                        <h3 className="text-lg font-bold text-slate-900">{branding.pageHeading || 'Join Our Team'}</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto line-clamp-2 mt-1">{branding.pageDescription}</p>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      <div className="bg-white rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="h-3 bg-slate-200 rounded w-32 mb-1" />
                            <div className="h-2 bg-slate-100 rounded w-20" />
                          </div>
                          <button
                            className="px-3 py-1.5 rounded-md text-white text-xs font-medium"
                            style={{ backgroundColor: branding.primaryColor }}
                            disabled
                          >
                            {branding.applyButtonText || 'Apply Now'}
                          </button>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="h-3 bg-slate-200 rounded w-28 mb-1" />
                            <div className="h-2 bg-slate-100 rounded w-16" />
                          </div>
                          <button
                            className="px-3 py-1.5 rounded-md text-white text-xs font-medium"
                            style={{ backgroundColor: branding.primaryColor }}
                            disabled
                          >
                            {branding.applyButtonText || 'Apply Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeEditorTab === "fields" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Form Fields
              </CardTitle>
              <CardDescription>
                The first field (Position Applied For) is automatically populated with open job positions and cannot be removed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="form-fields">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {sortedFields.map((field, index) => (
                        <Draggable 
                          key={field.id} 
                          draggableId={field.id} 
                          index={index}
                          isDragDisabled={field.id === 'job_opening'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                snapshot.isDragging 
                                  ? 'bg-blue-50 border-blue-300 shadow-lg' 
                                  : 'bg-gray-50/50 hover:bg-gray-100/50'
                              } ${field.id === 'job_opening' ? 'opacity-75' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  {...provided.dragHandleProps}
                                  className={`${
                                    field.id === 'job_opening' 
                                      ? 'cursor-not-allowed text-muted-foreground/50' 
                                      : 'cursor-move text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                {getFieldIcon(field.type)}
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {field.label}
                                    {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                    {field.id === 'job_opening' && <Badge variant="default" className="text-xs">System Field</Badge>}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {field.type} {field.placeholder ? `\u2022 ${field.placeholder}` : '\u2022 No placeholder'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditField(field)}
                                  data-testid={`button-edit-field-${field.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                {field.id !== 'job_opening' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteField(field.id)}
                                    data-testid={`button-delete-field-${field.id}`}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Field' : 'Add Field'}
            </DialogTitle>
            <DialogDescription>
              Configure the field properties for the job application form.
            </DialogDescription>
          </DialogHeader>
          <FieldEditor
            field={editingField}
            onSave={handleSaveField}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FieldEditorProps {
  field: FormField | null;
  onSave: (data: Partial<FormField>) => void;
  onCancel: () => void;
}

function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const [formData, setFormData] = useState<Partial<FormField>>({
    label: field?.label || '',
    type: field?.type || 'text',
    placeholder: field?.placeholder || '',
    required: field?.required || false,
    options: field?.options || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label?.trim()) {
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Field Label *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          placeholder="Enter field label"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Field Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as FormField['type'] }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Input</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="textarea">Textarea</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="select">Dropdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={formData.placeholder}
          onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
          placeholder="Enter placeholder text"
        />
      </div>

      {formData.type === 'select' && (
        <div className="space-y-2">
          <Label>Options (one per line)</Label>
          <Textarea
            value={formData.options?.join('\n') || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              options: e.target.value.split('\n')
            }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
              }
            }}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            rows={5}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="required"
          checked={formData.required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {field ? 'Update Field' : 'Add Field'}
        </Button>
      </div>
    </form>
  );
}
