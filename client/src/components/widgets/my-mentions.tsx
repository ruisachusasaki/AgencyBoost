import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, MessageSquare, FileText, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface UserDashboardWidget {
  id: string;
  widgetType: string;
}

interface MyMentionsWidgetProps {
  userWidget: UserDashboardWidget;
  onRemove: () => void;
}

interface Mention {
  id: string;
  type: 'task_comment' | 'file_annotation' | 'kb_comment';
  content: string;
  authorName: string;
  createdAt: string;
  entityId: string;
  entityTitle?: string;
  taskId?: string;
}

export default function MyMentionsWidget({ userWidget, onRemove }: MyMentionsWidgetProps) {
  const { data: mentions = [], isLoading } = useQuery<Mention[]>({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const getMentionIcon = (type: string) => {
    switch (type) {
      case 'task_comment':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'file_annotation':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'kb_comment':
        return <BookOpen className="h-4 w-4 text-primary" />;
      default:
        return <MessageSquare className="h-4 w-4 text-primary" />;
    }
  };

  const getMentionLink = (mention: Mention) => {
    switch (mention.type) {
      case 'task_comment':
        return mention.taskId ? `/tasks/${mention.taskId}?commentId=${mention.entityId}` : '#';
      case 'file_annotation':
        return mention.taskId ? `/tasks/${mention.taskId}?annotationId=${mention.entityId}` : '#'; // Annotations are on task files
      case 'kb_comment':
        return `/knowledge-base/articles/${mention.entityId}`;
      default:
        return '#';
    }
  };

  const getMentionTypeLabel = (type: string) => {
    switch (type) {
      case 'task_comment':
        return 'Task Comment';
      case 'file_annotation':
        return 'File Annotation';
      case 'kb_comment':
        return 'Knowledge Base';
      default:
        return 'Mention';
    }
  };

  return (
    <Card className="h-full flex flex-col" data-testid={`widget-${userWidget.widgetType}`}>
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">My Mentions</CardTitle>
              <CardDescription className="text-xs truncate">Comments and tasks where you're mentioned</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 flex-shrink-0"
            data-testid="button-remove-widget"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : mentions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No mentions</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2">
            {mentions.map((mention) => (
              <Link key={mention.id} href={getMentionLink(mention)}>
                <div
                  className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer mb-4"
                  data-testid={`mention-${mention.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-1">
                      {getMentionIcon(mention.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground truncate">
                          {getMentionTypeLabel(mention.type)}
                          {mention.entityTitle && ` • ${mention.entityTitle}`}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(mention.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{mention.content}</p>
                      <p className="text-xs text-muted-foreground">by {mention.authorName}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {mentions.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Link href="/tasks" className="block">
              <Button variant="ghost" size="sm" className="w-full" data-testid="button-view-all-mentions">
                View All
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
