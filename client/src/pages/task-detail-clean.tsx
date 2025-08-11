import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Edit3, 
  Trash2, 
  MessageCircle, 
  Send, 
  AtSign,
  CheckCircle,
  AlertCircle,
  Flag,
  Save,
  X,
  Users,
  Search,
  UserPlus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";

interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
  };
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function TaskDetailClean() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assignedTo: "",
    dueDate: "",
    dueTime: ""
  });
  
  // Comment state
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  
  // Assignment state
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");

  // Fetch task data
  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task');
      return response.json();
    },
    enabled: !!taskId,
  });

  // Fetch task comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<TaskComment[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!taskId,
  });

  // Fetch staff for assignments and mentions
  const { data: staffData } = useQuery<{ staff: StaffMember[] }>({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });
  
  const staff = staffData?.staff || [];

  // Fetch current user
  const { data: currentUser } = useQuery<StaffMember>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsEditing(false);
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation (Admin only)
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      setLocation("/tasks");
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, mentions }: { content: string; mentions: string[] }) => {
      await apiRequest("POST", `/api/tasks/${taskId}/comments`, { content, mentions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }); // Refresh notifications for mentions
      setNewComment("");
      setMentions([]);
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form when task loads
  if (task && !isEditing && editForm.title === "") {
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      assignedTo: task.assignedTo || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      dueTime: task.dueTime || ""
    });
  }

  if (!taskId) {
    return <div>Invalid task ID</div>;
  }

  if (taskLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Task not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getAssignedUserName = (userId: string) => {
    const user = staff.find(s => s.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const handleSaveTask = () => {
    const updates: Partial<Task> = {
      title: editForm.title,
      description: editForm.description,
      status: editForm.status,
      priority: editForm.priority,
      assignedTo: editForm.assignedTo || null,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate) : null,
      dueTime: editForm.dueTime || null,
    };
    
    updateTaskMutation.mutate(updates);
  };

  const handleDeleteTask = () => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTaskMutation.mutate();
    }
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment, mentions });
  };

  const processCommentContent = (content: string) => {
    // Replace @mentions with styled spans
    let processedContent = content;
    mentions.forEach(userId => {
      const user = staff.find(s => s.id === userId);
      if (user) {
        const mentionText = `@${user.firstName} ${user.lastName}`;
        processedContent = processedContent.replace(
          new RegExp(`@${user.firstName}\\s+${user.lastName}`, 'gi'),
          `<span class="bg-blue-100 text-blue-800 px-1 rounded">${mentionText}</span>`
        );
      }
    });
    return processedContent;
  };

  const filteredStaff = staff.filter(s => 
    mentionQuery === "" || 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredAssignmentStaff = staff.filter(s => 
    assignmentSearch === "" || 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(assignmentSearch.toLowerCase())
  );

  const addMention = (userId: string) => {
    if (!mentions.includes(userId)) {
      setMentions([...mentions, userId]);
      const user = staff.find(s => s.id === userId);
      if (user) {
        setNewComment(prev => prev + `@${user.firstName} ${user.lastName} `);
      }
    }
    setShowMentions(false);
    setMentionQuery("");
  };

  const assignTask = (userId: string) => {
    setEditForm(prev => ({ ...prev, assignedTo: userId }));
    setShowAssignmentDialog(false);
    setAssignmentSearch("");
    
    // Auto-save assignment
    updateTaskMutation.mutate({ assignedTo: userId });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {task.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            
            {currentUser?.role === 'Admin' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteTask}
                disabled={deleteTaskMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Task Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={editForm.status} 
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={editForm.priority} 
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dueTime">Due Time</Label>
                        <Input
                          id="dueTime"
                          type="time"
                          value={editForm.dueTime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueTime: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveTask}
                        disabled={updateTaskMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {task.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Priority:</span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Assigned to:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {task.assignedTo ? getAssignedUserName(task.assignedTo) : "Unassigned"}
                        </span>
                      </div>
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Due:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(task.dueDate).toLocaleDateString()}
                            {task.dueTime && ` at ${task.dueTime}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Add Comment */}
                <div className="space-y-3">
                  <div className="relative">
                    <Textarea
                      placeholder="Add a comment... Use @name to mention someone"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="pr-24"
                    />
                    
                    {/* Mention Button */}
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Popover open={showMentions} onOpenChange={setShowMentions}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <AtSign className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search staff to mention..." 
                              value={mentionQuery}
                              onValueChange={setMentionQuery}
                            />
                            <CommandList>
                              <CommandEmpty>No staff found.</CommandEmpty>
                              <CommandGroup heading="Staff">
                                {filteredStaff.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    onSelect={() => addMention(user.id)}
                                    className="cursor-pointer"
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    <div>
                                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                                      <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      <Button 
                        size="sm" 
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {mentions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {mentions.map(userId => {
                        const user = staff.find(s => s.id === userId);
                        return user ? (
                          <Badge key={userId} variant="secondary" className="text-xs">
                            @{user.firstName} {user.lastName}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {commentsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-gray-500">Loading comments...</div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs text-gray-400">Be the first to comment on this task</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {comment.author.firstName} {comment.author.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className="text-sm text-gray-700 dark:text-gray-300"
                          dangerouslySetInnerHTML={{ 
                            __html: processCommentContent(comment.content) 
                          }}
                        />
                        
                        {comment.mentions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {comment.mentions.map(userId => {
                              const user = staff.find(s => s.id === userId);
                              return user ? (
                                <Badge key={userId} variant="outline" className="text-xs">
                                  @{user.firstName} {user.lastName}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Task Metadata */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Assigned To
                  </Label>
                  <div className="flex items-center gap-2">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {getAssignedUserName(task.assignedTo)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 text-sm">
                        No assignment
                      </div>
                    )}
                    
                    <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-96">
                        <DialogHeader>
                          <DialogTitle>Assign Task</DialogTitle>
                        </DialogHeader>
                        <Command>
                          <CommandInput 
                            placeholder="Search staff members..." 
                            value={assignmentSearch}
                            onValueChange={setAssignmentSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No staff found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => assignTask("")}
                                className="cursor-pointer"
                              >
                                <X className="mr-2 h-4 w-4" />
                                <span>Unassign task</span>
                              </CommandItem>
                              {filteredAssignmentStaff.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  onSelect={() => assignTask(user.id)}
                                  className="cursor-pointer"
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  <div>
                                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                                    <p className="text-sm text-gray-500">{user.role}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {task.dueDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Due Date
                    </Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.dueTime && (
                        <>
                          <Clock className="h-4 w-4 text-gray-400 ml-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {task.dueTime}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Created
                  </Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {task.completedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Completed
                    </Label>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}