import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  User, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  Plus, 
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  Shield,
  ShieldOff,
  UserPlus,
  Users,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Bell,
  BellOff,
  PhoneOff,
  MessageSquareOff,
  MailX,
  StickyNote,
  Search,
  Calendar,
  Upload,
  CreditCard,
  Settings
} from "lucide-react";
import type { Client } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface Section {
  id: string;
  name: string;
  isOpen: boolean;
}

interface Activity {
  id: string;
  description: string;
  user: string;
  timestamp: string;
  content: string;
}

// Mock data
const mockActivities: Activity[] = [
  {
    id: "1",
    description: "Contact updated",
    user: "Michael Brown",
    timestamp: "4 minutes ago",
    content: "Changed contact status from Lead to Customer and updated billing information."
  },
  {
    id: "2", 
    description: "Email sent",
    user: "Sarah Johnson",
    timestamp: "2 hours ago",
    content: "Welcome email template sent successfully to client."
  }
];

export default function EnhancedClientDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract client ID from URL
  const clientId = window.location.pathname.split('/').pop();
  
  // State management
  const [sections, setSections] = useState<Section[]>([
    { id: "contact-details", name: "Contact Details", isOpen: true }
  ]);
  const [activeRightSection, setActiveRightSection] = useState<"notes" | "documents" | "appointments" | "payments">("notes");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  
  // DND State
  const [showDndSettings, setShowDndSettings] = useState(false);
  
  // Owner/Followers State
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [followersSearch, setFollowersSearch] = useState("");

  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
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

  // Fetch staff for owner/followers
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  // Fetch custom field folders
  const { data: customFieldFolders } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['/api/custom-field-folders'],
  });

  // Fetch client notes
  const { data: clientNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes', 'client', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/notes?clientId=${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
    enabled: !!clientId,
  });

  // Update sections when custom field folders are loaded
  useEffect(() => {
    if (customFieldFolders) {
      const newSections: Section[] = [
        { id: "contact-details", name: "Contact Details", isOpen: true }
      ];
      
      // Add custom field folders as sections
      customFieldFolders.forEach(folder => {
        newSections.push({
          id: folder.name.toLowerCase().replace(/\s+/g, '-'),
          name: folder.name,
          isOpen: false
        });
      });
      
      setSections(newSections);
    }
  }, [customFieldFolders]);

  // Update client DND settings mutation
  const updateDndMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiRequest("PUT", `/api/clients/${clientId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      toast({
        title: "DND Settings Updated",
        description: "Communication preferences have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update DND settings",
        variant: "destructive",
      });
    },
  });

  // Update owner mutation
  const updateOwnerMutation = useMutation({
    mutationFn: async (ownerId: string | null) => {
      await apiRequest("PUT", `/api/clients/${clientId}`, { contactOwner: ownerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      setShowOwnerDialog(false);
      toast({
        title: "Owner Updated",
        description: "Contact owner has been updated",
      });
    },
  });

  // Update followers mutation
  const updateFollowersMutation = useMutation({
    mutationFn: async (followers: string[]) => {
      await apiRequest("PUT", `/api/clients/${clientId}`, { followers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      setShowFollowersDialog(false);
      toast({
        title: "Followers Updated",
        description: "Contact followers have been updated",
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
          clientId,
          type: 'note'
        }),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', 'client', clientId] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
  });

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
  };

  const sendSMS = () => {
    if (!smsMessage.trim()) return;
    
    // Check DND settings
    if (client?.dndAll || client?.dndSms) {
      toast({
        title: "Message Blocked",
        description: "SMS sending is blocked by DND settings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "SMS Sent",
      description: "Text message sent successfully",
    });
    setSmsMessage("");
  };

  const sendEmail = () => {
    if (!emailMessage.trim()) return;
    
    // Check DND settings
    if (client?.dndAll || client?.dndEmail) {
      toast({
        title: "Message Blocked", 
        description: "Email sending is blocked by DND settings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email Sent",
      description: "Email sent successfully",
    });
    setEmailMessage("");
  };

  const handleDndToggle = (field: string, value: boolean) => {
    updateDndMutation.mutate({ [field]: value });
  };

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return "Unassigned";
    const owner = staff.find((s: any) => s.id === ownerId);
    return owner ? `${owner.firstName} ${owner.lastName}` : "Unknown";
  };

  const getFollowersNames = (followerIds: string[] | null) => {
    if (!followerIds || followerIds.length === 0) return "None";
    const followers = followerIds.map(id => {
      const follower = staff.find((s: any) => s.id === id);
      return follower ? `${follower.firstName} ${follower.lastName}` : "Unknown";
    });
    return followers.join(", ");
  };

  const filteredStaffForOwner = staff.filter((s: any) => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  const filteredStaffForFollowers = staff.filter((s: any) => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(followersSearch.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error || !client) return <div className="flex justify-center items-center min-h-screen">Client not found</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Custom Fields and Folders */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/clients')}
              className="flex items-center gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
          </div>
          
          {/* Client Header with Owner & Followers */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
                {client.company && (
                  <Badge variant="outline" className="text-xs">
                    {client.company}
                  </Badge>
                )}
              </div>
            </div>

            {/* Owner & Followers */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Owner:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowOwnerDialog(true)}
                  className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {getOwnerName(client.contactOwner)}
                  <Edit2 className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Followers:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFollowersDialog(true)}
                  className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {getFollowersNames(client.followers)}
                  <Edit2 className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-gray-100">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{section.name}</span>
                {section.isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {section.isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {section.id === "contact-details" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-500 mb-1">Email</label>
                        <p className="text-gray-900">{client.email}</p>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Phone</label>
                        <p className="text-gray-900">{client.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Company</label>
                        <p className="text-gray-900">{client.company || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Address</label>
                        <p className="text-gray-900">
                          {[client.address, client.city, client.state].filter(Boolean).join(", ") || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Contact Type</label>
                        <p className="text-gray-900">{client.contactType || "Client"}</p>
                      </div>
                    </div>
                  ) : (
                    // Custom Field Folder Content
                    <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Custom Fields Coming Soon</h3>
                      <p className="text-slate-600 mb-4">
                        Custom fields for "{section.name}" will appear here once they're created.
                      </p>
                      <p className="text-sm text-slate-500">
                        Admins can add custom fields to this folder in Settings → Custom Fields.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Quick Actions Section */}
          <div className="border-b border-gray-100">
            <div className="px-4 py-3">
              <span className="font-medium text-gray-900">Quick Actions</span>
            </div>
            <div className="px-4 pb-4 space-y-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Communication and Activities */}
      <div className="flex-1 flex flex-col bg-white">
        {/* DND Status Bar */}
        {(client.dndAll || client.dndEmail || client.dndSms || client.dndCalls) && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-red-600" />
                <span className="text-red-700 font-medium">
                  DND Active: {client.dndAll ? "All Channels" : 
                    [
                      client.dndEmail && "Email",
                      client.dndSms && "SMS", 
                      client.dndCalls && "Calls"
                    ].filter(Boolean).join(", ")}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDndSettings(!showDndSettings)}
                className="text-red-700 hover:text-red-800"
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage DND
              </Button>
            </div>
          </div>
        )}

        {/* DND Settings Panel */}
        {showDndSettings && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Communication Settings</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDndSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellOff className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Block All Communications</span>
                  </div>
                  <Checkbox
                    checked={Boolean(client.dndAll)}
                    onCheckedChange={(checked) => handleDndToggle('dndAll', checked as boolean)}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MailX className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Block Emails</span>
                  </div>
                  <Checkbox
                    checked={Boolean(client.dndEmail)}
                    onCheckedChange={(checked) => handleDndToggle('dndEmail', checked as boolean)}
                    disabled={Boolean(client.dndAll)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareOff className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Block Text Messages</span>
                  </div>
                  <Checkbox
                    checked={Boolean(client.dndSms)}
                    onCheckedChange={(checked) => handleDndToggle('dndSms', checked as boolean)}
                    disabled={Boolean(client.dndAll)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneOff className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Block Calls & Voicemails</span>
                  </div>
                  <Checkbox
                    checked={Boolean(client.dndCalls)}
                    onCheckedChange={(checked) => handleDndToggle('dndCalls', checked as boolean)}
                    disabled={Boolean(client.dndAll)}
                  />
                </div>
              </div>
              
              {(client.dndAll || client.dndEmail || client.dndSms || client.dndCalls) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700">
                      When DND is active, the system will prevent sending communications and show warning messages.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Communication Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-[#46a1a0]" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Communication</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button 
              variant={smsMessage ? "default" : "outline"}
              size="sm"
              onClick={() => setSmsMessage(smsMessage ? "" : " ")}
              className={`px-4 ${smsMessage ? 'bg-[#46a1a0] hover:bg-[#3a8685]' : ''}`}
              disabled={client.dndAll || client.dndSms}
            >
              {(client.dndAll || client.dndSms) && <ShieldOff className="h-4 w-4 mr-1" />}
              SMS
            </Button>
            <Button 
              variant={emailMessage ? "default" : "outline"}
              size="sm"
              onClick={() => setEmailMessage(emailMessage ? "" : " ")}
              className={`px-4 ${emailMessage ? 'bg-[#46a1a0] hover:bg-[#3a8685]' : ''}`}
              disabled={client.dndAll || client.dndEmail}
            >
              {(client.dndAll || client.dndEmail) && <ShieldOff className="h-4 w-4 mr-1" />}
              Email
            </Button>
          </div>
          
          {smsMessage && (
            <div className="space-y-2">
              <Textarea 
                placeholder={
                  (client.dndAll || client.dndSms) 
                    ? "SMS messaging is blocked by DND settings..." 
                    : "Type your SMS message..."
                }
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className={`min-h-[80px] ${
                  (client.dndAll || client.dndSms) 
                    ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' 
                    : ''
                }`}
                disabled={Boolean(client.dndAll) || Boolean(client.dndSms)}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{smsMessage.length}/160 characters</span>
                <Button 
                  onClick={sendSMS} 
                  size="sm" 
                  className="bg-[#46a1a0] hover:bg-[#3a8685]"
                  disabled={!smsMessage.trim() || Boolean(client.dndAll) || Boolean(client.dndSms)}
                >
                  Send SMS
                </Button>
              </div>
            </div>
          )}
          
          {emailMessage && (
            <div className="space-y-2">
              <Input 
                placeholder={
                  (client.dndAll || client.dndEmail) 
                    ? "Email is blocked by DND settings..." 
                    : "Subject"
                }
                className={`mb-2 ${
                  (client.dndAll || client.dndEmail) 
                    ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' 
                    : ''
                }`}
                disabled={Boolean(client.dndAll) || Boolean(client.dndEmail)}
              />
              <Textarea 
                placeholder={
                  (client.dndAll || client.dndEmail) 
                    ? "Email messaging is blocked by DND settings..." 
                    : "Type your email message..."
                }
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className={`min-h-[100px] ${
                  (client.dndAll || client.dndEmail) 
                    ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-400' 
                    : ''
                }`}
                disabled={Boolean(client.dndAll) || Boolean(client.dndEmail)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={sendEmail} 
                  size="sm" 
                  className="bg-[#46a1a0] hover:bg-[#3a8685]"
                  disabled={!emailMessage.trim() || Boolean(client.dndAll) || Boolean(client.dndEmail)}
                >
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="flex-1 p-6 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-[#46a1a0]" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{activity.description}</h3>
                  <span className="text-sm text-gray-500">{activity.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{activity.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">by {activity.user}</span>
                  <Button variant="ghost" size="sm" className="text-[#46a1a0] hover:text-[#3a8685]">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Client Activity Hub */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Client Hub</h2>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveRightSection("notes")}
                    className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                      activeRightSection === "notes"
                        ? "bg-white text-[#46a1a0] shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                        ? "bg-white text-[#46a1a0] shadow-sm"
                        : "text-gray-400"
                    }`}
                    disabled
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Appointments (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveRightSection("documents")}
                    className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                      activeRightSection === "documents"
                        ? "bg-white text-[#46a1a0] shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Documents</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveRightSection("payments")}
                    className={`flex items-center justify-center w-10 h-10 rounded-md transition-all opacity-50 cursor-not-allowed ${
                      activeRightSection === "payments"
                        ? "bg-white text-[#46a1a0] shadow-sm"
                        : "text-gray-400"
                    }`}
                    disabled
                  >
                    <CreditCard className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Payments (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeRightSection === "notes" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea 
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  size="sm" 
                  className="w-full bg-[#46a1a0] hover:bg-[#3a8685]"
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  onClick={() => createNoteMutation.mutate(newNote)}
                >
                  {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search notes..."
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {notesLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">Loading notes...</div>
                  </div>
                ) : clientNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No notes yet</p>
                    <p className="text-xs text-gray-400">Add your first note above</p>
                  </div>
                ) : (
                  clientNotes
                    .filter((note: any) => !searchNotes || note.content.toLowerCase().includes(searchNotes.toLowerCase()))
                    .map((note: any) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">Note</span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{note.content}</p>
                        <div className="mt-2 text-xs text-gray-400">
                          by {note.createdBy?.firstName} {note.createdBy?.lastName}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
          
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
        </div>
      </div>

      {/* Owner Assignment Dialog */}
      <Dialog open={showOwnerDialog} onOpenChange={setShowOwnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Contact Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => updateOwnerMutation.mutate(null)}
              >
                <User className="h-4 w-4 mr-2" />
                Unassigned
              </Button>
              
              {filteredStaffForOwner.map((member: any) => (
                <Button
                  key={member.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => updateOwnerMutation.mutate(member.id)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {member.firstName} {member.lastName}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers Assignment Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={followersSearch}
                onChange={(e) => setFollowersSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredStaffForFollowers.map((member: any) => {
                const isFollowing = client.followers?.includes(member.id) || false;
                return (
                  <Button
                    key={member.id}
                    variant={isFollowing ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      const currentFollowers = client.followers || [];
                      const newFollowers = isFollowing
                        ? currentFollowers.filter((id: string) => id !== member.id)
                        : [...currentFollowers, member.id];
                      updateFollowersMutation.mutate(newFollowers);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {member.firstName} {member.lastName}
                    {isFollowing && <span className="ml-auto text-xs">Following</span>}
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}