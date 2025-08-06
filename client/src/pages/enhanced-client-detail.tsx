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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [activeRightSection, setActiveRightSection] = useState("notes");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    recurring: false,
    recurringConfig: {
      interval: 1,
      unit: "days",
      endType: "never",
      endDate: "",
      endOccurrences: 1,
      createIfOverdue: false
    },
    assignee: ""
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clientId = params?.id;

  // Queries
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Mock data for demonstration
  const mockUsers = [
    { id: "user-1", name: "John Doe" },
    { id: "user-2", name: "Jane Smith" },
    { id: "user-3", name: "Asher Zavala" },
  ];

  // Filter tasks for this client
  const clientTasks = tasks.filter((task: Task) => task.clientId === clientId);

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
          <Button variant="ghost" onClick={() => setLocation("/clients")} className="mb-3 p-0 h-auto font-normal text-sm text-[#46a1a0]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clients
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#46a1a0]/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-[#46a1a0]" />
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
                  <p className="text-[#46a1a0]">{client.email}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Phone</label>
                  <p className="text-[#46a1a0]">{client.phone ? formatPhoneNumber(client.phone) : "Not provided"}</p>
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
                      className="text-[#46a1a0] hover:text-[#3a8685]"
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
                  <Button variant="ghost" size="sm" className="text-[#46a1a0]">
                    Add comment
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[#46a1a0]">
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
              className={`px-4 ${smsMessage ? 'bg-[#46a1a0] hover:bg-[#3a8685]' : ''}`}
            >
              SMS
            </Button>
            <Button 
              variant={emailMessage ? "default" : "outline"} 
              size="sm"
              className={`px-4 ${emailMessage ? 'bg-[#46a1a0] hover:bg-[#3a8685]' : ''}`}
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
                className="bg-[#46a1a0] hover:bg-[#3a8685]"
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

      {/* Right Sidebar - Multiple Sections */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Section Icons Header */}
        <TooltipProvider>
          <div className="flex border-b border-gray-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setActiveRightSection("notes")}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${
                    activeRightSection === "notes" 
                      ? "border-[#46a1a0] text-[#46a1a0] bg-[#46a1a0]/5" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notes</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setActiveRightSection("tasks")}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${
                    activeRightSection === "tasks" 
                      ? "border-[#46a1a0] text-[#46a1a0] bg-[#46a1a0]/5" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tasks</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setActiveRightSection("appointments")}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${
                    activeRightSection === "appointments" 
                      ? "border-[#46a1a0] text-[#46a1a0] bg-[#46a1a0]/5" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Appointments</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setActiveRightSection("documents")}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${
                    activeRightSection === "documents" 
                      ? "border-[#46a1a0] text-[#46a1a0] bg-[#46a1a0]/5" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
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
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${
                    activeRightSection === "payments" 
                      ? "border-[#46a1a0] text-[#46a1a0] bg-[#46a1a0]/5" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Payments</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Notes Section */}
        {activeRightSection === "notes" && (
          <>
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
                <div className="p-3 border border-[#46a1a0]/20 rounded-lg bg-[#46a1a0]/5">
                  <p className="text-sm text-gray-700">Testing the Notes Functionality</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>4 minutes ago with Michael Brown</span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-[#46a1a0]">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Button className="w-full bg-[#46a1a0] hover:bg-[#3a8685]">
                Add Note
              </Button>
            </div>
          </>
        )}

        {/* Tasks Section */}
        {activeRightSection === "tasks" && (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Tasks</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsTaskDialogOpen(true)}
                  className="p-1"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {clientTasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            {task.dueDate && (
                              <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                            )}
                            {task.assignee && (
                              <span>• {mockUsers.find(u => u.id === task.assignee)?.name}</span>
                            )}
                            {task.recurring && (
                              <Badge variant="secondary" className="text-xs">Recurring</Badge>
                            )}
                          </div>
                        </div>
                        <Checkbox 
                          checked={task.status === "completed"}
                          onCheckedChange={(checked) => {
                            // Handle task completion
                            toast({
                              title: checked ? "Task completed" : "Task marked incomplete",
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Button 
                className="w-full bg-[#46a1a0] hover:bg-[#3a8685]"
                onClick={() => setIsTaskDialogOpen(true)}
              >
                Add Task
              </Button>
            </div>
          </>
        )}

        {/* Appointments Section */}
        {activeRightSection === "appointments" && (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Appointments</h3>
                <Button variant="ghost" size="sm" className="p-1">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center text-gray-500 py-8">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No appointments scheduled</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Schedule Appointment
              </Button>
            </div>
          </>
        )}

        {/* Documents Section */}
        {activeRightSection === "documents" && (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Documents</h3>
                <Button variant="ghost" size="sm" className="p-1">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center text-gray-500 py-8">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No documents uploaded</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Upload Document
              </Button>
            </div>
          </>
        )}

        {/* Payments Section */}
        {activeRightSection === "payments" && (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Payments</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Transactions */}
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Transactions</h4>
                <div className="text-center text-gray-500 py-4">
                  <p className="text-xs">No transactions</p>
                </div>
              </div>
              
              {/* Subscriptions */}
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Subscriptions</h4>
                <div className="text-center text-gray-500 py-4">
                  <p className="text-xs">No subscriptions</p>
                </div>
              </div>
              
              {/* Invoices */}
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Invoices</h4>
                <div className="text-center text-gray-500 py-4">
                  <p className="text-xs">No invoices</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Add Payment
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time
                </label>
                <Input
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <Select 
                value={newTask.assignee} 
                onValueChange={(value) => setNewTask(prev => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring Task Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={newTask.recurring}
                onCheckedChange={(checked) => 
                  setNewTask(prev => ({ ...prev, recurring: checked as boolean }))
                }
              />
              <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                Set as Recurring Task
              </label>
            </div>

            {/* Recurring Configuration */}
            {newTask.recurring && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">Recurring Settings</h4>
                
                {/* Repeat Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repeats every
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={newTask.recurringConfig.interval}
                      onChange={(e) => setNewTask(prev => ({
                        ...prev,
                        recurringConfig: {
                          ...prev.recurringConfig,
                          interval: parseInt(e.target.value) || 1
                        }
                      }))}
                      className="w-20"
                    />
                    <Select
                      value={newTask.recurringConfig.unit}
                      onValueChange={(value) => setNewTask(prev => ({
                        ...prev,
                        recurringConfig: { ...prev.recurringConfig, unit: value }
                      }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hour(s)</SelectItem>
                        <SelectItem value="days">Day(s)</SelectItem>
                        <SelectItem value="weeks">Week(s)</SelectItem>
                        <SelectItem value="months">Month(s)</SelectItem>
                        <SelectItem value="years">Year(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ends On
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="never"
                        name="endType"
                        checked={newTask.recurringConfig.endType === "never"}
                        onChange={() => setNewTask(prev => ({
                          ...prev,
                          recurringConfig: { ...prev.recurringConfig, endType: "never" }
                        }))}
                      />
                      <label htmlFor="never" className="text-sm">Never</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="onDate"
                        name="endType"
                        checked={newTask.recurringConfig.endType === "onDate"}
                        onChange={() => setNewTask(prev => ({
                          ...prev,
                          recurringConfig: { ...prev.recurringConfig, endType: "onDate" }
                        }))}
                      />
                      <label htmlFor="onDate" className="text-sm">On</label>
                      <Input
                        type="date"
                        value={newTask.recurringConfig.endDate}
                        onChange={(e) => setNewTask(prev => ({
                          ...prev,
                          recurringConfig: { ...prev.recurringConfig, endDate: e.target.value }
                        }))}
                        disabled={newTask.recurringConfig.endType !== "onDate"}
                        className="w-40"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="afterOccurrences"
                        name="endType"
                        checked={newTask.recurringConfig.endType === "afterOccurrences"}
                        onChange={() => setNewTask(prev => ({
                          ...prev,
                          recurringConfig: { ...prev.recurringConfig, endType: "afterOccurrences" }
                        }))}
                      />
                      <label htmlFor="afterOccurrences" className="text-sm">After</label>
                      <Input
                        type="number"
                        min="1"
                        value={newTask.recurringConfig.endOccurrences}
                        onChange={(e) => setNewTask(prev => ({
                          ...prev,
                          recurringConfig: { 
                            ...prev.recurringConfig, 
                            endOccurrences: parseInt(e.target.value) || 1 
                          }
                        }))}
                        disabled={newTask.recurringConfig.endType !== "afterOccurrences"}
                        className="w-20"
                      />
                      <span className="text-sm">occurrences</span>
                    </div>
                  </div>
                </div>

                {/* Create if Overdue */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createIfOverdue"
                    checked={newTask.recurringConfig.createIfOverdue}
                    onCheckedChange={(checked) => setNewTask(prev => ({
                      ...prev,
                      recurringConfig: {
                        ...prev.recurringConfig,
                        createIfOverdue: checked as boolean
                      }
                    }))}
                  />
                  <label htmlFor="createIfOverdue" className="text-sm">
                    Create a new task even if previous task is overdue
                  </label>
                </div>
              </div>
            )}

            {/* Dialog Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTaskDialogOpen(false);
                  setNewTask({
                    title: "",
                    description: "",
                    dueDate: "",
                    dueTime: "",
                    recurring: false,
                    recurringConfig: {
                      interval: 1,
                      unit: "days",
                      endType: "never",
                      endDate: "",
                      endOccurrences: 1,
                      createIfOverdue: false
                    },
                    assignee: ""
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newTask.title.trim()) {
                    toast({
                      title: "Error",
                      description: "Task title is required",
                      variant: "destructive"
                    });
                    return;
                  }

                  try {
                    const taskData = {
                      title: newTask.title,
                      description: newTask.description || null,
                      clientId: clientId,
                      projectId: null,
                      assignee: newTask.assignee || null,
                      dueDate: newTask.dueDate ? new Date(`${newTask.dueDate}T${newTask.dueTime || '09:00'}`).toISOString() : null,
                      status: "pending",
                      priority: "medium",
                      recurring: newTask.recurring,
                      recurringConfig: newTask.recurring ? newTask.recurringConfig : null
                    };

                    await apiRequest("/api/tasks", "POST", taskData);

                    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
                    
                    toast({
                      title: "Task created successfully",
                      description: `Task "${newTask.title}" has been created.`
                    });

                    setIsTaskDialogOpen(false);
                    setNewTask({
                      title: "",
                      description: "",
                      dueDate: "",
                      dueTime: "",
                      recurring: false,
                      recurringConfig: {
                        interval: 1,
                        unit: "days",
                        endType: "never",
                        endDate: "",
                        endOccurrences: 1,
                        createIfOverdue: false
                      },
                      assignee: ""
                    });

                  } catch (error) {
                    toast({
                      title: "Error creating task",
                      description: "Please try again",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={!newTask.title.trim()}
              >
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}