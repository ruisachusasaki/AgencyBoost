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

  const isClientPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/client-portal');

  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
    enabled: !isClientPortal,
  });

  const isTimerRunning = !!currentTimer;

  useEffect(() => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        const { type, timer } = event.data;
        if (type === 'TIMER_STARTED') {
          setCurrentTimer(timer);
          setElapsedTime(0);
          if (currentUser?.id) {
            localStorage.setItem(`activeTimer_${currentUser.id}`, JSON.stringify(timer));
          }
        } else if (type === 'TIMER_STOPPED') {
          setCurrentTimer(null);
          setElapsedTime(0);
          if (currentUser?.id) {
            localStorage.removeItem(`activeTimer_${currentUser.id}`);
          }
        }
      };

      return () => {
        channel.close();
        broadcastRef.current = null;
      };
    } catch {
    }
  }, [currentUser?.id]);

  const broadcastTimerEvent = useCallback((type: string, timer: TimeEntry | null) => {
    try {
      broadcastRef.current?.postMessage({ type, timer });
    } catch {
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      checkForRunningTimer(currentUser.id);
    }
  }, [currentUser?.id]);

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
    if (currentTimer && currentUser?.id) {
      localStorage.setItem(`activeTimer_${currentUser.id}`, JSON.stringify(currentTimer));
    }
  }, [currentTimer, currentUser?.id]);

  useEffect(() => {
    if (!currentTimer || !currentUser?.id) return;

    const syncWithServer = async () => {
      try {
        const taskResponse = await fetch(`/api/tasks/${currentTimer.taskId}`);
        if (taskResponse.status === 404) {
          localStorage.removeItem(`activeTimer_${currentUser.id}`);
          setCurrentTimer(null);
          setElapsedTime(0);
          return;
        }
        if (!taskResponse.ok) return;
        const task = await taskResponse.json();
        const entries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
        const serverEntry = entries.find((e: any) => e.id === currentTimer.id);
        if (!serverEntry || !serverEntry.isRunning) {
          localStorage.removeItem(`activeTimer_${currentUser.id}`);
          setCurrentTimer(null);
          setElapsedTime(0);
        }
      } catch {
      }
    };

    const interval = setInterval(syncWithServer, 15000);
    return () => clearInterval(interval);
  }, [currentTimer?.id, currentUser?.id]);

  useEffect(() => {
    localStorage.removeItem('activeTimer');
  }, []);

  const checkForRunningTimer = async (userId: string) => {
    try {
      const response = await fetch('/api/time-entries/running');
      if (response.ok) {
        const runningEntry = await response.json();
        if (runningEntry && runningEntry.userId === userId) {
          setCurrentTimer(runningEntry);
          localStorage.setItem(`activeTimer_${userId}`, JSON.stringify(runningEntry));
          return;
        }
      }
    } catch (error) {
      console.error('Error checking server for running timer:', error);
    }

    const savedTimer = localStorage.getItem(`activeTimer_${userId}`);
    if (savedTimer) {
      try {
        const timer = JSON.parse(savedTimer);
        if (timer.userId === userId) {
          setCurrentTimer(timer);
          return;
        } else {
          localStorage.removeItem(`activeTimer_${userId}`);
        }
      } catch (error) {
        console.error('Error parsing saved timer:', error);
        localStorage.removeItem(`activeTimer_${userId}`);
      }
    }
  };

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
        if (currentUser?.id) {
          checkForRunningTimer(currentUser.id);
        }
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

      if (currentUser?.id) {
        localStorage.removeItem(`activeTimer_${currentUser.id}`);
      }
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
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${savedTaskId}`] });
    } catch (error) {
      console.error('Error stopping timer via server:', error);

      if (currentUser?.id) {
        localStorage.removeItem(`activeTimer_${currentUser.id}`);
      }
      setCurrentTimer(null);
      setElapsedTime(0);

      toast({
        title: "Timer Stopped",
        variant: "default",
        description: `Timer cleared. Time entry for "${savedTaskTitle}" may not have been saved.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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
