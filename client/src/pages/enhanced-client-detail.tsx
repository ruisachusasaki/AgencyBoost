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
    isOpen: false,
    canReorder: true,
  },
  {
    id: "billing",
    name: "Billing",
    isOpen: false,
    canReorder: true,
  },
  {
    id: "resources",
    name: "Important Resources",
    isOpen: false,
    canReorder: true,
  },
  {
    id: "actions",
    name: "ACTIONS",
    isOpen: false,
    canReorder: true,
  },
];

export default function EnhancedClientDetail() {
  const [match, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clientId = params?.id;

  // Queries
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Mock data for demonstration
  const mockUsers = [
    { id: "user-1", name: "John Doe" },
    { id: "user-2", name: "Jane Smith" },
  ];

  const mockActivities = [
    {
      id: 1,
      type: "sms",
      description: "Mo Marketing logged call",
      user: "Asher Zavala",
      timestamp: "08/04/2025 9:41 AM MD",
      content: "Test"
    },
    {
      id: 2,
      type: "email",
      description: "Mo Marketing contacted us",
      user: "Asher Zavala",
      timestamp: "Apr 3, 2024 at 7:03 AM MD",
      content: "Test"
    },
  ];

  // Helper functions
  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
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

  const sendSMS = () => {
    if (!smsMessage.trim()) return;
    
    toast({
      title: "SMS sent successfully",
      description: `Message sent to ${client?.name}`,
    });
    setSmsMessage("");
  };

  const sendEmail = () => {
    if (!emailMessage.trim()) return;
    
    toast({
      title: "Email sent successfully", 
      description: `Email sent to ${client?.name}`,
    });
    setEmailMessage("");
  };

  if (!match) return null;

  if (clientLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="w-80 bg-white border-l border-gray-200 animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
            <p className="text-gray-600 mb-4">The client you're looking for doesn't exist or has been deleted.</p>
            <Button variant="ghost" onClick={() => setLocation("/clients")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Contact Details */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button variant="ghost" onClick={() => setLocation("/clients")} className="mb-3 p-0 h-auto font-normal text-sm text-blue-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clients
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-600">{client.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Owner Changed: today</span>
            <span>•</span>
            <span>Followers: 1</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Contact Details Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("contact-details")}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">Contact Details</span>
              {sections.find(s => s.id === "contact-details")?.isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {sections.find(s => s.id === "contact-details")?.isOpen && (
              <div className="px-4 pb-4 space-y-4 text-sm">
                <div>
                  <label className="block text-gray-500 mb-1">Position</label>
                  <p className="text-gray-900">{client.position || "Marketing Director"}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Email</label>
                  <p className="text-blue-600">{client.email}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Phone</label>
                  <p className="text-blue-600">{client.phone ? formatPhoneNumber(client.phone) : "Not provided"}</p>
                </div>
                {(client.address || client.city || client.state) && (
                  <div>
                    <label className="block text-gray-500 mb-1">Address</label>
                    <div className="text-gray-900">
                      {client.address && <p>{client.address}</p>}
                      {client.address2 && <p>{client.address2}</p>}
                      {(client.city || client.state || client.zipCode) && (
                        <p>{[client.city, client.state, client.zipCode].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-gray-500 mb-1">Client Vertical</label>
                  <p className="text-gray-900">{client.clientVertical || "Not specified"}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Contact Status</label>
                  <p className="text-gray-900">{client.status}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Contact Source</label>
                  <p className="text-gray-900">{client.contactSource || "Not specified"}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Contact Type</label>
                  <p className="text-gray-900">{client.contactType || "Client"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Services Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("services")}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">Services</span>
              {sections.find(s => s.id === "services")?.isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {sections.find(s => s.id === "services")?.isOpen && (
              <div className="px-4 pb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Billing</span>
                  <span className="text-gray-900">$7,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoicing Contact</span>
                  <span className="text-gray-900">{client.invoicingContact || "Not set"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Billing Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("billing")}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">Billing</span>
              {sections.find(s => s.id === "billing")?.isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {sections.find(s => s.id === "billing")?.isOpen && (
              <div className="px-4 pb-4 space-y-3 text-sm">
                <div>
                  <label className="block text-gray-500 mb-1">MRR</label>
                  <p className="text-gray-900">{client.mrr ? `$${client.mrr}` : "Not set"}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Payment Terms</label>
                  <p className="text-gray-900">{client.paymentTerms || "Not set"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Important Resources Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("resources")}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">Important Resources</span>
              {sections.find(s => s.id === "resources")?.isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {sections.find(s => s.id === "resources")?.isOpen && (
              <div className="px-4 pb-4 space-y-2 text-sm">
                {[
                  { label: "Client Brief", url: client.clientBrief },
                  { label: "StoryBrand", url: client.storyBrand },
                  { label: "Google Drive Folder", url: client.googleDriveFolder },
                  { label: "Testing Log", url: client.testingLog },
                  { label: "StyleGuide", url: client.styleGuide },
                ].filter(resource => resource.url).map((resource, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{resource.label}</span>
                    <a 
                      href={resource.url!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("actions")}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-600 text-xs tracking-wider">ACTIONS</span>
              {sections.find(s => s.id === "actions")?.isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {sections.find(s => s.id === "actions")?.isOpen && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="block text-gray-500 text-xs mb-2">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">healthcare</Badge>
                    <Badge variant="secondary" className="text-xs">enterprise</Badge>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-500 text-xs mb-2">Opportunities</label>
                  <p className="text-sm text-gray-600">Primary</p>
                </div>

                <div>
                  <label className="block text-gray-500 text-xs mb-2">DND Settings</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="dnd-all" checked={client.dndAll || false} />
                      <label htmlFor="dnd-all" className="text-sm">DND ALL channels</label>
                    </div>
                    <div className="text-xs text-gray-400 text-center">OR</div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="dnd-email" checked={client.dndEmail || false} />
                        <label htmlFor="dnd-email" className="text-sm">Emails</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="dnd-sms" checked={client.dndSms || false} />
                        <label htmlFor="dnd-sms" className="text-sm">Text Messages</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="dnd-calls" checked={client.dndCalls || false} />
                        <label htmlFor="dnd-calls" className="text-sm">Calls & Voicemails</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 text-xs mb-2">Active Campaigns</label>
                  <p className="text-sm text-gray-600">No active campaigns</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Recent Activities */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <div className="flex items-center gap-2 mt-2">
            <Input 
              placeholder="Search activities..." 
              className="max-w-sm"
            />
            <Button variant="outline" size="sm">
              Collapse all
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">{activity.description}</span>
                    <span className="text-xs text-gray-400">{activity.user}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">Action • {activity.timestamp}</p>
                  <p className="text-sm text-gray-600">{activity.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    Add comment
                  </Button>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    1 association
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SMS/Email Composer */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2 mb-3">
            <Button 
              variant={smsMessage ? "default" : "outline"} 
              size="sm"
              className="px-4"
            >
              SMS
            </Button>
            <Button 
              variant={emailMessage ? "default" : "outline"} 
              size="sm"
              className="px-4"
            >
              EMAIL
            </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">From:</span>
                <span className="text-sm text-gray-600">+1 435-456-9857</span>
                <span className="text-sm">To:</span>
                <span className="text-sm text-gray-600">{client.phone ? formatPhoneNumber(client.phone) : "No phone"}</span>
              </div>
              <Textarea
                placeholder="Type a message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                onClick={sendSMS}
                disabled={!smsMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send
              </Button>
              <Button variant="outline" size="sm">
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Notes */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Notes</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="p-1">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input 
            placeholder="Search" 
            value={searchNotes}
            onChange={(e) => setSearchNotes(e.target.value)}
            className="text-sm"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-sm text-gray-700">Testing the Notes Functionality</p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>4 minutes ago with Michael Brown</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Button className="w-full bg-teal-600 hover:bg-teal-700">
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
}