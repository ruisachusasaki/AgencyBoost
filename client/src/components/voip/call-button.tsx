import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { useVoip } from "@/hooks/use-voip";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallButtonProps {
  phoneNumber: string;
  leadId: string;
  leadName: string;
  variant?: "icon" | "button";
  size?: "sm" | "default" | "lg";
}

export function CallButton({
  phoneNumber,
  leadId,
  leadName,
  variant = "icon",
  size = "sm",
}: CallButtonProps) {
  const { isReady, isConfigured, isConnecting, activeCall, makeCall, hangUp, error } = useVoip();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const isInCall = !!activeCall;
  const isCallingThisNumber = isConnecting || (isInCall && activeCall?.parameters?.To === phoneNumber.replace(/[^+\d]/g, ''));

  const handleClick = async () => {
    if (!phoneNumber) {
      toast({
        title: "No phone number",
        description: "This lead doesn't have a phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: "VoIP not configured",
        description: "Please configure Twilio Voice in Settings > Integrations.",
        variant: "destructive",
      });
      return;
    }

    if (isCallingThisNumber) {
      hangUp();
    } else if (isInCall) {
      toast({
        title: "Call in progress",
        description: "Please hang up the current call before making a new one.",
        variant: "destructive",
      });
    } else {
      try {
        await makeCall(phoneNumber, leadId, leadName);
      } catch (err) {
        toast({
          title: "Call failed",
          description: error || "Failed to connect the call. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!phoneNumber) {
    return null;
  }

  const buttonContent = () => {
    if (isConnecting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isCallingThisNumber) {
      return <PhoneOff className="h-4 w-4 text-red-500" />;
    }
    return <Phone className="h-4 w-4" />;
  };

  const tooltipText = () => {
    if (!isConfigured) return "VoIP not configured";
    if (isConnecting) return "Connecting...";
    if (isCallingThisNumber) return "Hang up";
    if (isInCall) return "Already in a call";
    return `Call ${leadName}`;
  };

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full transition-colors ${
                isCallingThisNumber
                  ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                  : isInCall
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={handleClick}
              disabled={isInCall && !isCallingThisNumber}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {buttonContent()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={isCallingThisNumber ? "destructive" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={isInCall && !isCallingThisNumber}
      className="gap-2"
    >
      {buttonContent()}
      {isConnecting ? "Connecting..." : isCallingThisNumber ? "Hang Up" : "Call"}
    </Button>
  );
}
