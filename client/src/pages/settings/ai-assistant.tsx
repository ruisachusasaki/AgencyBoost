import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Bot,
  Save,
  Lightbulb,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AiAssistantSettings {
  id?: string;
  customInstructions: string | null;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AiAssistantSettings() {
  const { toast } = useToast();

  const [customInstructions, setCustomInstructions] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const { data: settings, isLoading } = useQuery<AiAssistantSettings>({
    queryKey: ['/api/ai-assistant/settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { customInstructions: string; isEnabled: boolean }) => {
      const res = await apiRequest('PUT', '/api/ai-assistant/settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-assistant/settings'] });
      toast({
        title: "Settings Updated",
        variant: "success",
        description: "AI Assistant settings have been successfully saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update AI Assistant settings",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings) {
      setCustomInstructions(settings.customInstructions || "");
      setIsEnabled(settings.isEnabled ?? true);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettingsMutation.mutate({
      customInstructions,
      isEnabled
    });
  };

  const exampleInstructions = `Example instructions you can add:

• When users ask about tasks, direct them to the Tasks page in the left sidebar under Projects.

• AgencyBoost has these main sections: Dashboard, Clients, Projects, Tasks, Calendar, HR, Reports, and Settings.

• When users ask about adding clients, they should go to Clients in the sidebar and click "Add Client".

• Time tracking is available on task cards - click the timer icon to start tracking time.

• For generating invoices, go to Clients > select a client > Invoices tab.

• The Knowledge Base (Resources > Articles) contains SOPs and playbooks for common processes.`;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Assistant Settings</h1>
            <p className="text-muted-foreground">Teach the AI Assistant about your AgencyBoost setup</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant Status
            </CardTitle>
            <CardDescription>
              Enable or disable the AI Assistant for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Switch
                id="ai-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                disabled={isLoading}
              />
              <Label htmlFor="ai-enabled" className="cursor-pointer">
                {isEnabled ? "AI Assistant is enabled" : "AI Assistant is disabled"}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Custom Instructions
            </CardTitle>
            <CardDescription>
              Teach the AI Assistant about your specific AgencyBoost setup, features, and processes. 
              These instructions are included in every AI response to help provide accurate, relevant answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> The AI Assistant will still search your Knowledge Base articles first. 
                Custom instructions supplement the Knowledge Base to help the AI give better answers when no specific article exists.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="custom-instructions">
                Instructions for the AI Assistant
              </Label>
              <Textarea
                id="custom-instructions"
                placeholder="Enter instructions to help the AI Assistant understand your AgencyBoost setup..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                {customInstructions.length} characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending || isLoading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Instructions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Example Instructions
            </CardTitle>
            <CardDescription>
              Here are some example instructions you can use as a starting point
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap font-mono">
              {exampleInstructions}
            </pre>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCustomInstructions(exampleInstructions);
                  toast({
                    title: "Examples Loaded",
                    description: "Example instructions have been loaded. Customize them for your setup and save.",
                  });
                }}
              >
                Use These Examples
              </Button>
            </div>
          </CardContent>
        </Card>

        {settings?.updatedAt && (
          <p className="text-sm text-muted-foreground text-center">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
