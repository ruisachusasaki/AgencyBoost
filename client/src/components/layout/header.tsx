import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Search, Bell, X, MessageSquare, Check, LogOut, User, UserCircle, FileText, Users, CheckSquare, HelpCircle, Brain, Phone } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TimerIndicator from "@/components/timer-indicator";
import MeetingTimerIndicator from "@/components/meeting-timer-indicator";
import LoginAsDropdown from "@/components/admin/login-as-dropdown";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { StickyNotesButton } from "@/components/sticky-notes-button";
import { GlobalPhoneDialer } from "@/components/voip/global-phone-dialer";
import { TaskIntakeDialog } from "@/components/task-intake-dialog";
import type { Staff } from "@shared/schema";

interface HeaderProps {
  onMenuClick: () => void;
}

// Notification Component
function NotificationButton() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/notifications/mark-all-read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification: any) => {
                const linkUrl = notification.actionUrl || (notification.entityType && notification.entityId
                  ? `/${notification.entityType}s/${notification.entityId}`
                  : null);

                const handleNotificationClick = () => {
                  if (!notification.isRead) {
                    markAsReadMutation.mutate(notification.id);
                  }
                  if (linkUrl) {
                    setIsOpen(false);
                    setLocation(linkUrl);
                  }
                };

                return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  } ${linkUrl ? 'cursor-pointer' : ''}`}
                  onClick={handleNotificationClick}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notification.type === 'mentioned' || notification.type === 'mention' ? (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      ) : notification.type === 'annotation_mention' ? (
                        <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Bell className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                            </p>
                            {linkUrl && (
                              <span className="text-xs font-medium text-primary hover:underline">
                                {notification.actionText || 'View'} →
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              className="h-6 w-6 p-0"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            title="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm text-primary hover:text-primary"
            onClick={() => { setIsOpen(false); setLocation('/notifications'); }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Search Component
function GlobalSearch() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchResults, isLoading, isError } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { results: [] };
      }
      const response = await apiRequest('GET', `/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return await response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const results = searchResults?.results || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'lead':
        return <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'lead':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      case 'task':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getNavigationPath = (type: string, id: string) => {
    switch (type) {
      case 'client':
        return `/clients/${id}`;
      case 'lead':
        return `/leads/${id}`;
      case 'task':
        return `/tasks/${id}`;
      default:
        return '/';
    }
  };

  const handleResultClick = (result: any) => {
    const path = getNavigationPath(result.type, result.id);
    setLocation(path);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative hidden md:block">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search clients, leads, tasks..."
        className="w-64 pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (e.target.value.length >= 2) {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }}
        onFocus={() => {
          if (searchQuery.length >= 2) {
            setIsOpen(true);
          }
        }}
        data-testid="input-global-search"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      
      <Popover open={isOpen && searchQuery.length >= 2} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className="absolute inset-0 pointer-events-none" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <X className="h-8 w-8 text-red-300 dark:text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Search failed. Please try again.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {debouncedQuery.length >= 2 ? "No results found" : "Start typing to search..."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((result: any) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  data-testid={`search-result-${result.type}-${result.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.name}
                        </p>
                        <Badge className={`text-xs ${getTypeBadgeColor(result.type)}`}>
                          {result.type}
                        </Badge>
                      </div>
                      {result.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </div>
  );
}

export default function Header({ onMenuClick }: HeaderProps) {
  const isMobile = useIsMobile();
  const [showLoginAsDialog, setShowLoginAsDialog] = useState(false);

  // Fetch current user data with authentication info
  const { data: authUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
    retry: 1
  });

  // Check if user is admin
  const { data: adminCheck } = useQuery({
    queryKey: ['/api/auth/is-admin'],
  });

  const isAdmin = adminCheck?.isAdmin === true;

  // Fetch full staff profile data including profile image
  const { data: currentUser } = useQuery<Staff>({
    queryKey: ['/api/staff', authUser?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/staff/${authUser?.id}`);
      return await response.json();
    },
    enabled: !!authUser?.id,
  });

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer indicators */}
          <TimerIndicator />
          <MeetingTimerIndicator />
          
          {/* Global search */}
          <GlobalSearch />
          
          {/* Marketing Brain Link */}
          <a
            href="https://MarketingBrain.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Marketing Brain"
            data-testid="link-marketing-brain"
          >
            <Brain className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
          </a>
          
          {/* Global Phone Dialer */}
          <GlobalPhoneDialer />
          
          {/* Quick Task Creation */}
          <TaskIntakeDialog
            trigger={
              <Button variant="ghost" size="sm" className="p-2" title="Create Task" data-testid="button-header-create-task">
                <CheckSquare className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </Button>
            }
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
            }}
          />

          <StickyNotesButton />

          <ThemeToggleButton />
          
          <NotificationButton />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                data-testid="button-user-menu"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}
                </span>
                <Avatar className="w-8 h-8" data-testid="img-avatar">
                  <AvatarImage 
                    src={currentUser?.profileImagePath ? `/objects${currentUser.profileImagePath}` : undefined} 
                    alt={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'} 
                  />
                  <AvatarFallback className="bg-slate-300 text-slate-600 text-sm font-medium">
                    {currentUser 
                      ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}` 
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/my-profile" className="flex items-center cursor-pointer" data-testid="menu-item-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              
              {/* Admin Only: Login As */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowLoginAsDialog(true)}
                    className="flex items-center cursor-pointer"
                    data-testid="menu-item-login-as"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Login As</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/tickets" className="flex items-center cursor-pointer" data-testid="menu-item-help-support">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.location.href = '/api/logout'}
                className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                data-testid="menu-item-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Login As Dialog */}
      <LoginAsDropdown 
        isOpen={showLoginAsDialog} 
        onClose={() => setShowLoginAsDialog(false)} 
      />
    </header>
  );
}