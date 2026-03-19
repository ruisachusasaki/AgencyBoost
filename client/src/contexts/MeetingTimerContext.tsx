import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

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
}

const MeetingTimerContext = createContext<MeetingTimerContextType | undefined>(undefined);

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

  const { data: activeMeeting = null } = useQuery<ActiveMeeting | null>({
    queryKey: ['/api/meetings/active-timer'],
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  const isMeetingTimerRunning = !!activeMeeting;

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

  const value: MeetingTimerContextType = {
    activeMeeting,
    isMeetingTimerRunning,
    meetingElapsedTime,
  };

  return (
    <MeetingTimerContext.Provider value={value}>
      {children}
    </MeetingTimerContext.Provider>
  );
}
