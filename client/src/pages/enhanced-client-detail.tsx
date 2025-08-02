import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Globe, Calendar, User, Building2, 
  Tag, ChevronDown, ChevronRight, GripVertical, Filter, MessageSquare, 
  FileText, CalendarDays, Upload, CreditCard, ExternalLink, PhoneCall,
  MessageCircle, Plus, Search, X, CheckCircle
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Client, Project, Campaign, Task, Invoice, User as CRMUser } from "@shared/schema";

interface Section {
  id: string;
  name: string;
  isOpen: boolean;
  canReorder: boolean;
  fields?: any[];
}

const DEFAULT_SECTIONS: Section[] = [
  {
    id: "contact-details",
    name: "Contact Details",
    isOpen: true,
    canReorder: false,
  },
  {
    id: "services",
    name: "Services",
    isOpen: true,
    canReorder: true,
  },
  {
    id: "billing",
    name: "Billing",
    isOpen: true,
    canReorder: true,
  },
  {
    id: "resources",
    name: "Important Resources",
    isOpen: true,
    canReorder: true,
  },
];

export default function EnhancedClientDetail() {
  const [match, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [activeRightColumn, setActiveRightColumn] = useState<'notes' | 'tasks' | 'appointments' | 'documents' | 'payments'>('notes');
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [contactOwner, setContactOwner] = useState("");
  const [followers, setFollowers] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clientId = params?.id;

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    select: (data) => data.filter(p => p.clientId === clientId),
    enabled: !!clientId,
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    select: (data) => data.filter(c => c.clientId === clientId),
    enabled: !!clientId,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (data) => data.filter(t => t.clientId === clientId),
    enabled: !!clientId,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    select: (data) => data.filter(i => i.clientId === clientId),
    enabled: !!clientId,
  });

  // Mock users data - in real implementation this would come from API
  const mockUsers: CRMUser[] = [
    { id: "1", name: "John Smith", email: "john@agency.com", role: "admin", profileImage: null, createdAt: new Date() },
    { id: "2", name: "Sarah Johnson", email: "sarah@agency.com", role: "user", profileImage: null, createdAt: new Date() },
    { id: "3", name: "Mike Wilson", email: "mike@agency.com", role: "user", profileImage: null, createdAt: new Date() },
  ];

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
  };

  const addTag = () => {
    if (!newTag.trim() || !client) return;
    
    const currentTags = client.tags || [];
    if (currentTags.includes(newTag)) {
      toast({
        title: "Tag already exists",
        variant: "destructive",
      });
      return;
    }
    
    // Here would be API call to update client tags
    setNewTag("");
    toast({
      title: "Tag added successfully",
    });
  };

  const removeTag = (tagToRemove: string) => {
    // Here would be API call to remove tag
    toast({
      title: "Tag removed successfully",
    });
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    
    // Here would be API call to add note
    setNewNote("");
    toast({
      title: "Note added successfully",
    });
  };

  const callClient = () => {
    if (!client?.phone) return;
    // Here would be Twilio integration for calling
    toast({
      title: "Initiating call...",
      description: "Connecting through CRM phone system",
    });
  };

  const sendSMS = () => {
    if (!client?.phone) return;
    // Here would be SMS functionality
    toast({
      title: "SMS composer opened",
    });
  };

  const sendEmail = () => {
    if (!client?.email) return;
    // Here would be email functionality
    toast({
      title: "Email composer opened",
    });
  };

  if (!match) return null;

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => setLocation("/clients")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm">Clients</span>
          </Button>
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Client Not Found</h2>
              <p className="text-slate-600">The client you're looking for doesn't exist or has been deleted.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Button variant="ghost" onClick={() => setLocation("/clients")} className="mb-4 p-0 h-auto font-normal text-xs">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Clients
        </Button>

        {/* 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Client Fields */}
          <div className="space-y-4">
            {/* Profile Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Profile Image */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-200 transition-colors">
                      {client.profileImage ? (
                        <img src={client.profileImage} alt={client.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-teal-600" />
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-50">
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Name and Company */}
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
                    <p className="text-slate-600">{client.company || "No company specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Sections */}
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {section.canReorder && (
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      )}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-0 bg-transparent border-none flex items-center gap-2 hover:text-teal-600"
                      >
                        {section.isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <CardTitle className="text-sm font-medium">{section.name}</CardTitle>
                      </button>
                    </div>
                  </div>
                </CardHeader>
                
                {section.isOpen && (
                  <CardContent className="pt-0">
                    {section.id === "contact-details" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Position</p>
                            <p className="text-sm text-slate-600">{client.position || "Not specified"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Email</p>
                            <p className="text-sm text-slate-600">{client.email}</p>
                          </div>
                        </div>

                        {client.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">Phone Number</p>
                              <button
                                onClick={callClient}
                                className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              >
                                {formatPhoneNumber(client.phone)}
                              </button>
                            </div>
                          </div>
                        )}

                        {(client.address || client.city || client.state) && (
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">Address</p>
                              <div className="text-sm text-slate-600">
                                {client.address && <p>{client.address}</p>}
                                {client.address2 && <p>{client.address2}</p>}
                                {(client.city || client.state || client.zipCode) && (
                                  <p>{[client.city, client.state, client.zipCode].filter(Boolean).join(", ")}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {client.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">Website</p>
                              <a 
                                href={client.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                              >
                                {client.website}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Client Vertical</p>
                            <p className="text-sm text-slate-600">{client.clientVertical || "Not specified"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Contact Status</p>
                            <Badge className={client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {client.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Contact Source</p>
                            <p className="text-sm text-slate-600">{client.contactSource || "Not specified"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Tag className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Contact Type</p>
                            <p className="text-sm text-slate-600">{client.contactType || "client"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {section.id === "services" && (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500">Services configuration coming soon</p>
                      </div>
                    )}

                    {section.id === "billing" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">MRR</p>
                          <p className="text-sm text-slate-600">{client.mrr ? `$${client.mrr}` : "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Invoicing Contact</p>
                          <p className="text-sm text-slate-600">{client.invoicingContact || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Invoicing Email</p>
                          <p className="text-sm text-slate-600">{client.invoicingEmail || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Payment Terms</p>
                          <p className="text-sm text-slate-600">{client.paymentTerms || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Upside Bonus %</p>
                          <p className="text-sm text-slate-600">{client.upsideBonus ? `${client.upsideBonus}%` : "Not set"}</p>
                        </div>
                      </div>
                    )}

                    {section.id === "resources" && (
                      <div className="space-y-2">
                        {[
                          { label: "Client Brief", url: client.clientBrief },
                          { label: "Growth OS Dashboard", url: client.growthOsDashboard },
                          { label: "StoryBrand", url: client.storyBrand },
                          { label: "Style Guide", url: client.styleGuide },
                          { label: "Google Drive Folder", url: client.googleDriveFolder },
                          { label: "Testing Log", url: client.testingLog },
                          { label: "Cornerstone Blueprint", url: client.cornerstoneBlueprint },
                          { label: "CustomGPT", url: client.customGpt },
                        ].filter(resource => resource.url).map((resource, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{resource.label}</span>
                            <a 
                              href={resource.url!} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        ))}
                        {![client.clientBrief, client.growthOsDashboard, client.storyBrand, client.styleGuide, client.googleDriveFolder, client.testingLog, client.cornerstoneBlueprint, client.customGpt].some(Boolean) && (
                          <p className="text-sm text-slate-500 text-center py-2">No resources configured</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Actions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {client.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )) || <p className="text-sm text-slate-500">No tags</p>}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button size="sm" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* DND Section */}
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">DND Settings</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="dnd-all" checked={client.dndAll || false} />
                      <label htmlFor="dnd-all" className="text-sm text-slate-600">DND ALL channels</label>
                    </div>
                    <div className="text-xs text-slate-500 text-center py-1">OR</div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <Checkbox id="dnd-email" checked={client.dndEmail || false} />
                        <label htmlFor="dnd-email" className="text-sm text-slate-600">Emails</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-slate-400" />
                        <Checkbox id="dnd-sms" checked={client.dndSms || false} />
                        <label htmlFor="dnd-sms" className="text-sm text-slate-600">Text Messages</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PhoneCall className="h-4 w-4 text-slate-400" />
                        <Checkbox id="dnd-calls" checked={client.dndCalls || false} />
                        <label htmlFor="dnd-calls" className="text-sm text-slate-600">Calls & Voicemails</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.filter(c => c.status === 'active').length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">No active campaigns</p>
                ) : (
                  <div className="space-y-2">
                    {campaigns.filter(c => c.status === 'active').map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => setLocation(`/campaigns`)}
                        className="w-full text-left p-2 border rounded hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-slate-500">{campaign.type}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Activity & Communications */}
          <div className="space-y-4">
            {/* Contact Owner & Followers */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Client Owner</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-teal-600" />
                        </div>
                        <span className="text-sm text-slate-600">
                          {mockUsers.find(u => u.id === client.contactOwner)?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-900">Followers</p>
                      <div className="flex items-center gap-1 mt-1">
                        {followers.slice(0, 3).map((followerId, index) => (
                          <div key={index} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-600" />
                          </div>
                        ))}
                        {followers.length > 3 && (
                          <span className="text-xs text-slate-500">+{followers.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No activity recorded</p>
                </div>
              </CardContent>
            </Card>

            {/* Communication Tools */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Communications</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <Input placeholder="Type SMS message..." className="text-sm" />
                    </div>
                    <Button size="sm">Send</Button>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Mail className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <Input placeholder="Type email message..." className="text-sm" />
                    </div>
                    <Button size="sm">Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Notes, Tasks, Appointments, Documents, Payments */}
          <div className="space-y-4">
            {/* Tab Icons */}
            <div className="flex justify-center gap-2 p-2 bg-white rounded-lg border">
              {[
                { id: 'notes', icon: FileText, tooltip: 'Notes' },
                { id: 'tasks', icon: CheckCircle, tooltip: 'Tasks' },
                { id: 'appointments', icon: Calendar, tooltip: 'Appointments' },
                { id: 'documents', icon: Upload, tooltip: 'Documents' },
                { id: 'payments', icon: CreditCard, tooltip: 'Payments' },
              ].map(({ id, icon: Icon, tooltip }) => (
                <button
                  key={id}
                  onClick={() => setActiveRightColumn(id as any)}
                  className={`p-2 rounded transition-colors ${
                    activeRightColumn === id 
                      ? 'bg-teal-100 text-teal-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={tooltip}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>

            {/* Content based on active tab */}
            <Card className="flex-1">
              <CardContent className="p-4">
                {activeRightColumn === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Notes</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search notes..."
                          value={searchNotes}
                          onChange={(e) => setSearchNotes(e.target.value)}
                          className="w-32 text-xs"
                        />
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Add Note */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="text-sm"
                        rows={3}
                      />
                      <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                        Add Note
                      </Button>
                    </div>
                    
                    {/* Notes List */}
                    <div className="space-y-3">
                      {/* Mock notes */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">Initial contact made, very interested in our services.</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          <span>John Smith</span>
                          <span>•</span>
                          <span>2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRightColumn === 'tasks' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Tasks</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No tasks assigned</p>
                      ) : (
                        tasks.map((task) => (
                          <div key={task.id} className="p-3 border rounded-lg">
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-slate-500">{task.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="secondary" className="text-xs">{task.status}</Badge>
                              {task.dueDate && (
                                <span className="text-xs text-slate-500">
                                  Due: {format(new Date(task.dueDate), 'MMM dd')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeRightColumn === 'appointments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Appointments</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                    <p className="text-sm text-slate-500 text-center py-4">No appointments scheduled</p>
                  </div>
                )}

                {activeRightColumn === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Documents</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search files..."
                          className="w-32 text-xs"
                        />
                        <Button size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 text-center py-4">No documents uploaded</p>
                  </div>
                )}

                {activeRightColumn === 'payments' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Payments</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-600">Transactions</p>
                          <p className="text-lg font-semibold">$0</p>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-600">Subscriptions</p>
                          <p className="text-lg font-semibold">$0</p>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-600">Invoices</p>
                          <p className="text-lg font-semibold">{invoices.length}</p>
                        </div>
                      </div>
                    </div>
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