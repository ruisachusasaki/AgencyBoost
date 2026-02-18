import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bell, MessageSquare, Check, CheckCheck, X, Trash2,
  Search, Inbox, AtSign, UserPlus, Clock, AlertCircle,
  ChevronRight, CheckCircle2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TabType = "all" | "mentions" | "assigned" | "unread";

function getNotificationIcon(type: string) {
  switch (type) {
    case "mentioned":
    case "mention":
      return <AtSign className="h-5 w-5 text-primary" />;
    case "annotation_mention":
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    case "task_assigned":
    case "client_assigned":
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    case "task_due":
      return <Clock className="h-5 w-5 text-orange-500" />;
    case "system":
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-400" />;
  }
}

function getEntityLabel(notification: any): string {
  const meta = notification.metadata;
  if (meta?.taskName) return meta.taskName;
  if (meta?.taskTitle) return meta.taskTitle;
  if (meta?.clientName) return meta.clientName;
  if (notification.entityType && notification.entityId) {
    return `${notification.entityType} #${notification.entityId.slice(0, 8)}`;
  }
  return "";
}

function groupNotificationsByDate(notifications: any[]): { label: string; items: any[] }[] {
  const groups: Record<string, any[]> = {};
  const order: string[] = [];

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    let label: string;
    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else if (isThisWeek(date)) {
      label = "This week";
    } else if (isThisMonth(date)) {
      label = "Earlier this month";
    } else {
      label = format(date, "MMMM yyyy");
    }

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(n);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({ title: "Failed to mark notification as read", variant: "destructive" });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/notifications/mark-all-read");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: `${data.updated || 0} notifications marked as read` });
    },
    onError: () => {
      toast({ title: "Failed to mark notifications as read", variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({ title: "Failed to delete notification", variant: "destructive" });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/notifications/clear-all");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: `${data.cleared || 0} notifications cleared` });
    },
    onError: () => {
      toast({ title: "Failed to clear notifications", variant: "destructive" });
    },
  });

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications] as any[];

    if (activeTab === "mentions") {
      filtered = filtered.filter(
        (n: any) => n.type === "mentioned" || n.type === "mention" || n.type === "annotation_mention"
      );
    } else if (activeTab === "assigned") {
      filtered = filtered.filter(
        (n: any) => n.type === "task_assigned" || n.type === "client_assigned"
      );
    } else if (activeTab === "unread") {
      filtered = filtered.filter((n: any) => !n.isRead);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n: any) =>
          n.title?.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  const grouped = useMemo(() => groupNotificationsByDate(filteredNotifications), [filteredNotifications]);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const mentionCount = notifications.filter(
    (n: any) => n.type === "mentioned" || n.type === "mention" || n.type === "annotation_mention"
  ).length;
  const assignedCount = notifications.filter(
    (n: any) => n.type === "task_assigned" || n.type === "client_assigned"
  ).length;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "mentions", label: "Mentions", count: mentionCount },
    { id: "assigned", label: "Assigned to me", count: assignedCount },
    { id: "unread", label: "Unread", count: unreadCount },
  ];

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    const linkUrl =
      notification.actionUrl ||
      (notification.entityType && notification.entityId
        ? `/${notification.entityType}s/${notification.entityId}`
        : null);
    if (linkUrl) {
      setLocation(linkUrl);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Inbox className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-sm"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearAllMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-primary/20 text-primary"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              {activeTab === "mentions" ? (
                <AtSign className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              ) : activeTab === "unread" ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Inbox className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {activeTab === "unread"
                ? "All caught up!"
                : searchQuery
                  ? "No results found"
                  : "No notifications yet"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {activeTab === "unread"
                ? "You've read all your notifications."
                : searchQuery
                  ? `No notifications matching "${searchQuery}"`
                  : "When you receive notifications, they'll appear here."}
            </p>
          </div>
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 px-6 py-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {group.label}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {group.items.map((notification: any) => {
                    const entityLabel = getEntityLabel(notification);
                    const linkUrl =
                      notification.actionUrl ||
                      (notification.entityType && notification.entityId
                        ? `/${notification.entityType}s/${notification.entityId}`
                        : null);

                    return (
                      <div
                        key={notification.id}
                        className={`group flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-white dark:hover:bg-gray-900 ${
                          !notification.isRead
                            ? "bg-primary/5 dark:bg-primary/5"
                            : "bg-transparent"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 mt-1 relative">
                          {!notification.isRead && (
                            <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                          )}
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {entityLabel && (
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-0.5">
                                  {entityLabel}
                                </p>
                              )}
                              <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''} text-gray-900 dark:text-gray-100`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div
                                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                    className="h-7 w-7 p-0"
                                    title="Mark as read"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="text-right ml-2">
                                <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                  {isToday(new Date(notification.createdAt))
                                    ? format(new Date(notification.createdAt), "h:mm a")
                                    : format(new Date(notification.createdAt), "MMM d")}
                                </p>
                                {linkUrl && (
                                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 ml-auto mt-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
