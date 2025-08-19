import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, User, Calendar, Timer, Flag } from "lucide-react";
import { TaskActivity } from "@shared/schema";

interface TaskActivitiesProps {
  taskId: string;
  showCard?: boolean;
}

export default function TaskActivities({ taskId, showCard = true }: TaskActivitiesProps) {
  const { data: activities = [], isLoading } = useQuery<TaskActivity[]>({
    queryKey: ["/api/tasks", taskId, "activities"],
  });

  const formatActivityMessage = (activity: TaskActivity) => {
    const timeAgo = new Date(activity.createdAt || '').toLocaleString();
    
    switch (activity.actionType) {
      case 'status_change':
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.userName}</span> changed status from{' '}
                <span className="font-medium">{activity.oldValue}</span> to{' '}
                <span className="font-medium">{activity.newValue}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        );
        
      case 'assignee_change':
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full flex-shrink-0">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.userName}</span> changed assignee from{' '}
                <span className="font-medium">{activity.oldValue}</span> to{' '}
                <span className="font-medium">{activity.newValue}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        );
        
      case 'date_change':
        const formatDate = (dateStr: string | null) => {
          if (!dateStr) return 'Not set';
          try {
            return new Date(dateStr).toLocaleDateString();
          } catch {
            return dateStr;
          }
        };
        
        const fieldDisplayName = activity.fieldName === 'startDate' ? 'start date' : 'due date';
        
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full flex-shrink-0">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.userName}</span> changed {fieldDisplayName} from{' '}
                <span className="font-medium">{formatDate(activity.oldValue)}</span> to{' '}
                <span className="font-medium">{formatDate(activity.newValue)}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        );
        
      case 'time_tracking':
        const isTimeEntry = activity.fieldName === 'timeEntries';
        const isTimeTracked = activity.fieldName === 'timeTracked';
        
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full flex-shrink-0">
              <Timer className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.userName}</span>{' '}
                {isTimeEntry && 'updated time tracking session'}
                {isTimeTracked && `updated tracked time from ${activity.oldValue || 0} to ${activity.newValue || 0} minutes`}
              </p>
              <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        );
        
      case 'priority_change':
        const getPriorityColor = (priority: string | null) => {
          switch (priority) {
            case 'urgent': return 'text-red-600';
            case 'high': return 'text-yellow-600';
            case 'normal': return 'text-blue-600';
            case 'low': return 'text-gray-600';
            default: return 'text-gray-600';
          }
        };
        
        const getPriorityLabel = (priority: string | null) => {
          return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Not set';
        };
        
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full flex-shrink-0">
              <Flag className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.userName}</span> changed priority from{' '}
                <span className={`font-medium ${getPriorityColor(activity.oldValue)}`}>
                  {getPriorityLabel(activity.oldValue)}
                </span> to{' '}
                <span className={`font-medium ${getPriorityColor(activity.newValue)}`}>
                  {getPriorityLabel(activity.newValue)}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full flex-shrink-0">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.userName}</span> updated {activity.fieldName}
              </p>
              <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        );
    }
  };

  const loadingContent = (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    if (!showCard) {
      return loadingContent;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingContent}
        </CardContent>
      </Card>
    );
  }

  const activityContent = activities.length === 0 ? (
    <div className="text-center py-8">
      <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500">No activity yet</p>
      <p className="text-xs text-slate-400 mt-1">Changes will appear here as you work</p>
    </div>
  ) : (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div key={activity.id} className="relative">
          {formatActivityMessage(activity)}
          {activity !== activities[activities.length - 1] && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200"></div>
          )}
        </div>
      ))}
    </div>
  );

  if (!showCard) {
    return activityContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activityContent}
      </CardContent>
    </Card>
  );
}