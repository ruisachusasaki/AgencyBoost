import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Search, Bell, X, MessageSquare, Check, LogOut, User, UserCircle } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import TimerIndicator from "@/components/timer-indicator";
import LoginAsDropdown from "@/components/admin/login-as-dropdown";
import type { Staff } from "@shared/schema";

interface HeaderProps {
  onMenuClick: () => void;
}

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/clients": "Clients",
  "/projects": "Projects", 
  "/campaigns": "Campaigns",
  "/leads": "Leads",
  "/tasks": "Tasks",
  "/reports": "Reports"
};

// Notification Component
function NotificationButton() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

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
      const response = await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      return response.json();
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
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
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
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notification.type === 'mention' ? (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bell className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
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
                      
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full absolute left-2 top-4"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginAsDialog, setShowLoginAsDialog] = useState(false);

  const pageName = pageNames[location] || "Page";

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
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </Button>
          )}
          <h2 className="text-2xl font-bold text-slate-900">{pageName}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer indicator */}
          <TimerIndicator />
          
          <div className="relative hidden md:block">
            <Input
              type="search"
              placeholder="Search clients, projects..."
              className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          
          <NotificationButton />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                data-testid="button-user-menu"
              >
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}
                </span>
                <Avatar className="w-8 h-8" data-testid="img-avatar">
                  <AvatarImage 
                    src={currentUser?.profileImagePath ? `/api/objects/${currentUser.profileImagePath}` : undefined} 
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