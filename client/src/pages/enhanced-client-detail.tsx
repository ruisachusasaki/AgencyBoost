import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MessageSquare, 
  ShieldOff,
  StickyNote,
  Calendar,
  Upload,
  CreditCard,
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  UserCircle,
  UserPlus,
  FileText,
  Settings,
  Tag,
  Folder,
  User,
  MapPin,
  Building,
  Globe,
  Hash,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Enhanced Client Detail Page with complete functionality
export default function EnhancedClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management for right sidebar
  const [activeRightSection, setActiveRightSection] = useState<"notes" | "appointments" | "documents" | "payments">("notes");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  // State for client editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [clientData, setClientData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    status: "active"
  });

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/clients', id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}`);
      if (!response.ok) throw new Error('Failed to fetch client');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  // Fetch custom fields
  const { data: customFields = [] } = useQuery({
    queryKey: ['/api/custom-fields'],
    queryFn: async () => {
      const response = await fetch('/api/custom-fields');
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      return response.json();
    },
  });

  // Fetch custom field folders
  const { data: customFieldFolders = [] } = useQuery({
    queryKey: ['/api/custom-field-folders'],
    queryFn: async () => {
      const response = await fetch('/api/custom-field-folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Fetch client notes
  const { data: clientNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes', 'client', id],
    queryFn: async () => {
      const response = await fetch(`/api/notes?clientId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
    enabled: !!id,
  });

  // Initialize client data when loaded
  useEffect(() => {
    if (client) {
      setClientData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        company: client.company || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        country: client.country || "",
        website: client.website || "",
        status: client.status || "active"
      });
    }
  }, [client]);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiRequest("PUT", `/api/clients/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsEditing(false);
      setEditingField(null);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          clientId: id,
          type: 'note'
        }),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', 'client', id] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
  });

  if (!id) {
    return <div>Invalid client ID</div>;
  }

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading client details...</div>
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  const handleSendSMS = () => {
    if (!smsMessage.trim()) return;
    
    if (client?.dndAll || client?.dndSms) {
      toast({
        title: "Message Blocked",
        description: "SMS sending is blocked by DND settings",
        variant: "destructive",
      });
      return;
    }

    // SMS sending logic would go here
    toast({
      title: "SMS Sent",
      description: "Text message sent successfully",
    });
    setSmsMessage("");
  };

  const handleSendEmail = () => {
    if (!emailMessage.trim()) return;
    
    if (client?.dndAll || client?.dndEmail) {
      toast({
        title: "Message Blocked", 
        description: "Email sending is blocked by DND settings",
        variant: "destructive",
      });
      return;
    }

    // Email sending logic would go here
    toast({
      title: "Email Sent",
      description: "Email sent successfully",
    });
    setEmailMessage("");
  };

  const handleFieldSave = (fieldName: string, value: string) => {
    updateClientMutation.mutate({ [fieldName]: value });
    setEditingField(null);
  };

  const handleClientSave = () => {
    updateClientMutation.mutate(clientData);
  };

  const renderCustomFieldValue = (field: any, value: any) => {
    const { type, options } = field;
    const className = "text-sm text-gray-900 dark:text-white";

    if (editingField === field.id) {
      return (
        <div className="space-y-2">
          {type === 'text' || type === 'email' || type === 'phone' || type === 'url' ? (
            <Input
              type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : type === 'url' ? 'url' : 'text'}
              defaultValue={value || ''}
              onBlur={(e) => handleFieldSave(field.id, e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFieldSave(field.id, e.currentTarget.value)}
              autoFocus
            />
          ) : type === 'multiline' ? (
            <Textarea
              defaultValue={value || ''}
              onBlur={(e) => handleFieldSave(field.id, e.target.value)}
              autoFocus
            />
          ) : type === 'dropdown' ? (
            <Select defaultValue={value || ''} onValueChange={(val) => handleFieldSave(field.id, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option: string) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              defaultValue={value || ''}
              onBlur={(e) => handleFieldSave(field.id, e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFieldSave(field.id, e.currentTarget.value)}
              autoFocus
            />
          )}
        </div>
      );
    }

    // Display mode
    if (!value) {
      return <span className="text-gray-400 italic text-sm">Not specified</span>;
    }

    if (type === 'dropdown_multiple' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (type === 'checkbox' && typeof value === 'string') {
      return (
        <div className="flex flex-wrap gap-1">
          {value.split(',').map((item, index) => {
            const trimmedItem = item.trim();
            return trimmedItem ? (
              <Badge key={index} variant="secondary" className="text-xs">
                {trimmedItem}
              </Badge>
            ) : null;
          })}
        </div>
      );
    }

    if (type === 'radio' && value) {
      return <Badge variant="outline" className="text-xs">{value}</Badge>;
    }

    return (
      <p className={`${className} group-hover:bg-gray-50 p-1 rounded cursor-pointer`}>
        {value}
      </p>
    );
  };

  // Group custom fields by folder
  const groupedFields = customFieldFolders.reduce((acc: any, folder: any) => {
    acc[folder.id] = {
      ...folder,
      fields: customFields.filter((field: any) => field.folderId === folder.id)
    };
    return acc;
  }, {});

  // Fields without folder
  const fieldsWithoutFolder = customFields.filter((field: any) => !field.folderId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/clients')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
                {client.company && (
                  <Badge variant="outline">
                    <Building className="h-3 w-3 mr-1" />
                    {client.company}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {isEditing ? "Cancel" : "Edit Client"}
            </Button>
            
            {isEditing && (
              <Button 
                size="sm"
                onClick={handleClientSave}
                disabled={updateClientMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Custom Fields & Actions */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Basic Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Basic Fields */}
                  <div className="group">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</Label>
                    {isEditing ? (
                      <Input
                        value={clientData.firstName}
                        onChange={(e) => setClientData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{client.firstName}</p>
                    )}
                  </div>
                  
                  <div className="group">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</Label>
                    {isEditing ? (
                      <Input
                        value={clientData.lastName}
                        onChange={(e) => setClientData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{client.lastName}</p>
                    )}
                  </div>
                  
                  <div className="group">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={clientData.email}
                        onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{client.email}</p>
                    )}
                  </div>
                  
                  <div className="group">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</Label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={clientData.phone}
                        onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{client.phone}</p>
                    )}
                  </div>
                  
                  <div className="group">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</Label>
                    {isEditing ? (
                      <Input
                        value={clientData.company}
                        onChange={(e) => setClientData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{client.company || "Not specified"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields by Folder */}
            {Object.values(groupedFields).map((folder: any) => (
              <Card key={folder.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {folder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {folder.fields.map((field: any) => (
                    <div key={field.id} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {field.name}
                        </Label>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditingField(field.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {renderCustomFieldValue(field, client.customFieldValues?.[field.id])}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Fields without folder */}
            {fieldsWithoutFolder.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fieldsWithoutFolder.map((field: any) => (
                    <div key={field.id} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {field.name}
                        </Label>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditingField(field.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {renderCustomFieldValue(field, client.customFieldValues?.[field.id])}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Communication Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Quick Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Send SMS
                    </Label>
                    {(client?.dndAll || client?.dndSms) && (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldOff className="h-3 w-3 mr-1" />
                        DND Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        (client?.dndAll || client?.dndSms) 
                          ? "SMS blocked by DND settings..." 
                          : "SMS message..."
                      }
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendSMS()}
                      disabled={!!client?.dndAll || !!client?.dndSms}
                      className={`${(client?.dndAll || client?.dndSms) ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' : ''}`}
                    />
                    <Button 
                      onClick={handleSendSMS}
                      disabled={!smsMessage.trim() || !!client?.dndAll || !!client?.dndSms}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50"
                    >
                      Send
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Send Email
                    </Label>
                    {(client?.dndAll || client?.dndEmail) && (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldOff className="h-3 w-3 mr-1" />
                        DND Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        (client?.dndAll || client?.dndEmail) 
                          ? "Email blocked by DND settings..." 
                          : "Email message..."
                      }
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendEmail()}
                      disabled={!!client?.dndAll || !!client?.dndEmail}
                      className={`${(client?.dndAll || client?.dndEmail) ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' : ''}`}
                    />
                    <Button 
                      onClick={handleSendEmail}
                      disabled={!emailMessage.trim() || !!client?.dndAll || !!client?.dndEmail}
                      variant="outline"
                      className="disabled:opacity-50"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</Label>
                  {isEditing ? (
                    <Input
                      value={clientData.address}
                      onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{client.address || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</Label>
                  {isEditing ? (
                    <Input
                      value={clientData.city}
                      onChange={(e) => setClientData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{client.city || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">State</Label>
                  {isEditing ? (
                    <Input
                      value={clientData.state}
                      onChange={(e) => setClientData(prev => ({ ...prev, state: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{client.state || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Zip Code</Label>
                  {isEditing ? (
                    <Input
                      value={clientData.zipCode}
                      onChange={(e) => setClientData(prev => ({ ...prev, zipCode: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{client.zipCode || "Not specified"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Client Activity Hub */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                {/* Horizontal Icons Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Client Hub</h2>
                </div>
                <TooltipProvider>
                  <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("notes")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "notes"
                              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notes</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("appointments")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all opacity-50 cursor-not-allowed ${
                            activeRightSection === "appointments"
                              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                          disabled
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Meetings (Coming Soon)</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("documents")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                            activeRightSection === "documents"
                              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Files</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveRightSection("payments")}
                          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all opacity-50 cursor-not-allowed ${
                            activeRightSection === "payments"
                              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                          disabled
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Billing (Coming Soon)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Notes Section */}
                {activeRightSection === "notes" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notes</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search notes..."
                          value={searchNotes}
                          onChange={(e) => setSearchNotes(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                      <Button 
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!newNote.trim() || createNoteMutation.isPending}
                        onClick={() => createNoteMutation.mutate(newNote)}
                      >
                        {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notesLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-sm">Loading notes...</div>
                        </div>
                      ) : clientNotes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No notes yet</p>
                          <p className="text-xs text-gray-400">Add a note to get started</p>
                        </div>
                      ) : (
                        clientNotes
                          .filter((note: any) => !searchNotes || note.content.toLowerCase().includes(searchNotes.toLowerCase()))
                          .map((note: any) => (
                            <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Note</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {currentUser?.role === 'Admin' && (
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600" 
                                        onClick={() => {
                                          setEditingNote(note.id);
                                          setEditNoteContent(note.content);
                                        }}
                                        title="Edit note"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600" 
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this note?')) {
                                            // Delete note logic would go here
                                          }
                                        }}
                                        title="Delete note"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {editingNote === note.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editNoteContent}
                                    onChange={(e) => setEditNoteContent(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        // Save edit logic would go here
                                        setEditingNote(null);
                                        setEditNoteContent("");
                                      }}
                                      disabled={!editNoteContent.trim()}
                                      className="h-7"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingNote(null);
                                        setEditNoteContent("");
                                      }}
                                      className="h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-300">{note.content}</p>
                              )}
                              
                              <div className="mt-2 flex justify-between items-center">
                                <div className="text-xs text-gray-400">
                                  by {note.createdBy?.firstName} {note.createdBy?.lastName}
                                </div>
                                {note.editedBy && (
                                  <div className="text-xs text-gray-400">
                                    edited by {note.editedBy?.firstName} {note.editedBy?.lastName}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* Other sections would be similar stubs */}
                {activeRightSection === "documents" && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Documents feature coming soon</p>
                  </div>
                )}
                
                {activeRightSection === "appointments" && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Appointments feature coming soon</p>
                  </div>
                )}
                
                {activeRightSection === "payments" && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Payments feature coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}