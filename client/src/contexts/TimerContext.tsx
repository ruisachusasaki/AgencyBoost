import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
    console.error('useTimer must be used within a TimerProvider');
    // Return a default context instead of throwing to prevent runtime errors
    return {
      currentTimer: null,
      isTimerRunning: false,
      startTimer: () => {},
      stopTimer: () => {},
      elapsedTime: 0
    };
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

  const isTimerRunning = !!currentTimer;

  // Check for existing running timers on app start
  useEffect(() => {
    // Wrap in try-catch to prevent runtime errors
    try {
      checkForRunningTimer();
    } catch (error) {
      console.error('Error initializing timer:', error);
    }
  }, []);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentTimer) {
      const updateElapsed = () => {
        try {
          const now = new Date().getTime();
          const startTime = new Date(currentTimer.startTime).getTime();
          // Validate dates before calculation
          if (!isNaN(now) && !isNaN(startTime)) {
            const elapsed = Math.floor((now - startTime) / 1000); // seconds
            setElapsedTime(elapsed);
          }
        } catch (error) {
          console.error('Error updating elapsed time:', error);
        }
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
    try {
      if (currentTimer) {
        localStorage.setItem('activeTimer', JSON.stringify(currentTimer));
      } else {
        localStorage.removeItem('activeTimer');
      }
    } catch (error) {
      console.error('Error saving timer to localStorage:', error);
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

    const now = new Date().toISOString();
    const timeEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      taskTitle,
      startTime: now,
      userId: 'current-user',
      isRunning: true
    };

    setCurrentTimer(timeEntry);
    setElapsedTime(0);

    try {
      // Save the time entry to the database
      await apiRequest("PUT", `/api/tasks/${taskId}`, {
        timeEntries: [timeEntry] // The backend will handle merging with existing entries
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