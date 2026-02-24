import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Globe, Calendar, User, Building2, Tag, Folder, Users, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ClientForm from "@/components/forms/client-form";
import ClientContacts from "@/components/client-contacts";
import ContactCardField, { ContactCardEntry } from "@/components/contact-card-field";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Client, CustomFieldFolder, CustomField } from "@shared/schema";

export default function ClientDetail() {
  const [match, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clientId = params?.id;

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });


  const { data: customFieldFolders = [] } = useQuery<CustomFieldFolder[]>({
    queryKey: ["/api/custom-field-folders"],
    enabled: !!clientId,
  });

  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
    enabled: !!clientId,
  });

  const [editingFieldValues, setEditingFieldValues] = useState<Record<string, any>>({});
  const [isSavingFields, setIsSavingFields] = useState(false);

  const updateCustomFieldsMutation = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      await apiRequest("PUT", `/api/clients/${clientId}`, {
        customFieldValues: values
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      toast({
        title: "Saved",
        variant: "default",
        description: "Custom field values have been saved.",
      });
      setIsSavingFields(false);
      setEditingFieldValues({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save custom field values.",
        variant: "destructive",
      });
      setIsSavingFields(false);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
        variant: "default",
        description: "The client has been successfully deleted.",
      });
      setLocation("/clients");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClient = () => {
    if (client && confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClientMutation.mutate(client.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const navigationItems = [
    { id: "overview", label: "Overview", icon: User },
    { id: "contacts", label: "Contacts", icon: Users },
    // Add custom field folders dynamically
    ...customFieldFolders.map((folder) => ({
      id: `folder-${folder.id}`,
      label: folder.name,
      icon: Folder,
      isCustomField: true,
      folder: folder
    }))
  ];

  function renderOverviewContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Phone</p>
                  <p className="text-sm text-slate-600">{client?.phone || "Not provided"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-600">{client?.email}</p>
                </div>
              </div>
              
              {client?.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Company</p>
                    <p className="text-sm text-slate-600">{client.company}</p>
                  </div>
                </div>
              )}
              
              {client?.clientVertical && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Industry</p>
                    <p className="text-sm text-slate-600">{client.clientVertical}</p>
                  </div>
                </div>
              )}
              
              {client?.contactOwner && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Contact Owner</p>
                    <p className="text-sm text-slate-600">{client.contactOwner}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Status</p>
                <Badge className={getStatusColor(client?.status || "")}>
                  {client?.status}
                </Badge>
              </div>
              
              {client?.clientVertical && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Client Vertical</p>
                  <p className="text-sm text-slate-600">{client.clientVertical}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Created</p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  {client?.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy') : 'N/A'}
                </div>
              </div>
              
              {client?.lastActivity && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Last Activity</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(client.lastActivity), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
              
              {client?.tags && client.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {client.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  function renderCustomFieldFolderContent(folder?: CustomFieldFolder) {
    if (!folder) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Folder not found.</p>
          </CardContent>
        </Card>
      );
    }

    const folderFields = customFields
      .filter(f => f.folderId === folder.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const clientFieldValues = client?.customFieldValues as Record<string, any> || {};
    
    const getFieldValue = (fieldId: string) => {
      if (editingFieldValues[fieldId] !== undefined) {
        return editingFieldValues[fieldId];
      }
      return clientFieldValues[fieldId] ?? "";
    };

    const setFieldValue = (fieldId: string, value: any) => {
      setEditingFieldValues(prev => ({
        ...prev,
        [fieldId]: value
      }));
    };

    const saveFieldValues = () => {
      setIsSavingFields(true);
      const mergedValues = {
        ...clientFieldValues,
        ...editingFieldValues
      };
      updateCustomFieldsMutation.mutate(mergedValues);
    };

    const hasChanges = Object.keys(editingFieldValues).length > 0;

    const renderFieldInput = (field: CustomField) => {
      const value = getFieldValue(field.id);
      
      switch (field.type) {
        case "text":
          return (
            <Input
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          );
        case "email":
          return (
            <Input
              type="email"
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder="email@example.com"
            />
          );
        case "phone":
          return (
            <Input
              type="tel"
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder="(555) 123-4567"
            />
          );
        case "url":
          return (
            <Input
              type="url"
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder="https://example.com"
            />
          );
        case "number":
          return (
            <Input
              type="number"
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder="0"
            />
          );
        case "currency":
          return (
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder="0.00"
            />
          );
        case "date":
          return (
            <Input
              type="date"
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
            />
          );
        case "multiline":
          return (
            <Textarea
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              rows={3}
            />
          );
        case "dropdown":
          return (
            <Select value={value} onValueChange={(v) => setFieldValue(field.id, v)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case "dropdown_multiple":
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              {(field.options || []).map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFieldValue(field.id, [...selectedValues, option]);
                      } else {
                        setFieldValue(field.id, selectedValues.filter((v: string) => v !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          );
        case "checkbox":
          return (
            <div className="flex items-center space-x-2">
              <Switch
                checked={value === true || value === "true"}
                onCheckedChange={(checked) => setFieldValue(field.id, checked)}
              />
              <Label>{value ? "Yes" : "No"}</Label>
            </div>
          );
        case "radio":
          return (
            <RadioGroup value={value} onValueChange={(v) => setFieldValue(field.id, v)}>
              {(field.options || []).map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          );
        case "contact_card":
          return (
            <ContactCardField
              value={Array.isArray(value) ? value : []}
              onChange={(v) => setFieldValue(field.id, v)}
              fieldName={field.name}
              maxContacts={10}
            />
          );
        default:
          return (
            <Input
              value={value}
              onChange={(e) => setFieldValue(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          );
      }
    };

    if (folderFields.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-[#00C9C6]" />
              {folder.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Fields Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add custom fields to this folder in Settings &gt; Custom Fields.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-[#00C9C6]" />
            {folder.name}
          </CardTitle>
          {hasChanges && (
            <Button
              onClick={saveFieldValues}
              disabled={isSavingFields}
              size="sm"
              className="bg-[#00C9C6] hover:bg-[#00C9C6]/90"
            >
              {isSavingFields ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {folderFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {field.name}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderMainContent() {
    switch (activeSection) {
      case "overview":
        return renderOverviewContent();
      case "contacts":
        return clientId ? <ClientContacts clientId={clientId} /> : null;
      default:
        // Handle custom field folders
        if (activeSection.startsWith("folder-")) {
          const folderId = activeSection.replace("folder-", "");
          const folder = customFieldFolders.find(f => f.id === folderId);
          return renderCustomFieldFolderContent(folder);
        }
        return renderOverviewContent();
    }
  }

  if (!match) {
    return null;
  }

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Client Not Found</h2>
            <p className="text-slate-600">The client you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.company || client.name}</h1>
            {client.company && client.name && (
              <p className="text-slate-600">Contact: {client.name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
              </DialogHeader>
              <ClientForm
                client={client}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                  setIsEditDialogOpen(false);
                  toast({
                    title: "Client updated",
                    variant: "default",
                    description: "The client has been successfully updated.",
                  });
                }}
              />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="destructive" 
            onClick={handleDeleteClient}
            disabled={deleteClientMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteClientMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex gap-6">
        {/* Left Navigation Sidebar */}
        <div className="w-64 space-y-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Navigation</h3>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md text-sm transition-colors ${
                        isActive 
                          ? "bg-[#46a1a0] text-white" 
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {('count' in item) && item.count !== undefined && (
                        <Badge 
                          variant="secondary" 
                          className={`${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"} text-xs px-2 py-0`}
                        >
                          {('count' in item) ? item.count : ''}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}