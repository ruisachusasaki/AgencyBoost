import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Building2, 
  Globe, 
  Plus, 
  Edit2, 
  MessageSquare, 
  Clock, 
  Upload, 
  Download, 
  Trash2, 
  Send, 
  MoreHorizontal,
  Briefcase,
  CreditCard,
  FileText,
  Users,
  StickyNote,
  Search,
  X,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AppointmentModal } from "@/components/AppointmentModal";
import { SlateEditor } from "@/components/slate-editor";
import { DocumentUploader } from "@/components/DocumentUploader";

// Types
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  status: 'active' | 'inactive' | 'lead';
  avatar?: string;
  createdAt: string;
  customFields?: Record<string, any>;
  teamAssignments?: {
    accountManager?: string;
    projectManager?: string;
    strategist?: string;
    creativeDirector?: string;
    copywriter?: string;
    designer?: string;
    developer?: string;
    analyst?: string;
    coordinator?: string;
    consultant?: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
  projectId?: string;
  clientId: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  clientId: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  fileSize: number;
  clientId: string;
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  clientId: string;
  createdAt: string;
  authorId: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  clientId: string;
  createdAt: string;
  authorId: string;
}

interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  clientId: string;
  staffId: string;
  type: 'meeting' | 'call' | 'presentation';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

export default function EnhancedClientDetail() {
  const { id: clientId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for modals and UI
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showSMSScheduleModal, setShowSMSScheduleModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [activeTab, setActiveTab] = useState("contact");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [clientBrief, setClientBrief] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    website: "",
    address: "",
    status: "active" as const,
    teamAssignments: {
      accountManager: "",
      projectManager: "",
      strategist: "",
      creativeDirector: "",
      copywriter: "",
      designer: "",
      developer: "",
      analyst: "",
      coordinator: "",
      consultant: ""
    }
  });

  // Queries
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
  });

  const { data: clientTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', 'client', clientId],
    enabled: !!clientId,
  });

  const { data: clientProjects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', 'client', clientId],
    enabled: !!clientId,
  });

  const { data: clientDocuments = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', 'client', clientId],
    enabled: !!clientId,
  });

  const { data: clientNotes = [], isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ['/api/notes', 'client', clientId],
    enabled: !!clientId,
  });

  const { data: clientActivities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities', 'client', clientId],
    enabled: !!clientId,
  });

  const { data: clientAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', 'client', clientId],
    enabled: !!clientId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
  });

  // Mutations
  const updateClientMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      return apiRequest(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsEditModalOpen(false);
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

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; template: string }) => {
      return apiRequest(`/api/clients/${clientId}/email`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsEmailModalOpen(false);
      setEmailSubject("");
      setEmailTemplate("");
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const sendSMSMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return apiRequest(`/api/clients/${clientId}/sms`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsSMSModalOpen(false);
      setSmsMessage("");
      toast({
        title: "Success",
        description: "SMS sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          clientId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', 'client', clientId] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', 'client', clientId] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', 'client', clientId] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Effects
  useEffect(() => {
    if (client && isEditModalOpen) {
      setEditForm({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company: client.company || "",
        website: client.website || "",
        address: client.address || "",
        status: client.status || "active",
        teamAssignments: client.teamAssignments || {
          accountManager: "",
          projectManager: "",
          strategist: "",
          creativeDirector: "",
          copywriter: "",
          designer: "",
          developer: "",
          analyst: "",
          coordinator: "",
          consultant: ""
        }
      });
    }
  }, [client, isEditModalOpen]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Downloaded ${doc.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const calculateNotesMaxHeight = () => {
    // Calculate dynamic height based on viewport
    const viewportHeight = window.innerHeight;
    const headerHeight = 200; // Approximate header height
    const tabsHeight = 50; // Tabs height
    const notesHeaderHeight = 160; // Notes input area height
    const bottomPadding = 100; // Bottom padding
    
    return Math.max(300, viewportHeight - headerHeight - tabsHeight - notesHeaderHeight - bottomPadding);
  };

  const insertMergeTag = (tag: string) => {
    const textarea = document.querySelector('textarea[placeholder="Enter your email template..."]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newValue = before + `{{${tag}}}` + after;
      setEmailTemplate(newValue);
      
      // Set cursor position after the inserted tag
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length + 4, start + tag.length + 4);
      }, 0);
    }
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s: any) => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unassigned';
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Client not found</p>
          <Button onClick={() => setLocation('/clients')}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
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
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={client.avatar} 
                    alt={client.name || 'Client'}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                    {client.name ? client.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{client.name || 'Unnamed Client'}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getStatusColor(client.status)} border`}>
                      {client.status}
                    </Badge>
                    {client.company && (
                      <span className="text-gray-600">at {client.company}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAppointmentModal(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                    <MoreHorizontal className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsEmailModalOpen(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSMSModalOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send SMS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSMSScheduleModal(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule SMS
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          {/* Contact Tab - Restructured Layout */}
          <TabsContent value="contact" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - Contact Information & Actions */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Phone</span>
                        <span className="text-sm font-medium">{client.phone}</span>
                      </div>
                    )}
                    {client.company && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Company</span>
                        <span className="text-sm font-medium">{client.company}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Website</span>
                        <a 
                          href={client.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {client.website}
                        </a>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Address</span>
                        <span className="text-sm font-medium">{client.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Assignments */}
                {client.teamAssignments && Object.values(client.teamAssignments).some(Boolean) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(client.teamAssignments)
                          .filter(([_, staffId]) => staffId)
                          .map(([role, staffId]) => (
                            <div key={role} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">
                                {role.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-sm font-medium">
                                {getStaffName(staffId)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEmailModalOpen(true)}
                        className="justify-start"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSMSModalOpen(true)}
                        className="justify-start"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send SMS
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAppointmentModal(true)}
                        className="justify-start"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSMSScheduleModal(true)}
                        className="justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule SMS
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Client Brief Editor */}
              <div className="lg:col-span-3">
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <CardTitle>Client Brief</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="min-h-[500px]">
                      <SlateEditor
                        value={clientBrief}
                        onChange={setClientBrief}
                        placeholder="Add client brief, notes, project requirements, or any important information about this client..."
                        className="min-h-[450px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading projects...</p>
                  </div>
                ) : clientProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No projects found</p>
                    <p className="text-xs text-gray-400">Create a project to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientProjects.map((project) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <Badge className={`${getProjectStatusColor(project.status)} border text-xs`}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-900 font-medium">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-gray-500">
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading tasks...</p>
                  </div>
                ) : clientTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No tasks found</p>
                    <p className="text-xs text-gray-400">Create a task to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientTasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getPriorityColor(task.priority)} border text-xs`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`${getTaskStatusColor(task.status)} border text-xs`}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          {task.dueDate && (
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          )}
                          {task.assignedTo && (
                            <span>Assigned to: {getStaffName(task.assignedTo)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                  <DocumentUploader 
                    clientId={clientId!}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/documents', 'client', clientId] });
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading documents...</p>
                  </div>
                ) : clientDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No documents uploaded</p>
                    <p className="text-xs text-gray-400">Upload your first document to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => downloadDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDocumentToDelete(doc)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Communication features will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Modals and Dialogs */}
        <Dialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete "{documentToDelete?.name || 'this document'}"? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDocumentToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (documentToDelete) {
                    deleteDocumentMutation.mutate(documentToDelete.id);
                    setDocumentToDelete(null);
                  }
                }}
                disabled={deleteDocumentMutation.isPending}
              >
                {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* SMS Schedule Modal */}
        <Dialog open={showSMSScheduleModal} onOpenChange={setShowSMSScheduleModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule SMS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">SMS scheduling feature coming soon!</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSMSScheduleModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <AppointmentModal
            isOpen={showAppointmentModal}
            onClose={() => setShowAppointmentModal(false)}
            clientId={clientId}
            onAppointmentCreated={() => {
              // Refresh appointments or handle the new appointment
            }}
          />
        )}
      </div>
    </div>
  );
};