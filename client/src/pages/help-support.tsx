import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Video, Tag, AlertCircle } from "lucide-react";

export default function HelpSupport() {
  const handleOpenTicket = () => {
    window.open("https://forms.clickup.com/8550434/f/84y12-104257/DMM41Y8NJ85E7UOA2N", "_blank");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Report bugs or request new features by submitting a ticket
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            How to Submit a Ticket
          </CardTitle>
          <CardDescription>
            Follow these steps to report a bug or request a feature improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open the Ticket Form
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Open the ticket form from the button below.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Use Proper Title Format
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  The ticket task must have a title starting with: <code className="bg-muted px-2 py-1 rounded text-sm font-mono">TICKET: "Issue_name"</code>
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Example: <span className="text-foreground font-medium">TICKET: "Calendar not loading events"</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Attach a Loom Video
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  The ticket task <strong>must</strong> have a Loom video attached that clearly shows:
                </p>
                <ul className="list-disc list-inside text-muted-foreground text-sm mt-2 ml-4 space-y-1">
                  <li>For bugs: Steps to recreate the issue</li>
                  <li>For improvements: What you want the app to do better</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> The more details you provide in your video, the faster we can address your ticket!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleOpenTicket}
          className="gap-2"
          data-testid="button-open-ticket"
        >
          <ExternalLink className="h-4 w-4" />
          Open Ticket in ClickUp
        </Button>
      </div>
    </div>
  );
}
