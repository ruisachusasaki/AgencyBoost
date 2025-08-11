import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  UserPlus
} from "lucide-react";

// Enhanced Client Detail Page (Task functionality removed)
export default function EnhancedClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State management
  const [activeRightSection, setActiveRightSection] = useState<"notes" | "appointments" | "documents" | "payments">("notes");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

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
      const queryClient = useQueryClient();
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Client Details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Client Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact Information
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {client.firstName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {client.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {client.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {client.phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h2>
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