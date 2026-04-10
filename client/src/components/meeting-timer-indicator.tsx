import { Video, Square } from 'lucide-react';
import { useMeetingTimer } from '@/contexts/MeetingTimerContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function MeetingTimerIndicator() {
  const { activeMeeting, isMeetingTimerRunning, meetingElapsedTime, stopMeeting, isStoppingMeeting } = useMeetingTimer();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!isMeetingTimerRunning || !activeMeeting) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const goToMeeting = () => {
    if (activeMeeting.type === 'px') {
      setLocation(`/hr/px-meetings/${activeMeeting.id}`);
    } else {
      setLocation(`/hr/one-on-one?meetingId=${activeMeeting.id}`);
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await stopMeeting();
      toast({
        title: "Meeting Ended",
        description: `Ended "${activeMeeting.title}"`,
        variant: "default",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to end meeting. Try stopping from the meeting page.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 text-sm dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400">
      <button
        onClick={goToMeeting}
        className="relative hover:scale-110 transition-transform"
        title={`Go to active meeting: ${activeMeeting.title}`}
      >
        <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
      </button>

      <button
        onClick={goToMeeting}
        className="text-blue-600 font-mono text-sm hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
        title={`Go to active meeting: ${activeMeeting.title}`}
      >
        {formatTime(meetingElapsedTime)}
      </button>

      <button
        onClick={handleStop}
        disabled={isStoppingMeeting}
        className="ml-1 p-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
        title="End meeting"
      >
        <Square className="h-3 w-3 text-blue-600 dark:text-blue-400 fill-current" />
      </button>
    </div>
  );
}
