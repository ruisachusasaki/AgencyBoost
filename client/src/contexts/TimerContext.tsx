import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  userId: string;
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

  // Fetch current user data for proper user ID association
  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  const isTimerRunning = !!currentTimer;

  // Check for existing running timers on app start
  useEffect(() => {
    checkForRunningTimer();
  }, []);

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

  // Save timer state to localStorage
  useEffect(() => {
    if (currentTimer) {
      localStorage.setItem('activeTimer', JSON.stringify(currentTimer));
    } else {
      localStorage.removeItem('activeTimer');
    }
  }, [currentTimer]);

  const checkForRunningTimer = async () => {
    // First check localStorage for persisted timer
    const savedTimer = localStorage.getItem('activeTimer');
    if (savedTimer) {
      try {
        const timer = JSON.parse(savedTimer);
        setCurrentTimer(timer);
        return;
      } catch (error) {
        console.error('Error parsing saved timer:', error);
        localStorage.removeItem('activeTimer');
      }
    }

    // Also check database for incomplete time entries
    try {
      const response = await fetch('/api/time-entries/running');
      if (response.ok) {
        const runningEntry = await response.json();
        if (runningEntry) {
          setCurrentTimer(runningEntry);
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
      // Get current task to update time entries
      const taskResponse = await fetch(`/api/tasks/${currentTimer.taskId}`);
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
        description: `Logged ${duration} minutes for "${currentTimer.taskTitle}"`,
      });

      setCurrentTimer(null);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
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