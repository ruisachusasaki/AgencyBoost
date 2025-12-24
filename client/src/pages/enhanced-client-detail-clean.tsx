import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, ChevronDown, ChevronRight, FileText, CheckCircle, Plus, ExternalLink } from "lucide-react";
import type { Client } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "pending" | "completed";
}

interface NewTask {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  recurring: boolean;
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

const mockUsers = [
  { id: "1", name: "Michael Brown" },
  { id: "2", name: "Sarah Johnson" },
  { id: "3", name: "David Wilson" }
];

export default function EnhancedClientDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract client ID from URL
  const clientId = window.location.pathname.split('/').pop();
  
  // State management
  const [sections, setSections] = useState<Section[]>([
    { id: "contact-details", name: "Contact Details", isOpen: true }
  ]);
  const [activeRightSection, setActiveRightSection] = useState<"notes" | "tasks">("notes");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    assignee: "",
    recurring: false
  });

  // Fetch client data
  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
  });

  // Fetch custom field folders
  const { data: customFieldFolders } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['/api/custom-field-folders'],
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

  // Utility functions
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
  };

  const isSectionOpen = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.isOpen || false;
  };

  const sendSMS = () => {
    if (!smsMessage.trim()) return;
    toast({
      title: "SMS Sent",
      variant: "success",
      description: `Message sent to ${client?.name}`,
    });
    setSmsMessage("");
  };

  const sendEmail = () => {
    if (!emailMessage.trim()) return;
    toast({
      title: "Email Sent",
      variant: "success",
      description: `Email sent to ${client?.name}`,
    });
    setEmailMessage("");
  };

  // Loading state
  if (isLoading || !clientId) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-80"></div>
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
          {/* Dynamic Sections - Contact Details + Custom Field Folders */}
          {sections.map((section) => (
            <div key={section.id} className="border-b border-gray-200">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{section.name}</span>
                {isSectionOpen(section.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isSectionOpen(section.id) && (
                <div className="px-4 pb-4">
                  {section.id === "contact-details" ? (
                    <div className="space-y-4 text-sm">
                      <div>
                        <label className="block text-gray-500 mb-1">Position</label>
                        <p className="text-gray-900">{client.position || "Not specified"}</p>
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
              onClick={() => setSmsMessage(smsMessage ? "" : " ")}
              className={`px-4 ${smsMessage ? 'bg-[#46a1a0] hover:bg-[#3a8685]' : ''}`}
            >
              SMS
            </Button>
            <Button 
              variant={emailMessage ? "default" : "outline"} 
              size="sm"
              onClick={() => setEmailMessage(emailMessage ? "" : " ")}
              className={`px-4 ${emailMessage ? 'bg-[#46a1a0] hover:bg-[#3a8685]' : ''}`}
            >
              Email
            </Button>
          </div>
          
          {smsMessage && (
            <div className="space-y-2">
              <Textarea 
                placeholder="Type your SMS message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{smsMessage.length}/160 characters</span>
                <Button onClick={sendSMS} size="sm" className="bg-[#46a1a0] hover:bg-[#3a8685]">
                  Send SMS
                </Button>
              </div>
            </div>
          )}
          
          {emailMessage && (
            <div className="space-y-2">
              <Input 
                placeholder="Subject"
                className="mb-2"
              />
              <Textarea 
                placeholder="Type your email message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button onClick={sendEmail} size="sm" className="bg-[#46a1a0] hover:bg-[#3a8685]">
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Notes and Tasks */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 mb-4">
            <Button 
              variant={activeRightSection === "notes" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveRightSection("notes")}
              className={activeRightSection === "notes" ? "bg-[#46a1a0] hover:bg-[#3a8685]" : ""}
            >
              Notes
            </Button>
            <Button 
              variant={activeRightSection === "tasks" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveRightSection("tasks")}
              className={activeRightSection === "tasks" ? "bg-[#46a1a0] hover:bg-[#3a8685]" : ""}
            >
              Tasks
            </Button>
          </div>
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
                <Button size="sm" className="w-full bg-[#46a1a0] hover:bg-[#3a8685]">
                  Add Note
                </Button>
              </div>
              
              <div className="space-y-2">
                <Input 
                  placeholder="Search notes..."
                  value={searchNotes}
                  onChange={(e) => setSearchNotes(e.target.value)}
                />
              </div>
              
              <div className="text-center text-gray-500 text-sm py-8">
                No notes yet. Add your first note above.
              </div>
            </div>
          )}
          
          {activeRightSection === "tasks" && (
            <div className="space-y-4">
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full bg-[#46a1a0] hover:bg-[#3a8685]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Task Title</label>
                      <Input 
                        placeholder="Enter task title..."
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({...prev, title: e.target.value}))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea 
                        placeholder="Enter task description..."
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({...prev, description: e.target.value}))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Due Date</label>
                        <Input 
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask(prev => ({...prev, dueDate: e.target.value}))}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Due Time</label>
                        <Input 
                          type="time"
                          value={newTask.dueTime}
                          onChange={(e) => setNewTask(prev => ({...prev, dueTime: e.target.value}))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Assignee</label>
                      <Select value={newTask.assignee} onValueChange={(value) => setNewTask(prev => ({...prev, assignee: value}))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="recurring" 
                        checked={newTask.recurring}
                        onCheckedChange={(checked) => setNewTask(prev => ({...prev, recurring: !!checked}))}
                      />
                      <label htmlFor="recurring" className="text-sm">Make this a recurring task</label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-[#46a1a0] hover:bg-[#3a8685]">
                        Create Task
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="space-y-2">
                {clientTasks.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No tasks yet. Create your first task above.
                  </div>
                ) : (
                  clientTasks.map((task: Task) => (
                    <div key={task.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500">
                          Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}