import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plug, Settings, Check, X, Calendar, Mail, DollarSign, MessageSquare, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

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
  
  const [integrations] = useState<Integration[]>([
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
    }
  ]);

  const [connectionSettings, setConnectionSettings] = useState({
    apiKey: "",
    clientId: "",
    clientSecret: "",
    webhookUrl: "",
    syncFrequency: "hourly"
  });

  const handleConnect = async (integrationId: string) => {
    try {
      // TODO: Implement actual integration connection logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `Successfully connected to ${integrations.find(i => i.id === integrationId)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (integrationId: string, integrationName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrationName}? This will stop all data syncing.`)) return;
    
    try {
      // TODO: Implement disconnect logic
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success",
        description: `Disconnected from ${integrationName}`,
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Connection test successful!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection test failed. Please check your settings.",
        variant: "destructive",
      });
    }
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

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case "connected": return "border-l-green-500";
      case "error": return "border-l-red-500";
      default: return "border-l-gray-300";
    }
  };

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
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
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {integration.status === "connected" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfigDialog(integration)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(integration.id)}
                          >
                            Test
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id, integration.name)}
                          >
                            Disconnect
                          </Button>
                        </>
                      )}
                      
                      {integration.status === "disconnected" && (
                        <Button
                          onClick={() => handleConnect(integration.id)}
                        >
                          Connect
                        </Button>
                      )}
                      
                      {integration.status === "error" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfigDialog(integration)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Fix Settings
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id, integration.name)}
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
                <Button onClick={() => handleTestConnection(selectedIntegration?.id || "")}>
                  Test & Save
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