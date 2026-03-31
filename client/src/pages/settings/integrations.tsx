import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plug, Settings, Check, X, Calendar, Mail, DollarSign, MessageSquare, ExternalLink, ArrowLeft, RefreshCw, Smartphone, Send, Zap, Copy, RotateCcw, Brain, Trash2, Plus, Edit, Star, CreditCard } from "lucide-react";
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
    },
    {
      id: "gohighlevel",
      name: "GoHighLevel",
      description: "Receive leads from GoHighLevel landing pages and forms via webhook",
      icon: Zap,
      status: "disconnected",
      lastSync: "",
      features: ["Webhook lead capture", "Auto-assign leads", "Workflow triggers", "Field mapping"],
      settingsRequired: true
    },
    {
      id: "openai",
      name: "OpenAI / AI Assistant",
      description: "Power the AI Assistant chat widget with OpenAI GPT-4 for Knowledge Base Q&A",
      icon: Brain,
      status: "disconnected",
      lastSync: "",
      features: ["AI Chat Widget", "Knowledge Base Search", "SOP/Playbook Q&A", "Context-Aware Answers"],
      settingsRequired: true
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Accept payments, process invoices, and manage subscriptions for proposals and quotes",
      icon: CreditCard,
      status: "disconnected",
      lastSync: "",
      features: ["Credit Card Payments", "ACH Bank Transfers", "Recurring Subscriptions", "Webhook Events"],
      settingsRequired: true
    }
  ]);

  const [connectionSettings, setConnectionSettings] = useState({
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "hourly",
    twoWaySync: true,
    createContacts: true,
    triggerWorkflows: true,
    blockAsAppointments: false
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // GoHighLevel specific state
  const [ghlIntegration, setGhlIntegration] = useState<any>(null);
  const [showGhlDialog, setShowGhlDialog] = useState(false);
  
  // OpenAI specific state
  const [showOpenAIDialog, setShowOpenAIDialog] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");
  const [openaiStatus, setOpenaiStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [openaiTestResult, setOpenaiTestResult] = useState<string | null>(null);

  const [showStripeDialog, setShowStripeDialog] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeTestResult, setStripeTestResult] = useState<any>(null);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [stripeConnecting, setStripeConnecting] = useState(false);

  // Check for OAuth callback parameters and Google Calendar status on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('connected') === 'google-calendar') {
      toast({
        title: "Success",
        variant: "default",
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
    loadSlackWorkspaces();
    
    // Check MailGun status
    checkMailgunStatus();
    
    // Check GoHighLevel status
    checkGoHighLevelStatus();
    
    // Check OpenAI status
    checkOpenAIStatus();
    
    // Check Stripe status
    checkStripeStatus();
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
  
  const checkGoHighLevelStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/gohighlevel/status');
      const status = await response.json();
      
      setGhlIntegration(status.integration);
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === "gohighlevel" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : "disconnected" as const,
              lastSync: status.integration?.lastLeadAt ? `${status.integration.leadsReceived} leads received` : "",
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking GoHighLevel status:', error);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "gohighlevel" 
          ? { ...integration, status: "disconnected" as const }
          : integration
      ));
    }
  };
  
  const checkOpenAIStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/openai/status');
      const status = await response.json();
      
      setOpenaiStatus(status.connected ? "connected" : "disconnected");
      setIntegrations(prev => prev.map(integration => 
        integration.id === "openai" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : "disconnected" as const,
              lastSync: status.lastTestAt ? new Date(status.lastTestAt).toLocaleString() : ""
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
      setOpenaiStatus("disconnected");
    }
  };

  const checkStripeStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/integrations/stripe/status');
      const status = await response.json();
      
      setStripeStatus(status);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "stripe" 
          ? { 
              ...integration, 
              status: status.connected ? "connected" as const : status.status === "error" ? "error" as const : "disconnected" as const,
              lastSync: status.accountName ? `Account: ${status.accountName}` : ""
            }
          : integration
      ));
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "stripe" 
          ? { ...integration, status: "disconnected" as const }
          : integration
      ));
    }
  };

  const testStripeConnection = async () => {
    setIsLoading(true);
    setStripeTestResult(null);
    try {
      const response = await apiRequest('POST', '/api/integrations/stripe/test');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setStripeTestResult(result);
        toast({
          title: "Success",
          variant: "default",
          description: "Stripe connection test successful!",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message || "Stripe connection test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Stripe test error:', error);
      toast({
        title: "Error",
        description: "Failed to test Stripe connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoHighLevel = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/gohighlevel/connect', {
        name: 'GoHighLevel',
        defaultSource: 'GoHighLevel',
        triggerWorkflows: true
      });
      const result = await response.json();
      
      setGhlIntegration(result.integration);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "gohighlevel" 
          ? { ...integration, status: "connected" as const }
          : integration
      ));
      
      toast({
        title: "Success",
        variant: "default",
        description: "GoHighLevel integration connected successfully!",
      });
    } catch (error) {
      console.error('Error connecting GoHighLevel:', error);
      toast({
        title: "Error",
        description: "Failed to connect GoHighLevel integration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const connectOpenAI = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/openai/connect', {
        apiKey: openaiApiKey,
        model: openaiModel
      });
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          variant: "default",
          description: "OpenAI connected successfully!",
        });
        setShowOpenAIDialog(false);
        setOpenaiApiKey("");
        checkOpenAIStatus();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to connect OpenAI",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting OpenAI:', error);
      toast({
        title: "Error",
        description: "Failed to connect to OpenAI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectOpenAI = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/integrations/openai/disconnect');
      toast({
        title: "Success",
        variant: "default",
        description: "OpenAI disconnected successfully",
      });
      checkOpenAIStatus();
    } catch (error) {
      console.error('Error disconnecting OpenAI:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect OpenAI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAI = async () => {
    setIsLoading(true);
    setOpenaiTestResult(null);
    try {
      const response = await apiRequest('POST', '/api/integrations/openai/test');
      const result = await response.json();
      
      if (response.ok) {
        setOpenaiTestResult(result.response || "Connection successful!");
        toast({
          title: "Success",
          variant: "default",
          description: "OpenAI test successful!",
        });
      } else {
        setOpenaiTestResult(null);
        toast({
          title: "Test Failed",
          description: result.message || "OpenAI test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing OpenAI:', error);
      setOpenaiTestResult(null);
      toast({
        title: "Error",
        description: "Failed to test OpenAI connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoHighLevel = async () => {
    if (!ghlIntegration?.id) return;
    
    setIsLoading(true);
    try {
      await apiRequest('DELETE', `/api/integrations/gohighlevel/${ghlIntegration.id}`);
      
      setGhlIntegration(null);
      setIntegrations(prev => prev.map(integration => 
        integration.id === "gohighlevel" 
          ? { ...integration, status: "disconnected" as const, lastSync: "" }
          : integration
      ));
      setShowGhlDialog(false);
      
      toast({
        title: "Success",
        variant: "default",
        description: "GoHighLevel integration disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting GoHighLevel:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect GoHighLevel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const regenerateGhlToken = async () => {
    if (!ghlIntegration?.id) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/integrations/gohighlevel/${ghlIntegration.id}/regenerate-token`);
      const result = await response.json();
      
      setGhlIntegration((prev: any) => ({ ...prev, webhookUrl: result.webhookUrl }));
      
      toast({
        title: "Success",
        variant: "default",
        description: "Webhook URL regenerated. Update this in GoHighLevel.",
      });
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate webhook token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyWebhookUrl = () => {
    if (ghlIntegration?.webhookUrl) {
      navigator.clipboard.writeText(ghlIntegration.webhookUrl);
      toast({
        title: "Copied!",
        variant: "default",
        description: "Webhook URL copied to clipboard",
      });
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
      setIsSlackConfigDialogOpen(true);
      return;
    } else if (integrationId === "mailgun") {
      // Open MailGun configuration dialog
      const mailgunIntegration = integrations.find(i => i.id === "mailgun");
      if (mailgunIntegration) {
        openConfigDialog(mailgunIntegration);
      }
      return;
    } else if (integrationId === "gohighlevel") {
      // Connect GoHighLevel - generates webhook URL
      const ghlIntegrationData = integrations.find(i => i.id === "gohighlevel");
      if (ghlIntegrationData?.status === "connected") {
        setShowGhlDialog(true);
      } else {
        await connectGoHighLevel();
        setShowGhlDialog(true);
      }
      return;
    } else if (integrationId === "openai") {
      setShowOpenAIDialog(true);
      return;
    } else if (integrationId === "stripe") {
      setShowStripeDialog(true);
      return;
    }

    toast({
      title: "Coming Soon",
      variant: "default",
      description: "This integration is not yet available.",
    });
  };

  const handleStripeConnect = async () => {
    if (!stripeSecretKey) {
      toast({
        title: "Error",
        description: "Secret Key is required",
        variant: "destructive",
      });
      return;
    }

    setStripeConnecting(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/stripe/connect', {
        secretKey: stripeSecretKey,
        publishableKey: stripePublishableKey || undefined,
        webhookSecret: stripeWebhookSecret || undefined,
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Stripe connected successfully${result.accountName ? ` (${result.accountName})` : ''}`,
        });
        setStripeSecretKey("");
        setStripePublishableKey("");
        setStripeWebhookSecret("");
        await checkStripeStatus();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to connect Stripe",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Stripe",
        variant: "destructive",
      });
    } finally {
      setStripeConnecting(false);
    }
  };

  const handleStripeDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Stripe? Payment processing will stop working.")) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/stripe/disconnect');
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Disconnected",
          description: "Stripe has been disconnected",
        });
        await checkStripeStatus();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Stripe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string, integrationName: string) => {
    if (integrationId === "stripe") {
      await handleStripeDisconnect();
      return;
    }
    
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
          variant: "default",
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
          variant: "default",
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
          variant: "default",
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
      variant: "default",
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
            variant: "default",
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
            variant: "default",
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
          variant: "default",
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
          variant: "default",
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
    } else if (integrationId === "stripe") {
      await testStripeConnection();
      return;
    }

    toast({
      title: "Coming Soon",
      variant: "default",
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

  // Slack Workspaces management state
  interface SlackWorkspace {
    id: string;
    name: string;
    teamId: string | null;
    teamName: string | null;
    botToken: string;
    botUserId: string | null;
    signingSecret: string | null;
    isActive: boolean;
    isDefault: boolean;
    lastTestAt: string | null;
    connectionErrors: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  const [slackWorkspaces, setSlackWorkspaces] = useState<SlackWorkspace[]>([]);
  const [showAddWorkspaceDialog, setShowAddWorkspaceDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<SlackWorkspace | null>(null);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    botToken: "",
    signingSecret: "",
    isDefault: false
  });
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [testingWorkspaceId, setTestingWorkspaceId] = useState<string | null>(null);

  const loadSlackWorkspaces = async () => {
    try {
      setIsLoadingWorkspaces(true);
      const response = await apiRequest('GET', '/api/integrations/slack/workspaces');
      const workspaces = await response.json();
      setSlackWorkspaces(workspaces);
    } catch (error) {
      console.error('Error loading Slack workspaces:', error);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const handleAddWorkspace = async () => {
    if (!newWorkspace.name || !newWorkspace.botToken) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and bot token.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/slack/workspaces', newWorkspace);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add workspace');
      }
      const workspace = await response.json();
      setSlackWorkspaces(prev => [...prev, workspace]);
      setNewWorkspace({ name: "", botToken: "", signingSecret: "", isDefault: false });
      setShowAddWorkspaceDialog(false);
      toast({
        title: "Workspace Added",
        variant: "default",
        description: `Successfully connected to ${workspace.teamName || workspace.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to workspace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/integrations/slack/workspaces/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }
      setSlackWorkspaces(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Workspace Deleted",
        variant: "default",
        description: "Workspace removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete workspace",
        variant: "destructive",
      });
    }
  };

  const handleTestWorkspace = async (id: string) => {
    setTestingWorkspaceId(id);
    try {
      const response = await apiRequest('POST', `/api/integrations/slack/workspaces/${id}/test`);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          variant: "default",
          description: `Connected to ${result.team} as ${result.user}`,
        });
        loadSlackWorkspaces();
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTestingWorkspaceId(null);
    }
  };

  const handleSetDefaultWorkspace = async (id: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/integrations/slack/workspaces/${id}`, { isDefault: true });
      if (!response.ok) {
        throw new Error('Failed to set default');
      }
      loadSlackWorkspaces();
      toast({
        title: "Default Set",
        variant: "default",
        description: "Default workspace updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    }
  };
  
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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
    <div className="container mx-auto p-6">
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
                          {integration.id === "stripe" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowStripeDialog(true)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Button>
                          )}
                          {integration.id !== "twilio" && integration.id !== "slack" && integration.id !== "stripe" && (
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      Google Calendar credentials are configured on the server. Simply click <strong>Connect</strong> on the integration card to link your Google account.
                    </p>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-3">Sync Preferences</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Two-Way Sync</Label>
                          <p className="text-xs text-gray-500">
                            Events created in either system will sync automatically
                          </p>
                        </div>
                        <Switch 
                          checked={connectionSettings.twoWaySync || false}
                          onCheckedChange={(checked) => setConnectionSettings({...connectionSettings, twoWaySync: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Create Contacts from Events</Label>
                          <p className="text-xs text-gray-500">
                            Automatically create contacts for guests in Google events
                          </p>
                        </div>
                        <Switch 
                          checked={connectionSettings.createContacts || false}
                          onCheckedChange={(checked) => setConnectionSettings({...connectionSettings, createContacts: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Trigger Workflows</Label>
                          <p className="text-xs text-gray-500">
                            Run automation workflows for synced appointments
                          </p>
                        </div>
                        <Switch 
                          checked={connectionSettings.triggerWorkflows || false}
                          onCheckedChange={(checked) => setConnectionSettings({...connectionSettings, triggerWorkflows: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Block as Appointments</Label>
                          <p className="text-xs text-gray-500">
                            External events create full appointments (vs just blocking time)
                          </p>
                        </div>
                        <Switch 
                          checked={connectionSettings.blockAsAppointments || false}
                          onCheckedChange={(checked) => setConnectionSettings({...connectionSettings, blockAsAppointments: checked})}
                        />
                      </div>
                    </div>
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

        {/* Slack Workspaces Management Dialog */}
        <Dialog open={isSlackConfigDialogOpen} onOpenChange={setIsSlackConfigDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Slack Workspaces
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Workspace List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Connected Workspaces</h3>
                  <Button
                    onClick={() => setShowAddWorkspaceDialog(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Workspace
                  </Button>
                </div>

                {isLoadingWorkspaces ? (
                  <div className="text-center py-8 text-gray-500">Loading workspaces...</div>
                ) : slackWorkspaces.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No Slack workspaces connected yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Workspace" to connect your first workspace</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slackWorkspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{workspace.name}</span>
                              {workspace.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Default
                                </Badge>
                              )}
                              {workspace.isActive ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Connected</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            {workspace.teamName && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Team: {workspace.teamName}
                              </p>
                            )}
                            {workspace.connectionErrors && (
                              <p className="text-sm text-red-500 mt-1">
                                Error: {workspace.connectionErrors}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Token: {workspace.botToken}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!workspace.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultWorkspace(workspace.id)}
                                title="Set as default"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestWorkspace(workspace.id)}
                              disabled={testingWorkspaceId === workspace.id}
                            >
                              {testingWorkspaceId === workspace.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWorkspace(workspace.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Setup Instructions */}
              <div className="border-t pt-4">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    How to get a Bot Token from Slack
                  </summary>
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4">
                    <ol className="list-decimal space-y-1">
                      <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">api.slack.com/apps</a></li>
                      <li>Click "Create New App" → "From scratch"</li>
                      <li>Give it a name and select your workspace</li>
                      <li>Go to "OAuth & Permissions" and add these Bot Token Scopes:
                        <ul className="list-disc ml-4 mt-1">
                          <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">chat:write</code></li>
                          <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">channels:read</code></li>
                          <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">users:read</code></li>
                        </ul>
                      </li>
                      <li>Click "Install to Workspace" and authorize</li>
                      <li>Copy the "Bot User OAuth Token" (starts with xoxb-)</li>
                    </ol>
                  </div>
                </details>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsSlackConfigDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Workspace Dialog */}
        <Dialog open={showAddWorkspaceDialog} onOpenChange={setShowAddWorkspaceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Slack Workspace</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name *</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Agency Team, Client Workspace"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                />
                <p className="text-xs text-gray-500">A friendly name to identify this workspace</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot User OAuth Token *</Label>
                <Input
                  id="bot-token"
                  placeholder="xoxb-..."
                  value={newWorkspace.botToken}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, botToken: e.target.value }))}
                  type="password"
                />
                <p className="text-xs text-gray-500">Found in your Slack app's OAuth & Permissions page</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signing-secret">Signing Secret (Optional)</Label>
                <Input
                  id="signing-secret"
                  placeholder="For webhook signature verification"
                  value={newWorkspace.signingSecret}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, signingSecret: e.target.value }))}
                  type="password"
                />
                <p className="text-xs text-gray-500">Used to verify webhook events from Slack</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={newWorkspace.isDefault}
                  onCheckedChange={(checked) => setNewWorkspace(prev => ({ ...prev, isDefault: checked }))}
                />
                <Label htmlFor="is-default">Set as default workspace</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddWorkspaceDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWorkspace}
                  disabled={isLoading || !newWorkspace.name || !newWorkspace.botToken}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Add Workspace"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* GoHighLevel Configuration Dialog */}
        <Dialog open={showGhlDialog} onOpenChange={setShowGhlDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                GoHighLevel Integration
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {ghlIntegration ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Webhook URL</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Copy this URL and paste it into your GoHighLevel landing page or form webhook settings.
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        value={ghlIntegration.webhookUrl || ''} 
                        readOnly 
                        className="flex-1 font-mono text-xs"
                        data-testid="input-ghl-webhook-url"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={copyWebhookUrl}
                        data-testid="button-copy-webhook"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">Integration Stats</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Leads Received:</span>
                        <span className="ml-2 font-semibold">{ghlIntegration.leadsReceived || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                      </div>
                      {ghlIntegration.lastLeadAt && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Last Lead:</span>
                          <span className="ml-2">{new Date(ghlIntegration.lastLeadAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Default Lead Source</Label>
                    <Input 
                      value={ghlIntegration.defaultSource || 'GoHighLevel'} 
                      readOnly 
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Trigger Workflows</span>
                      <p className="text-xs text-gray-500">Run automation when leads arrive</p>
                    </div>
                    <Badge className={ghlIntegration.triggerWorkflows ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {ghlIntegration.triggerWorkflows ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <Button
                      variant="outline"
                      onClick={regenerateGhlToken}
                      disabled={isLoading}
                      className="w-full"
                      data-testid="button-regenerate-token"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate Webhook URL
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      This will invalidate the old URL. Update it in GoHighLevel after regenerating.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      onClick={disconnectGoHighLevel}
                      disabled={isLoading}
                      data-testid="button-disconnect-ghl"
                    >
                      Disconnect
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowGhlDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Setting up GoHighLevel integration...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* OpenAI Configuration Dialog */}
        <Dialog open={showOpenAIDialog} onOpenChange={setShowOpenAIDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Configure OpenAI / AI Assistant
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {openaiStatus === "connected" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">OpenAI Connected</span>
                  </div>
                  
                  {openaiTestResult && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Last Test Response:</p>
                      <p className="text-sm font-medium">{openaiTestResult}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={testOpenAI}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Test Connection
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={disconnectOpenAI}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Connect your OpenAI API key to enable the AI Assistant chat widget. The AI Assistant will search your Knowledge Base articles to answer team questions.
                  </p>
                  
                  <div>
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from{" "}
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-primary hover:underline">
                        OpenAI Platform
                      </a>
                    </p>
                  </div>
                  
                  <Button
                    onClick={connectOpenAI}
                    disabled={isLoading || !openaiApiKey.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Connect OpenAI
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Stripe Configuration Dialog */}
        <Dialog open={showStripeDialog} onOpenChange={(open) => {
          setShowStripeDialog(open);
          if (!open) {
            setStripeSecretKey("");
            setStripePublishableKey("");
            setStripeWebhookSecret("");
            setStripeTestResult(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Stripe Integration
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {stripeStatus?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">Stripe Connected</span>
                  </div>

                  {stripeStatus.accountName && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Account</p>
                      <p className="text-sm font-medium">{stripeStatus.accountName}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">Configuration Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Secret Key</span>
                        {stripeStatus.secretKey ? (
                          <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Set</Badge>
                        ) : (
                          <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Missing</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Publishable Key</span>
                        {stripeStatus.publishableKey ? (
                          <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Set</Badge>
                        ) : (
                          <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Not Set</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Webhook Secret</span>
                        {stripeStatus.webhookSecret ? (
                          <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Set</Badge>
                        ) : (
                          <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Not Set</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {stripeTestResult && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                      <p className="text-sm text-gray-600">Last Test Result:</p>
                      <p className="text-sm font-medium">{stripeTestResult.message}</p>
                      <p className="text-xs text-gray-500">
                        Mode: {stripeTestResult.livemode ? "Live" : "Test"} | Currency: {stripeTestResult.currency}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={testStripeConnection}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Test Connection
                  </Button>

                  <div className="border-t pt-3">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                        Update Stripe Keys
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Secret Key <span className="text-red-500">*</span></label>
                          <Input
                            type="password"
                            placeholder="sk_live_... or sk_test_..."
                            value={stripeSecretKey}
                            onChange={(e) => setStripeSecretKey(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Publishable Key</label>
                          <Input
                            type="password"
                            placeholder="pk_live_... or pk_test_..."
                            value={stripePublishableKey}
                            onChange={(e) => setStripePublishableKey(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Webhook Secret</label>
                          <Input
                            type="password"
                            placeholder="whsec_..."
                            value={stripeWebhookSecret}
                            onChange={(e) => setStripeWebhookSecret(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={handleStripeConnect}
                          disabled={stripeConnecting || !stripeSecretKey}
                          className="w-full"
                        >
                          {stripeConnecting ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Updating...</>
                          ) : (
                            "Update Keys"
                          )}
                        </Button>
                      </div>
                    </details>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={handleStripeDisconnect}
                    disabled={isLoading}
                    className="w-full"
                    size="sm"
                  >
                    Disconnect Stripe
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Stripe powers payment processing for proposals and quotes. Enter your API keys below to connect.
                  </p>

                  {stripeStatus?.status === "error" && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <X className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 text-sm">{stripeStatus.error || "Connection error"}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Secret Key <span className="text-red-500">*</span></label>
                      <Input
                        type="password"
                        placeholder="sk_live_... or sk_test_..."
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Publishable Key</label>
                      <Input
                        type="password"
                        placeholder="pk_live_... or pk_test_..."
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Webhook Secret</label>
                      <Input
                        type="password"
                        placeholder="whsec_..."
                        value={stripeWebhookSecret}
                        onChange={(e) => setStripeWebhookSecret(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleStripeConnect}
                    disabled={stripeConnecting || !stripeSecretKey}
                    className="w-full"
                  >
                    {stripeConnecting ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                    ) : (
                      "Connect Stripe"
                    )}
                  </Button>

                  <div className="border-t pt-3">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                        How to get your Stripe keys
                      </summary>
                      <div className="mt-3 text-sm text-gray-600 space-y-2 ml-4">
                        <ol className="list-decimal space-y-1">
                          <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard &rarr; API Keys</a></li>
                          <li>Copy your Secret Key and Publishable Key</li>
                          <li>Paste them in the fields above</li>
                          <li>For webhooks, create a webhook endpoint and copy the signing secret</li>
                        </ol>
                      </div>
                    </details>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setShowStripeDialog(false)}>
                  Close
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
                  <li>• Stripe API keys can be configured directly from the integration settings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
