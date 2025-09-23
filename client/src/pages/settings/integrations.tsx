import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plug, Settings, Check, X, Calendar, Mail, DollarSign, MessageSquare, ExternalLink, ArrowLeft, RefreshCw, Smartphone, Send } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  features: string[];
  settingsRequired: boolean;
}

export default function Integrations() {
  const { toast } = useToast();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [location] = useLocation();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync appointments and meetings with your Google Calendar",
      icon: Calendar,
      status: "disconnected",
      lastSync: "",
      features: ["2-way calendar sync", "Meeting scheduling", "Appointment reminders"],
      settingsRequired: true
    },
    {
      id: "twilio",
      name: "Twilio SMS",
      description: "Send SMS messages and notifications to clients and leads",
      icon: Smartphone,
      status: "disconnected",
      lastSync: "",
      features: ["SMS notifications", "Client messaging", "Lead follow-ups"],
      settingsRequired: true
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "2-way sync with Gmail for email tracking and templates",
      icon: Mail,
      status: "connected",
      lastSync: "2024-08-07 14:30",
      features: ["Email tracking", "Template sync", "Conversation history"],
      settingsRequired: false
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync invoices, payments, and financial data",
      icon: DollarSign,
      status: "error",
      lastSync: "2024-08-06 09:15",
      features: ["Invoice sync", "Payment tracking", "Financial reporting"],
      settingsRequired: true
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get notifications and updates in your Slack workspace",
      icon: MessageSquare,
      status: "connected",
      lastSync: "2024-08-07 16:45",
      features: ["Real-time notifications", "Team collaboration", "Status updates"],
      settingsRequired: false
    },
    {
      id: "mailgun",
      name: "MailGun",
      description: "Professional email sending and delivery service for customer communications",
      icon: Send,
      status: "disconnected",
      lastSync: "",
      features: ["Transactional emails", "Email templates", "Delivery tracking", "Bounce handling"],
      settingsRequired: true
    }
  ]);

  const [connectionSettings, setConnectionSettings] = useState({
    apiKey: "",
    clientId: "",
    clientSecret: "",
    webhookUrl: "",
    syncFrequency: "hourly"
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check for OAuth callback parameters and Google Calendar status on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('connected') === 'google-calendar') {
      toast({
        title: "Success",
        description: "Google Calendar connected successfully!",
      });
      // Update the integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === "google-calendar" 
          ? { ...integration, status: "connected" as const, lastSync: new Date().toISOString() }
          : integration
      ));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error') === 'connection-failed') {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check Google Calendar status
    checkGoogleCalendarStatus();
    
    // Check Twilio status and load phone numbers
    checkTwilioStatus();
    loadTwilioNumbers();
    
    // Check Slack status
    checkSlackStatus();
    
    // Check MailGun status
    checkMailgunStatus();
  }, []);

  const checkGoogleCalendarStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/google-calendar/status');
      const status = await response.json();
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === "google-calendar" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : "disconnected" as const,
              lastSync: status.lastSync ? new Date(status.lastSync).toLocaleString() : ""
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
    }
  };

  const checkSlackStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/slack/status');
      const status = await response.json();
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === "slack" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : "disconnected" as const,
              lastSync: status.lastMessage ? new Date(status.lastMessage).toLocaleString() : "",
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking Slack status:', error);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "slack" 
          ? { ...integration, status: "error" as const }
          : integration
      ));
    }
  };
  
  const checkMailgunStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/mailgun/status');
      const status = await response.json();
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === "mailgun" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : "disconnected" as const,
              lastSync: status.lastSent ? new Date(status.lastSent).toLocaleString() : "",
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking MailGun status:', error);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "mailgun" 
          ? { ...integration, status: "disconnected" as const }
          : integration
      ));
    }
  };
  
  const checkTwilioStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/twilio/status');
      const status = await response.json();
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === "twilio" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : "disconnected" as const,
              lastSync: status.lastTest ? new Date(status.lastTest).toLocaleString() : "",
              phoneNumbers: status.phoneNumbers || []
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking Twilio status:', error);
    }
  };
  
  // Load all Twilio phone numbers
  const loadTwilioNumbers = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/twilio/numbers');
      const data = await response.json();
      setTwilioNumbers(data.phoneNumbers || []);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    }
  };
  
  // Delete a phone number
  const deleteTwilioNumber = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the phone number "${name}"?`)) return;
    
    setIsLoading(true);
    try {
      await apiRequest('DELETE', `/api/integrations/twilio/numbers/${id}`);
      toast({
        title: "Success",
        description: `Phone number "${name}" deleted successfully`,
      });
      
      // Refresh the lists
      loadTwilioNumbers();
      checkTwilioStatus();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete phone number",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    if (integrationId !== "google-calendar") {
      toast({
        title: "Coming Soon",
        description: "This integration is not yet available.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/google-calendar/sync');
      const result = await response.json();
      
      // Update last sync time
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, lastSync: new Date().toLocaleString() }
          : integration
      ));
      
      toast({
        title: "Sync Complete",
        description: `Synced ${result.syncedEvents} new events from Google Calendar`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Google Calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    if (integrationId === "google-calendar") {
      setIsLoading(true);
      try {
        const response = await apiRequest('POST', '/api/integrations/google-calendar/connect');
        const data = await response.json();
        
        if (data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        }
      } catch (error) {
        console.error('Connection error:', error);
        toast({
          title: "Error",
          description: "Failed to connect to Google Calendar. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    } else if (integrationId === "twilio") {
      // Open Twilio configuration dialog
      const twilioIntegration = integrations.find(i => i.id === "twilio");
      if (twilioIntegration) {
        openConfigDialog(twilioIntegration);
      }
      return;
    } else if (integrationId === "slack") {
      // Slack is already connected via environment variables
      toast({
        title: "Already Connected",
        description: "Slack integration is configured via environment variables and ready to use!",
      });
      return;
    } else if (integrationId === "mailgun") {
      // Open MailGun configuration dialog
      const mailgunIntegration = integrations.find(i => i.id === "mailgun");
      if (mailgunIntegration) {
        openConfigDialog(mailgunIntegration);
      }
      return;
    }

    toast({
      title: "Coming Soon",
      description: "This integration is not yet available.",
    });
  };

  const handleDisconnect = async (integrationId: string, integrationName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrationName}? This will stop all data syncing.`)) return;
    
    if (integrationId === "google-calendar") {
      setIsLoading(true);
      try {
        await apiRequest('POST', '/api/integrations/google-calendar/disconnect');
        
        // Update local state
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: "disconnected" as const, lastSync: "" }
            : integration
        ));
        
        toast({
          title: "Success",
          description: `Disconnected from ${integrationName}`,
        });
      } catch (error) {
        console.error('Disconnect error:', error);
        toast({
          title: "Error", 
          description: "Failed to disconnect integration. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    } else if (integrationId === "twilio") {
      setIsLoading(true);
      try {
        await apiRequest('POST', '/api/integrations/twilio/disconnect');
        
        // Update local state
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: "disconnected" as const, lastSync: "" }
            : integration
        ));
        
        toast({
          title: "Success",
          description: `Disconnected from ${integrationName}`,
        });
      } catch (error) {
        console.error('Disconnect error:', error);
        toast({
          title: "Error", 
          description: "Failed to disconnect integration. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    } else if (integrationId === "mailgun") {
      setIsLoading(true);
      try {
        await apiRequest('POST', '/api/integrations/mailgun/disconnect');
        
        // Update local state
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: "disconnected" as const, lastSync: "" }
            : integration
        ));
        
        toast({
          title: "Success",
          description: `Disconnected from ${integrationName}`,
        });
      } catch (error) {
        console.error('Disconnect error:', error);
        toast({
          title: "Error", 
          description: "Failed to disconnect integration. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    toast({
      title: "Coming Soon",
      description: "This integration is not yet available.",
    });
  };

  const handleTestConnection = async (integrationId: string) => {
    if (integrationId === "google-calendar") {
      setIsLoading(true);
      try {
        const response = await apiRequest('GET', '/api/integrations/google-calendar/status');
        const status = await response.json();
        
        if (status.connected) {
          toast({
            title: "Success",
            description: "Google Calendar connection is working correctly!",
          });
        } else {
          toast({
            title: "Connection Issue",
            description: "Google Calendar is not properly connected. Please reconnect.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Test connection error:', error);
        toast({
          title: "Error",
          description: "Failed to test connection. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    } else if (integrationId === "twilio") {
      setIsLoading(true);
      try {
        const response = await apiRequest('GET', '/api/integrations/twilio/status');
        const status = await response.json();
        
        if (status.connected) {
          toast({
            title: "Success",
            description: "Twilio SMS connection is working correctly!",
          });
        } else {
          toast({
            title: "Connection Issue",
            description: "Twilio SMS is not properly connected. Please check your credentials.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Test connection error:', error);
        toast({
          title: "Error",
          description: "Failed to test connection. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    } else if (integrationId === "slack") {
      setIsLoading(true);
      try {
        const response = await apiRequest('POST', '/api/integrations/slack/test');
        const result = await response.json();
        
        toast({
          title: "Success",
          description: "Test message sent to Slack successfully!",
        });
      } catch (error) {
        console.error('Slack test error:', error);
        toast({
          title: "Error",
          description: "Failed to send test message to Slack. Please check your configuration.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    } else if (integrationId === "mailgun") {
      setIsLoading(true);
      try {
        const response = await apiRequest('POST', '/api/integrations/mailgun/test');
        const result = await response.json();
        
        toast({
          title: "Success",
          description: "Test email sent successfully via MailGun!",
        });
      } catch (error) {
        console.error('MailGun test error:', error);
        toast({
          title: "Error",
          description: "Failed to send test email. Please check your MailGun configuration.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    toast({
      title: "Coming Soon",
      description: "This integration is not yet available.",
    });
  };

  // Twilio configuration settings
  const [twilioSettings, setTwilioSettings] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
    name: "",
    testPhoneNumber: ""
  });
  
  // State for managing multiple phone numbers
  const [twilioNumbers, setTwilioNumbers] = useState([]);
  const [showManageNumbers, setShowManageNumbers] = useState(false);
  
  // Slack configuration state
  const [isSlackConfigDialogOpen, setIsSlackConfigDialogOpen] = useState(false);
  
  // MailGun configuration state
  const [mailgunSettings, setMailgunSettings] = useState({
    apiKey: "",
    domain: "",
    testEmail: "",
    fromName: "",
    fromEmail: ""
  });
  
  const openSlackConfigDialog = () => {
    setIsSlackConfigDialogOpen(true);
  };

  const handleTwilioConnect = async () => {
    if (!twilioSettings.accountSid || !twilioSettings.authToken || !twilioSettings.phoneNumber || !twilioSettings.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Account SID, Auth Token, Phone Number, and Name).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/twilio/connect', {
        accountSid: twilioSettings.accountSid,
        authToken: twilioSettings.authToken,
        phoneNumber: twilioSettings.phoneNumber,
        name: twilioSettings.name
      });
      const result = await response.json();
      
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === "twilio" 
          ? { 
              ...integration, 
              status: "connected" as const,
              lastSync: new Date().toLocaleString()
            }
          : integration
      ));
      
      toast({
        title: "Success",
        description: result.message || "Twilio SMS phone number added successfully!",
      });
      
      // Refresh phone numbers list and status
      checkTwilioStatus();
      loadTwilioNumbers();
      
      setIsConfigDialogOpen(false);
      
      // Clear the form
      setTwilioSettings({
        accountSid: "",
        authToken: "",
        phoneNumber: "",
        name: "",
        testPhoneNumber: ""
      });
    } catch (error) {
      console.error('Twilio connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Twilio. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwilioTest = async () => {
    if (!twilioSettings.testPhoneNumber) {
      toast({
        title: "Missing Phone Number",
        description: "Please enter a test phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/twilio/test', {
        testPhoneNumber: twilioSettings.testPhoneNumber
      });
      const result = await response.json();
      
      toast({
        title: "Test SMS Sent",
        description: `Test message sent successfully to ${twilioSettings.testPhoneNumber}`,
      });
    } catch (error) {
      console.error('Twilio test error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test SMS. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMailgunConnect = async () => {
    // Check if this is an update with masked API key or new setup
    const isMaskedApiKey = mailgunSettings.apiKey === "key-*********************";
    
    if (!isMaskedApiKey && (!mailgunSettings.apiKey || !mailgunSettings.domain || !mailgunSettings.fromEmail || !mailgunSettings.fromName)) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields (API Key, Domain, From Name, and From Email).",
        variant: "destructive",
      });
      return;
    }
    
    if (isMaskedApiKey && (!mailgunSettings.domain || !mailgunSettings.fromEmail || !mailgunSettings.fromName)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Domain, From Name, and From Email).",
        variant: "destructive", 
      });
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        domain: mailgunSettings.domain,
        fromName: mailgunSettings.fromName,
        fromEmail: mailgunSettings.fromEmail,
        // Only include API key if it's not masked (meaning it's new or being updated)
        ...(isMaskedApiKey ? {} : { apiKey: mailgunSettings.apiKey })
      };
      
      const response = await apiRequest('POST', '/api/integrations/mailgun/connect', requestBody);
      const result = await response.json();
      
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === "mailgun" 
          ? { 
              ...integration, 
              status: "connected" as const,
              lastSync: new Date().toLocaleString()
            }
          : integration
      ));
      
      toast({
        title: "Success",
        description: result.message || "Mailgun connected successfully!",
      });
      
      // Refresh status
      checkMailgunStatus();
      
      setIsConfigDialogOpen(false);
      
      // Clear the form
      setMailgunSettings({
        apiKey: "",
        domain: "",
        testEmail: "",
        fromName: "",
        fromEmail: ""
      });
    } catch (error) {
      console.error('Mailgun connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Mailgun. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMailgunTest = async () => {
    if (!mailgunSettings.testEmail) {
      toast({
        title: "Missing Test Email",
        description: "Please enter a test email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/mailgun/test', {
        to: mailgunSettings.testEmail,
        fromEmail: mailgunSettings.fromEmail,
        fromName: mailgunSettings.fromName
      });
      const result = await response.json();
      
      toast({
        title: "Test Email Sent",
        description: `Test message sent successfully to ${mailgunSettings.testEmail}`,
      });
    } catch (error) {
      console.error('Mailgun test error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test email. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case "connected": return "border-l-green-500";
      case "error": return "border-l-red-500";
      default: return "border-l-gray-300";
    }
  };

  const loadMailgunConfiguration = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/mailgun/status');
      const status = await response.json();
      
      if (status.connected && status.domain) {
        // Pre-populate the form with existing configuration, but mask the API key
        setMailgunSettings({
          apiKey: "key-*********************", // Masked for security
          domain: status.domain || "",
          fromName: status.fromName || "",
          fromEmail: status.fromEmail || "",
          testEmail: "" // Always start with empty test email
        });
      }
    } catch (error) {
      console.error('Error loading MailGun configuration:', error);
      // If error loading, keep empty form
    }
  };

  const openConfigDialog = async (integration: Integration) => {
    setSelectedIntegration(integration);
    
    // Load existing configuration for MailGun
    if (integration.id === "mailgun") {
      await loadMailgunConfiguration();
    }
    
    setIsConfigDialogOpen(true);
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Check className="h-3 w-3 mr-1" />Connected</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200"><X className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back to Settings */}
        <div className="mb-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Plug className="h-8 w-8 text-primary" />
            Integrations
          </h1>
          <p className="text-gray-600 mt-2">Connect external services and tools to streamline your workflow</p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plug className="h-8 w-8 text-primary mr-3" />
                <div>
                  <div className="text-2xl font-bold">{integrations.length}</div>
                  <div className="text-sm text-gray-600">Total Integrations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{integrations.filter(i => i.status === 'connected').length}</div>
                  <div className="text-sm text-gray-600">Connected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{integrations.filter(i => i.status === 'error').length}</div>
                  <div className="text-sm text-gray-600">With Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-bold">-</span>
                </div>
                <div>
                  <div className="text-2xl font-bold">{integrations.filter(i => i.status === 'disconnected').length}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-6">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.id} className={`border-l-4 ${getStatusColor(integration.status)}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{integration.name}</h3>
                          {getStatusBadge(integration.status)}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{integration.description}</p>
                        
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                          <div className="flex flex-wrap gap-2">
                            {integration.features.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {integration.lastSync && (
                          <p className="text-xs text-gray-500">
                            Last sync: {integration.lastSync}
                          </p>
                        )}
                        
                        {/* Show phone numbers for Twilio */}
                        {integration.id === "twilio" && integration.status === "connected" && twilioNumbers.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Phone Numbers ({twilioNumbers.length}):</h5>
                            <div className="space-y-1">
                              {twilioNumbers.slice(0, showManageNumbers ? twilioNumbers.length : 2).map((number) => (
                                <div key={number.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                                  <div>
                                    <span className="font-medium">{number.name}</span>
                                    <span className="text-gray-600 ml-2">{number.phoneNumber}</span>
                                  </div>
                                  {showManageNumbers && (
                                    <button
                                      onClick={() => deleteTwilioNumber(number.id, number.name)}
                                      className="text-red-600 hover:text-red-800"
                                      disabled={isLoading}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              ))}
                              {twilioNumbers.length > 2 && !showManageNumbers && (
                                <button
                                  onClick={() => setShowManageNumbers(true)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Show all {twilioNumbers.length} numbers
                                </button>
                              )}
                              {showManageNumbers && twilioNumbers.length > 2 && (
                                <button
                                  onClick={() => setShowManageNumbers(false)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Show less
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {integration.status === "connected" && (
                        <>
                          {integration.id === "google-calendar" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(integration.id)}
                              disabled={isLoading}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                          )}
                          {integration.id === "twilio" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfigDialog(integration)}
                            >
                              <span className="mr-2">+</span>
                              Add Number
                            </Button>
                          )}
                          {integration.id === "slack" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSlackConfigDialog()}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Button>
                          )}
                          {integration.id !== "twilio" && integration.id !== "slack" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfigDialog(integration)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(integration.id)}
                            disabled={isLoading}
                          >
                            Test
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id, integration.name)}
                            disabled={isLoading}
                          >
                            Disconnect
                          </Button>
                        </>
                      )}
                      
                      {integration.status === "disconnected" && (
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Connecting..." : integration.id === "twilio" ? "Add First Number" : "Connect"}
                        </Button>
                      )}
                      
                      {integration.status === "error" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect(integration.id)}
                            disabled={isLoading}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Reconnect
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id, integration.name)}
                            disabled={isLoading}
                          >
                            Disconnect
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Configuration Dialog */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Configure {selectedIntegration?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedIntegration?.id === "google-calendar" && (
                <>
                  <div>
                    <Label htmlFor="clientId">Google Client ID</Label>
                    <Input
                      id="clientId"
                      value={connectionSettings.clientId}
                      onChange={(e) => setConnectionSettings({...connectionSettings, clientId: e.target.value})}
                      placeholder="Your Google OAuth Client ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientSecret">Google Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      value={connectionSettings.clientSecret}
                      onChange={(e) => setConnectionSettings({...connectionSettings, clientSecret: e.target.value})}
                      placeholder="Your Google OAuth Client Secret"
                    />
                  </div>
                </>
              )}
              
              {selectedIntegration?.id === "quickbooks" && (
                <>
                  <div>
                    <Label htmlFor="apiKey">QuickBooks API Key</Label>
                    <Input
                      id="apiKey"
                      value={connectionSettings.apiKey}
                      onChange={(e) => setConnectionSettings({...connectionSettings, apiKey: e.target.value})}
                      placeholder="Your QuickBooks API Key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={connectionSettings.webhookUrl}
                      onChange={(e) => setConnectionSettings({...connectionSettings, webhookUrl: e.target.value})}
                      placeholder="https://your-app.com/webhook"
                    />
                  </div>
                </>
              )}

              {selectedIntegration?.id === "twilio" && (
                <>
                  <div>
                    <Label htmlFor="numberName">Name/Purpose</Label>
                    <Input
                      id="numberName"
                      value={twilioSettings.name}
                      onChange={(e) => setTwilioSettings({...twilioSettings, name: e.target.value})}
                      placeholder="e.g., Sales, Support, Marketing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountSid">Account SID</Label>
                    <Input
                      id="accountSid"
                      value={twilioSettings.accountSid}
                      onChange={(e) => setTwilioSettings({...twilioSettings, accountSid: e.target.value})}
                      placeholder="Your Twilio Account SID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="authToken">Auth Token</Label>
                    <Input
                      id="authToken"
                      type="password"
                      value={twilioSettings.authToken}
                      onChange={(e) => setTwilioSettings({...twilioSettings, authToken: e.target.value})}
                      placeholder="Your Twilio Auth Token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={twilioSettings.phoneNumber}
                      onChange={(e) => setTwilioSettings({...twilioSettings, phoneNumber: e.target.value})}
                      placeholder="+1234567890 (E.164 format)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testPhoneNumber">Test Phone Number (Optional)</Label>
                    <Input
                      id="testPhoneNumber"
                      value={twilioSettings.testPhoneNumber}
                      onChange={(e) => setTwilioSettings({...twilioSettings, testPhoneNumber: e.target.value})}
                      placeholder="+1234567890 (for testing SMS)"
                    />
                  </div>
                </>
              )}

              {selectedIntegration?.id === "mailgun" && (
                <>
                  <div>
                    <Label htmlFor="mailgunApiKey">Mailgun API Key</Label>
                    <Input
                      id="mailgunApiKey"
                      type="password"
                      value={mailgunSettings.apiKey}
                      onChange={(e) => setMailgunSettings({...mailgunSettings, apiKey: e.target.value})}
                      placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      data-testid="input-mailgun-api-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mailgunDomain">Mailgun Domain</Label>
                    <Input
                      id="mailgunDomain"
                      value={mailgunSettings.domain}
                      onChange={(e) => setMailgunSettings({...mailgunSettings, domain: e.target.value})}
                      placeholder="your-domain.mailgun.org"
                      data-testid="input-mailgun-domain"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mailgunFromName">From Name</Label>
                    <Input
                      id="mailgunFromName"
                      value={mailgunSettings.fromName}
                      onChange={(e) => setMailgunSettings({...mailgunSettings, fromName: e.target.value})}
                      placeholder="Your Company Name"
                      data-testid="input-mailgun-from-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mailgunFromEmail">From Email</Label>
                    <Input
                      id="mailgunFromEmail"
                      type="email"
                      value={mailgunSettings.fromEmail}
                      onChange={(e) => setMailgunSettings({...mailgunSettings, fromEmail: e.target.value})}
                      placeholder="noreply@your-domain.com"
                      data-testid="input-mailgun-from-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mailgunTestEmail">Test Email Address (Optional)</Label>
                    <Input
                      id="mailgunTestEmail"
                      type="email"
                      value={mailgunSettings.testEmail}
                      onChange={(e) => setMailgunSettings({...mailgunSettings, testEmail: e.target.value})}
                      placeholder="test@your-email.com (for testing emails)"
                      data-testid="input-mailgun-test-email"
                    />
                  </div>
                  
                  {mailgunSettings.testEmail && (
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleMailgunTest}
                        disabled={isLoading}
                        data-testid="button-test-mailgun"
                      >
                        {isLoading ? "Sending..." : "Send Test Email"}
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              <div>
                <Label htmlFor="syncFreq">Sync Frequency</Label>
                <select 
                  id="syncFreq"
                  value={connectionSettings.syncFrequency}
                  onChange={(e) => setConnectionSettings({...connectionSettings, syncFrequency: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Every hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfigDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => {
                  if (selectedIntegration?.id === "twilio") {
                    handleTwilioConnect();
                  } else if (selectedIntegration?.id === "mailgun") {
                    handleMailgunConnect();
                  } else {
                    handleTestConnection(selectedIntegration?.id || "");
                  }
                }} data-testid="button-save-integration">
                  Test & Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Slack Configuration Dialog */}
        <Dialog open={isSlackConfigDialogOpen} onOpenChange={setIsSlackConfigDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Configure Slack Integration
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Current Issue</h3>
                <p className="text-yellow-700 text-sm">
                  Your Slack integration is failing due to missing bot permissions. Follow the steps below to fix this.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Step 1: Update Bot Permissions</h3>
                <ol className="text-sm text-gray-700 space-y-2 ml-4">
                  <li>1. Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://api.slack.com/apps</a></li>
                  <li>2. Select your app</li>
                  <li>3. Go to <strong>"OAuth & Permissions"</strong> in the sidebar</li>
                  <li>4. In <strong>"Bot Token Scopes"</strong>, add these permissions:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• <code className="bg-gray-100 px-1 rounded">chat:write</code> (to send messages)</li>
                      <li>• <code className="bg-gray-100 px-1 rounded">channels:read</code> (to access channel info)</li>
                    </ul>
                  </li>
                  <li>5. Click <strong>"Reinstall App"</strong> at the top of the page</li>
                  <li>6. Copy the new <strong>"Bot User OAuth Token"</strong> (starts with xoxb-)</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Step 2: Get Channel ID</h3>
                <ol className="text-sm text-gray-700 space-y-2 ml-4">
                  <li>1. Open Slack and go to your desired channel</li>
                  <li>2. Right-click the channel name and select <strong>"Copy link"</strong></li>
                  <li>3. The Channel ID is the last part of the URL (e.g., C1234567890)</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Step 3: Update Your Secrets</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm mb-3">
                    Update these environment variables in your Replit Secrets:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• <strong>SLACK_BOT_TOKEN</strong>: Your new Bot User OAuth Token</li>
                    <li>• <strong>SLACK_CHANNEL_ID</strong>: Your channel ID</li>
                  </ul>
                  <p className="text-blue-600 text-xs mt-3">
                    Go to your project settings → Secrets tab to update these values.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">💡 Pro Tip</h3>
                <p className="text-green-700 text-sm">
                  After updating your secrets, the page will automatically restart. Then you can test the connection again!
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSlackConfigDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsSlackConfigDialogOpen(false);
                    window.open('https://api.slack.com/apps', '_blank');
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Open Slack Apps
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Plug className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Integration Setup:</strong> These integrations require API keys and proper configuration to work correctly.
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Google Calendar requires OAuth 2.0 setup in Google Cloud Console</li>
                  <li>• Gmail needs Google Workspace admin approval for organization-wide access</li>
                  <li>• QuickBooks requires a developer account and app registration</li>
                  <li>• Slack integration needs workspace admin permissions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}