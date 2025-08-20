import { Timer, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils';

export default function TimerIndicator() {
  const { currentTimer, isTimerRunning, stopTimer, elapsedTime } = useTimer();

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

  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
      {/* Pulsing timer icon */}
      <div className="relative">
        <Timer className="h-4 w-4 text-green-600" />
        <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      
      {/* Task title and elapsed time */}
      <div className="flex flex-col min-w-0">
        <div className="font-medium text-green-800 truncate max-w-32">
          {currentTimer.taskTitle}
        </div>
        <div className="text-green-600 font-mono text-xs">
          {formatTime(elapsedTime)}
        </div>
      </div>
      
      {/* Stop button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={stopTimer}
        className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
        title="Stop timer"
      >
        <Square className="h-3 w-3" />
      </Button>
    </div>
  );
}