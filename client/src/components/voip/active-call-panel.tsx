import { useVoip } from "@/hooks/use-voip";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, User } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ActiveCallPanel() {
  const { activeCall, isConnecting, callDuration, isMuted, hangUp, toggleMute, callerIdNumber } = useVoip();

  if (!activeCall && !isConnecting) {
    return null;
  }

  const calleeNumber = activeCall?.parameters?.To || "Unknown";

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border rounded-xl shadow-2xl p-4 min-w-[280px] animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          isConnecting ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-green-100 dark:bg-green-900/30"
        )}>
          {isConnecting ? (
            <Phone className="h-6 w-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
          ) : (
            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {isConnecting ? "Connecting..." : "In Call"}
          </p>
          <p className="text-sm text-muted-foreground truncate">{calleeNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-semibold text-primary">
            {formatDuration(callDuration)}
          </p>
          {callerIdNumber && (
            <p className="text-xs text-muted-foreground">From: {callerIdNumber}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          variant={isMuted ? "secondary" : "outline"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14",
            isMuted && "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30"
          )}
          onClick={toggleMute}
          disabled={isConnecting}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={hangUp}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
