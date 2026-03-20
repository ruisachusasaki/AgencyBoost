import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const { toast } = useToast();

  const isClientPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/client-portal');

  // Fetch current user data for proper user ID association
  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
    enabled: !isClientPortal,
  });

  const isTimerRunning = !!currentTimer;

  // Check for existing running timers when user data is loaded
  useEffect(() => {
    if (currentUser?.id) {
      checkForRunningTimer(currentUser.id);
    }
  }, [currentUser?.id]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentTimer) {
      const updateElapsed = () => {
        const now = new Date().getTime();
        const startTime = new Date(currentTimer.startTime).getTime();
        const elapsed = Math.floor((now - startTime) / 1000); // seconds
        setElapsedTime(elapsed);
      };
      
      updateElapsed(); // Update immediately
      interval = setInterval(updateElapsed, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTimer]);

  // Save timer state to localStorage (user-specific key)
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

  // Clear old non-user-specific timer on first load (migration cleanup)
  useEffect(() => {
    localStorage.removeItem('activeTimer');
  }, []);

  const checkForRunningTimer = async (userId: string) => {
    // First check user-specific localStorage for persisted timer
    const savedTimer = localStorage.getItem(`activeTimer_${userId}`);
    if (savedTimer) {
      try {
        const timer = JSON.parse(savedTimer);
        // Verify the timer belongs to this user
        if (timer.userId === userId) {
          setCurrentTimer(timer);
          return;
        } else {
          // Timer belongs to different user, remove it
          localStorage.removeItem(`activeTimer_${userId}`);
        }
      } catch (error) {
        console.error('Error parsing saved timer:', error);
        localStorage.removeItem(`activeTimer_${userId}`);
      }
    }

    // Also check database for incomplete time entries
    try {
      const response = await fetch('/api/time-entries/running');
      if (response.ok) {
        const runningEntry = await response.json();
        if (runningEntry && runningEntry.userId === userId) {
          setCurrentTimer(runningEntry);
          // Save to user-specific localStorage
          localStorage.setItem(`activeTimer_${userId}`, JSON.stringify(runningEntry));
        }
      }
    } catch (error) {
      console.error('Error checking for running timer:', error);
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

    // Don't start timer if user data isn't loaded yet
    if (!currentUser?.id) {
      toast({
        title: "Please Wait",
        description: "Loading user information...",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();
    const timeEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      taskTitle,
      startTime: now,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      isRunning: true
    };

    setCurrentTimer(timeEntry);
    setElapsedTime(0);

    try {
      // Fetch existing task to get current time entries
      const taskResponse = await fetch(`/api/tasks/${taskId}`);
      const task = await taskResponse.json();
      
      // Merge new time entry with existing ones (don't overwrite!)
      const existingEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
      const mergedTimeEntries = [...existingEntries, timeEntry];

      // Save the time entry to the database with proper merge
      await apiRequest("PUT", `/api/tasks/${taskId}`, {
        timeEntries: mergedTimeEntries // Now properly appending instead of overwriting
      });

      toast({
        title: "Timer Started",
        variant: "default",
        description: `Started tracking time for "${taskTitle}"`,
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      setCurrentTimer(null);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const stopTimer = async () => {
    if (!currentTimer) return;

    const now = new Date().toISOString();
    const duration = Math.floor((new Date(now).getTime() - new Date(currentTimer.startTime).getTime()) / 1000 / 60); // minutes

    const updatedEntry = {
      ...currentTimer,
      endTime: now,
      isRunning: false,
      duration
    };

    try {
      const taskResponse = await fetch(`/api/tasks/${currentTimer.taskId}`);

      if (taskResponse.ok) {
        const task = await taskResponse.json();
        const currentEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
        const updatedEntries = currentEntries.map((entry: any) => 
          entry.id === currentTimer.id ? updatedEntry : entry
        );
        const totalTracked = updatedEntries.reduce((total: number, entry: any) => 
          total + (entry.duration || 0), 0
        );

        await apiRequest("PUT", `/api/tasks/${currentTimer.taskId}`, {
          timeEntries: updatedEntries,
          timeTracked: totalTracked
        });

        toast({
          title: "Timer Stopped",
          variant: "default",
          description: `Logged ${duration} minutes for "${currentTimer.taskTitle}"`,
        });
      } else {
        toast({
          title: "Timer Stopped",
          variant: "default",
          description: `Timer cleared — the task "${currentTimer.taskTitle}" was deleted. ${duration} minutes were not saved.`,
        });
      }

      if (currentUser?.id) {
        localStorage.removeItem(`activeTimer_${currentUser.id}`);
      }
      
      setCurrentTimer(null);
      setElapsedTime(0);

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error) {
      console.error('Error stopping timer:', error);
      if (currentUser?.id) {
        localStorage.removeItem(`activeTimer_${currentUser.id}`);
      }
      setCurrentTimer(null);
      setElapsedTime(0);
      toast({
        title: "Timer Stopped",
        variant: "default",
        description: `Timer cleared. Time entry for "${currentTimer.taskTitle}" may not have been saved.`,
      });
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
