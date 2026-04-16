import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  const [isStopping, setIsStopping] = useState(false);
  const { toast } = useToast();

  const isClientPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/client-portal');

  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
    enabled: !isClientPortal,
  });

  const isTimerRunning = !!currentTimer;

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
        const response = await fetch('/api/time-entries/running', { credentials: 'include' });
        if (!response.ok) return;
        const runningEntry = await response.json();
        if (!runningEntry || runningEntry.id !== currentTimer.id) {
          localStorage.removeItem(`activeTimer_${currentUser.id}`);
          setCurrentTimer(null);
          setElapsedTime(0);
        }
      } catch {
      }
    };

    const interval = setInterval(syncWithServer, 5000);
    return () => clearInterval(interval);
  }, [currentTimer?.id, currentUser?.id]);

  useEffect(() => {
    localStorage.removeItem('activeTimer');
  }, []);

  const checkForRunningTimer = async (userId: string) => {
    try {
      const response = await fetch('/api/time-entries/running', { credentials: 'include' });
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
      const response = await apiRequest("POST", "/api/time-entries/start", { taskId, taskTitle });
      const newEntry: TimeEntry = await response.json();

      setCurrentTimer(newEntry);
      setElapsedTime(0);

      toast({
        title: "Timer Started",
        variant: "default",
        description: `Started tracking time for "${taskTitle}"`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error: any) {
      console.error('Error starting timer:', error);
      if (error?.message?.includes('409') || error?.status === 409) {
        toast({
          title: "Timer Already Running",
          description: "You already have a timer running on another task. Stop it first.",
          variant: "destructive",
        });
        if (currentUser?.id) {
          checkForRunningTimer(currentUser.id);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to start timer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const stopTimer = async () => {
    if (!currentTimer || isStopping) return;

    setIsStopping(true);

    try {
      const response = await apiRequest("POST", "/api/time-entries/stop", {});
      const result = await response.json();

      const duration = result.duration || 0;

      if (currentUser?.id) {
        localStorage.removeItem(`activeTimer_${currentUser.id}`);
      }
      setCurrentTimer(null);
      setElapsedTime(0);

      toast({
        title: "Timer Stopped",
        variant: "default",
        description: `Logged ${duration} minutes for "${result.taskTitle || currentTimer.taskTitle}"`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error: any) {
      console.error('Error stopping timer:', error);

      if (error?.message?.includes('404') || error?.status === 404) {
        if (currentUser?.id) {
          localStorage.removeItem(`activeTimer_${currentUser.id}`);
        }
        setCurrentTimer(null);
        setElapsedTime(0);
        toast({
          title: "Timer Cleared",
          variant: "default",
          description: "No running timer was found on the server. It may have been stopped from another tab.",
        });
      } else {
        toast({
          title: "Failed to Stop Timer",
          description: "Could not stop the timer. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsStopping(false);
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
