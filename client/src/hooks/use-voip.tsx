import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import { apiRequest } from "@/lib/queryClient";

interface VoipContextType {
  isReady: boolean;
  isConfigured: boolean;
  isConnecting: boolean;
  activeCall: Call | null;
  callDuration: number;
  isMuted: boolean;
  callerIdNumber: string | null;
  error: string | null;
  makeCall: (phoneNumber: string, leadId: string, leadName: string) => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  checkConfiguration: () => Promise<void>;
}

const VoipContext = createContext<VoipContextType | null>(null);

export function VoipProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callerIdNumber, setCallerIdNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const deviceRef = useRef<Device | null>(null);
  const callStartTime = useRef<Date | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const currentCallInfo = useRef<{ leadId: string; leadName: string; phoneNumber: string } | null>(null);
  const initializationPromise = useRef<Promise<Device | null> | null>(null);

  const checkConfiguration = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/twilio/voice-status", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConfigured(data.configured);
        setCallerIdNumber(data.callerIdNumber);
        if (!data.configured) {
          setError(data.message);
        } else {
          setError(null);
        }
      }
    } catch (err) {
      console.error("Failed to check VoIP configuration:", err);
      setIsConfigured(false);
    }
  }, []);

  const initializeDevice = useCallback(async (): Promise<Device | null> => {
    if (initializationPromise.current) {
      return initializationPromise.current;
    }
    
    if (deviceRef.current) {
      return deviceRef.current;
    }

    initializationPromise.current = (async () => {
      try {
        const response = await fetch("/api/integrations/twilio/voice-token", {
          credentials: "include",
        });
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Failed to get voice token");
          initializationPromise.current = null;
          return null;
        }

        const { token, callerIdNumber: callerId } = await response.json();
        setCallerIdNumber(callerId);

        const newDevice = new Device(token, {
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
          allowIncomingWhileBusy: false,
        });

        const registrationPromise = new Promise<Device>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Device registration timed out"));
          }, 15000);

          newDevice.on("registered", () => {
            console.log("[VoIP] Device registered");
            clearTimeout(timeout);
            setIsReady(true);
            setError(null);
            resolve(newDevice);
          });

          newDevice.on("error", (deviceError) => {
            console.error("[VoIP] Device error:", deviceError);
            clearTimeout(timeout);
            setError(deviceError.message);
            reject(deviceError);
          });
        });

        newDevice.on("unregistered", () => {
          console.log("[VoIP] Device unregistered");
          setIsReady(false);
        });

        newDevice.on("tokenWillExpire", async () => {
          console.log("[VoIP] Token expiring, refreshing...");
          try {
            const refreshResponse = await fetch("/api/integrations/twilio/voice-token", {
              credentials: "include",
            });
            if (refreshResponse.ok) {
              const { token: newToken } = await refreshResponse.json();
              newDevice.updateToken(newToken);
            }
          } catch (err) {
            console.error("[VoIP] Failed to refresh token:", err);
          }
        });

        await newDevice.register();
        
        const registeredDevice = await registrationPromise;
        deviceRef.current = registeredDevice;
        return registeredDevice;
      } catch (err) {
        console.error("[VoIP] Failed to initialize device:", err);
        setError("Failed to initialize calling device");
        initializationPromise.current = null;
        return null;
      }
    })();

    return initializationPromise.current;
  }, []);

  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  useEffect(() => {
    if (isConfigured && !deviceRef.current) {
      initializeDevice();
    }
    
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
      initializationPromise.current = null;
    };
  }, [isConfigured, initializeDevice]);

  const startDurationTimer = useCallback(() => {
    callStartTime.current = new Date();
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const elapsed = Math.floor((Date.now() - callStartTime.current.getTime()) / 1000);
        setCallDuration(elapsed);
      }
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    callStartTime.current = null;
  }, []);

  const logCall = useCallback(async (status: string, duration: number, callSid: string) => {
    if (!currentCallInfo.current) return;
    
    try {
      await apiRequest("POST", "/api/integrations/twilio/call-log", {
        leadId: currentCallInfo.current.leadId,
        leadName: currentCallInfo.current.leadName,
        phoneNumber: currentCallInfo.current.phoneNumber,
        duration,
        callSid: callSid || "unknown",
        status,
      });
    } catch (err) {
      console.error("[VoIP] Failed to log call:", err);
    }
  }, []);

  const makeCall = useCallback(async (phoneNumber: string, leadId: string, leadName: string) => {
    if (!isConfigured) {
      setError("VoIP calling is not configured. Please set up Twilio in Settings.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    let currentDevice = deviceRef.current;
    
    if (!currentDevice) {
      currentDevice = await initializeDevice();
    }

    if (!currentDevice) {
      setError("Calling device not ready. Please try again.");
      setIsConnecting(false);
      return;
    }

    currentCallInfo.current = { leadId, leadName, phoneNumber };

    try {
      const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
      
      const call = await currentDevice.connect({
        params: {
          To: cleanNumber,
        },
      });

      call.on("accept", () => {
        console.log("[VoIP] Call accepted");
        setIsConnecting(false);
        startDurationTimer();
      });

      call.on("disconnect", () => {
        console.log("[VoIP] Call disconnected");
        const finalDuration = callStartTime.current 
          ? Math.floor((Date.now() - callStartTime.current.getTime()) / 1000) 
          : 0;
        logCall("completed", finalDuration, call.parameters?.CallSid || "unknown");
        setActiveCall(null);
        setCallDuration(0);
        setIsMuted(false);
        stopDurationTimer();
        currentCallInfo.current = null;
      });

      call.on("cancel", () => {
        console.log("[VoIP] Call cancelled");
        logCall("cancelled", 0, call.parameters?.CallSid || "unknown");
        setActiveCall(null);
        setIsConnecting(false);
        stopDurationTimer();
        currentCallInfo.current = null;
      });

      call.on("error", (callError) => {
        console.error("[VoIP] Call error:", callError);
        setError(callError.message);
        setActiveCall(null);
        setIsConnecting(false);
        stopDurationTimer();
        currentCallInfo.current = null;
      });

      call.on("reject", () => {
        console.log("[VoIP] Call rejected");
        logCall("rejected", 0, call.parameters?.CallSid || "unknown");
        setActiveCall(null);
        setIsConnecting(false);
        stopDurationTimer();
        currentCallInfo.current = null;
      });

      setActiveCall(call);
    } catch (err) {
      console.error("[VoIP] Failed to make call:", err);
      setError("Failed to connect call");
      setIsConnecting(false);
      currentCallInfo.current = null;
    }
  }, [isConfigured, initializeDevice, startDurationTimer, stopDurationTimer, logCall]);

  const hangUp = useCallback(() => {
    if (activeCall) {
      activeCall.disconnect();
    }
  }, [activeCall]);

  const toggleMute = useCallback(() => {
    if (activeCall) {
      const newMuteState = !isMuted;
      activeCall.mute(newMuteState);
      setIsMuted(newMuteState);
    }
  }, [activeCall, isMuted]);

  return (
    <VoipContext.Provider
      value={{
        isReady,
        isConfigured,
        isConnecting,
        activeCall,
        callDuration,
        isMuted,
        callerIdNumber,
        error,
        makeCall,
        hangUp,
        toggleMute,
        checkConfiguration,
      }}
    >
      {children}
    </VoipContext.Provider>
  );
}

export function useVoip() {
  const context = useContext(VoipContext);
  if (!context) {
    throw new Error("useVoip must be used within a VoipProvider");
  }
  return context;
}
