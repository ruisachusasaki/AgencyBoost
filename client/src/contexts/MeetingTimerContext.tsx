import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ActiveMeeting {
  id: string;
  type: 'px' | '1on1';
  title: string;
  meetingStartedAt: string;
}

interface MeetingTimerContextType {
  activeMeeting: ActiveMeeting | null;
  isMeetingTimerRunning: boolean;
  meetingElapsedTime: number;
  stopMeeting: () => Promise<void>;
  isStoppingMeeting: boolean;
}

const MeetingTimerContext = createContext<MeetingTimerContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'agencyboost-meeting-timer';

export function useMeetingTimer() {
  const context = useContext(MeetingTimerContext);
  if (context === undefined) {
    throw new Error('useMeetingTimer must be used within a MeetingTimerProvider');
  }
  return context;
}

interface MeetingTimerProviderProps {
  children: ReactNode;
}

export function MeetingTimerProvider({ children }: MeetingTimerProviderProps) {
  const [meetingElapsedTime, setMeetingElapsedTime] = useState(0);
  const [isStoppingMeeting, setIsStoppingMeeting] = useState(false);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  const isClientPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/client-portal');

  const { data: activeMeeting = null } = useQuery<ActiveMeeting | null>({
    queryKey: ['/api/meetings/active-timer'],
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    enabled: !isClientPortal,
  });

  const isMeetingTimerRunning = !!activeMeeting;

  useEffect(() => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        const { type } = event.data;
        if (type === 'MEETING_STOPPED' || type === 'MEETING_STARTED') {
          queryClient.invalidateQueries({ queryKey: ['/api/meetings/active-timer'] });
        }
      };

      return () => {
        channel.close();
        broadcastRef.current = null;
      };
    } catch {
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeMeeting?.meetingStartedAt) {
      const updateElapsed = () => {
        const now = new Date().getTime();
        const startTime = new Date(activeMeeting.meetingStartedAt).getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setMeetingElapsedTime(elapsed);
      };

      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setMeetingElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMeeting?.meetingStartedAt]);

  const stopMeeting = useCallback(async () => {
    if (!activeMeeting || isStoppingMeeting) return;

    setIsStoppingMeeting(true);
    try {
      if (activeMeeting.type === '1on1') {
        await apiRequest("POST", `/api/hr/one-on-one/meetings/${activeMeeting.id}/finish`);
      } else if (activeMeeting.type === 'px') {
        await apiRequest("POST", `/api/px-meetings/${activeMeeting.id}/finish`);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/meetings/active-timer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hr/one-on-one'] });
      queryClient.invalidateQueries({ queryKey: ['/api/px-meetings'] });

      try {
        broadcastRef.current?.postMessage({ type: 'MEETING_STOPPED' });
      } catch {
      }
    } catch (error) {
      console.error('Error stopping meeting:', error);
      throw error;
    } finally {
      setIsStoppingMeeting(false);
    }
  }, [activeMeeting, isStoppingMeeting]);

  const value: MeetingTimerContextType = {
    activeMeeting,
    isMeetingTimerRunning,
    meetingElapsedTime,
    stopMeeting,
    isStoppingMeeting,
  };

  return (
    <MeetingTimerContext.Provider value={value}>
      {children}
    </MeetingTimerContext.Provider>
  );
}
