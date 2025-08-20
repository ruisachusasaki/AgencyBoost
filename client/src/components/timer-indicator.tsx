import { Timer, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/contexts/TimerContext';
import { useLocation } from 'wouter';

export default function TimerIndicator() {
  const { currentTimer, isTimerRunning, stopTimer, elapsedTime } = useTimer();
  const [, setLocation] = useLocation();

  if (!isTimerRunning || !currentTimer) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const goToActiveTask = () => {
    setLocation(`/tasks/${currentTimer.taskId}`);
  };

  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-1.5 text-sm">
      {/* Pulsing timer icon - clickable to go to task */}
      <button 
        onClick={goToActiveTask}
        className="relative hover:scale-110 transition-transform"
        title={`Go to active task: ${currentTimer.taskTitle}`}
      >
        <Timer className="h-4 w-4 text-green-600" />
        <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
      </button>
      
      {/* Elapsed time - clickable to go to task */}
      <button 
        onClick={goToActiveTask}
        className="text-green-600 font-mono text-sm hover:text-green-800 transition-colors"
        title={`Go to active task: ${currentTimer.taskTitle}`}
      >
        {formatTime(elapsedTime)}
      </button>
      
      {/* Checkbox to stop timer */}
      <Button
        size="sm"
        variant="ghost"
        onClick={stopTimer}
        className="h-5 w-5 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-sm"
        title="Stop timer"
      >
        <Check className="h-3 w-3" />
      </Button>
    </div>
  );
}