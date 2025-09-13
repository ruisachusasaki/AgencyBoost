import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Globe, Calendar, User, Building2, Tag, FileText, Briefcase, BarChart3, CheckSquare, Receipt, Folder } from "lucide-react";
import ClientForm from "@/components/forms/client-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Client, Campaign, Task, Invoice, CustomFieldFolder } from "@shared/schema";

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

  const { data: customFieldFolders = [] } = useQuery<CustomFieldFolder[]>({
    queryKey: ["/api/custom-field-folders"],
    enabled: !!clientId,
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
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
    { id: "projects", label: "Projects", icon: Briefcase, count: projects.length },
    { id: "campaigns", label: "Campaigns", icon: BarChart3, count: campaigns.length },
    { id: "tasks", label: "Tasks", icon: CheckSquare, count: tasks.length },
    { id: "invoices", label: "Invoices", icon: Receipt, count: invoices.length },
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

  function renderProjectsContent() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No projects found for this client.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-900">{project.name}</h4>
                  {project.description && (
                    <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>Status: {project.status}</span>
                    <span>Priority: {project.priority}</span>
                    {project.budget && <span>Budget: {project.budget}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderCampaignsContent() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No campaigns found for this client.</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                  {campaign.description && (
                    <p className="text-sm text-slate-600 mt-1">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>Type: {campaign.type}</span>
                    <span>Status: {campaign.status}</span>
                    {campaign.budget && <span>Budget: {campaign.budget}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderTasksContent() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No tasks found for this client.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>Status: {task.status}</span>
                    <span>Priority: {task.priority}</span>
                    {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                    {task.dueDate && <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderInvoicesContent() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No invoices found for this client.</p>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Invoice #{invoice.invoiceNumber}</h4>
                    <span className="text-lg font-semibold text-slate-900">{invoice.total}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>Status: {invoice.status}</span>
                    <span>Amount: {invoice.amount}</span>
                    {invoice.dueDate && <span>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderCustomFieldFolderContent(folder?: CustomFieldFolder) {
    if (!folder) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Folder not found.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-[#46a1a0]" />
            {folder.name}
          </CardTitle>

        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
            <Folder className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Custom Fields Coming Soon</h3>
            <p className="text-slate-600 mb-4">
              Custom fields for this folder will appear here once they're created.
            </p>
            <p className="text-sm text-slate-500">
              Admins can add custom fields to this folder in Settings > Custom Fields.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderMainContent() {
    switch (activeSection) {
      case "overview":
        return renderOverviewContent();
      case "projects":
        return renderProjectsContent();
      case "campaigns":
        return renderCampaignsContent();
      case "tasks":
        return renderTasksContent();
      case "invoices":
        return renderInvoicesContent();
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
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <p className="text-slate-600">{client.company || "No company specified"}</p>
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