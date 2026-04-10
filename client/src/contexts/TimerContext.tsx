import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  userId: string;
  userName?: string;
  isRunning: boolean;
}

interface TimerContextType {
  currentTimer: TimeEntry | null;
  isTimerRunning: boolean;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: () => void;
  elapsedTime: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'agencyboost-task-timer';
const STORAGE_SIGNAL_KEY = 'agencyboost-timer-signal';
const SERVER_POLL_INTERVAL = 10000;

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

interface TimerProviderProps {
  children: ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const [currentTimer, setCurrentTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const hasBroadcastChannel = useRef(false);
  const currentTimerRef = useRef<TimeEntry | null>(null);

  const isClientPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/client-portal');

  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
    enabled: !isClientPortal,
  });

  const isTimerRunning = !!currentTimer;

  useEffect(() => {
    currentTimerRef.current = currentTimer;
  }, [currentTimer]);

  const syncFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/time-entries/running');
      if (response.ok) {
        const runningEntry = await response.json();
        if (runningEntry && runningEntry.isRunning) {
          setCurrentTimer(runningEntry);
        } else if (currentTimerRef.current) {
          setCurrentTimer(null);
          setElapsedTime(0);
        }
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;
      hasBroadcastChannel.current = true;

      channel.onmessage = (event) => {
        const { type, timer } = event.data;
        if (type === 'TIMER_STARTED') {
          setCurrentTimer(timer);
          setElapsedTime(0);
        } else if (type === 'TIMER_STOPPED') {
          setCurrentTimer(null);
          setElapsedTime(0);
        }
      };

      return () => {
        channel.close();
        broadcastRef.current = null;
        hasBroadcastChannel.current = false;
      };
    } catch {
      hasBroadcastChannel.current = false;
    }
  }, []);

  useEffect(() => {
    if (hasBroadcastChannel.current) return;

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== STORAGE_SIGNAL_KEY || !event.newValue) return;
      try {
        const { type, timer } = JSON.parse(event.newValue);
        if (type === 'TIMER_STARTED') {
          setCurrentTimer(timer);
          setElapsedTime(0);
        } else if (type === 'TIMER_STOPPED') {
          setCurrentTimer(null);
          setElapsedTime(0);
        }
      } catch {
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const broadcastTimerEvent = useCallback((type: string, timer: TimeEntry | null) => {
    try {
      broadcastRef.current?.postMessage({ type, timer });
    } catch {
    }
    if (!hasBroadcastChannel.current) {
      try {
        localStorage.setItem(STORAGE_SIGNAL_KEY, JSON.stringify({ type, timer, ts: Date.now() }));
      } catch {
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      syncFromServer();
    }
  }, [currentUser?.id, syncFromServer]);

  useEffect(() => {
    if (!currentUser?.id || isClientPortal) return;

    const interval = setInterval(syncFromServer, SERVER_POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser?.id, isClientPortal, syncFromServer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentTimer) {
      const updateElapsed = () => {
        const now = new Date().getTime();
        const startTime = new Date(currentTimer.startTime).getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTimer]);

  useEffect(() => {
    localStorage.removeItem('activeTimer');
  }, []);

  const startTimer = async (taskId: string, taskTitle: string) => {
    if (currentTimer) {
      toast({
        title: "Timer Already Running",
        description: `Please stop the current timer for "${currentTimer.taskTitle}" first.`,
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: "Please Wait",
        description: "Loading user information...",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/time-entries/start", { taskId });
      const serverEntry = await response.json();

      const timerEntry: TimeEntry = {
        id: serverEntry.id,
        taskId: serverEntry.taskId,
        taskTitle: serverEntry.taskTitle,
        startTime: serverEntry.startTime,
        userId: serverEntry.userId,
        userName: serverEntry.userName,
        isRunning: true,
      };

      setCurrentTimer(timerEntry);
      setElapsedTime(0);

      broadcastTimerEvent('TIMER_STARTED', timerEntry);

      toast({
        title: "Timer Started",
        variant: "default",
        description: `Started tracking time for "${taskTitle}"`,
      });
    } catch (error: any) {
      if (error?.status === 409 || error?.message?.includes('409')) {
        toast({
          title: "Timer Already Running",
          description: "You already have a timer running on another task.",
          variant: "destructive",
        });
        syncFromServer();
      } else {
        console.error('Error starting timer:', error);
        toast({
          title: "Error",
          description: "Failed to start timer",
          variant: "destructive",
        });
      }
    }
  };

  const stopTimer = async () => {
    if (!currentTimer) return;

    const savedTaskId = currentTimer.taskId;
    const savedEntryId = currentTimer.id;
    const savedTaskTitle = currentTimer.taskTitle;

    try {
      const response = await apiRequest("POST", "/api/time-entries/stop", {
        taskId: savedTaskId,
        entryId: savedEntryId,
      });
      const result = await response.json();

      setCurrentTimer(null);
      setElapsedTime(0);

      broadcastTimerEvent('TIMER_STOPPED', null);

      const duration = result.duration || 0;
      toast({
        title: "Timer Stopped",
        variant: "default",
        description: `Logged ${duration} minutes for "${savedTaskTitle}"`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', savedTaskId] });
    } catch (error: any) {
      console.error('Error stopping timer via server:', error);

      const status = error?.status || error?.response?.status;
      if (status === 404) {
        setCurrentTimer(null);
        setElapsedTime(0);
        broadcastTimerEvent('TIMER_STOPPED', null);
        toast({
          title: "Timer Cleared",
          variant: "default",
          description: `The task or time entry was removed. Timer has been cleared.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      } else {
        toast({
          title: "Failed to Stop Timer",
          variant: "destructive",
          description: `Could not stop the timer for "${savedTaskTitle}". Please try again.`,
        });
      }
    }
  };

  const value: TimerContextType = {
    currentTimer,
    isTimerRunning,
    startTimer,
    stopTimer,
    elapsedTime,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}
