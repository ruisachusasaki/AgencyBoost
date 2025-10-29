import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Mail, 
  Phone, 
  FileText, 
  ExternalLink,
  MessageSquare,
  User,
  Clock,
  Send,
  Eye,
  UserPlus,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { JobApplication, JobApplicationComment } from "@shared/schema";

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isWatcherPopoverOpen, setIsWatcherPopoverOpen] = useState(false);

  // Fetch applicant details
  const { data: application, isLoading, error } = useQuery<JobApplication>({
    queryKey: ["/api/hr/job-applications", id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/job-applications/${id}`);
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch application comments
  const { data: comments = [] } = useQuery<JobApplicationComment[]>({
    queryKey: ["/api/hr/job-applications", id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/hr/job-applications/${id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch job application form config for field labels
  const { data: formConfig } = useQuery({
    queryKey: ["/api/job-application-form-config"],
    enabled: !!application?.customFieldData,
  });

  // Fetch staff for @mentions
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  // Fetch watchers for this application
  const { data: watchers = [] } = useQuery({
    queryKey: ["/api/hr/job-applications", id, "watchers"],
    queryFn: async () => {
      const response = await fetch(`/api/hr/job-applications/${id}/watchers`);
      if (!response.ok) throw new Error('Failed to fetch watchers');
      return response.json();
    },
    enabled: !!id,
  });

  // Add watcher mutation
  const addWatcherMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return await apiRequest("POST", `/api/hr/job-applications/${id}/watchers`, { staffId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-applications", id, "watchers"] });
      setIsWatcherPopoverOpen(false);
    },
  });

  // Remove watcher mutation
  const removeWatcherMutation = useMutation({
    mutationFn: async (watcherId: string) => {
      return await apiRequest("DELETE", `/api/hr/job-applications/${id}/watchers/${watcherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-applications", id, "watchers"] });
    },
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (updateData: { stage?: string; rating?: number }) => {
      const response = await fetch(`/api/hr/job-applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-applications"] });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/hr/job-applications/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-applications", id, "comments"] });
      setNewComment("");
    }
  });

  const handleStatusUpdate = async (stage: string) => {
    await updateApplicationMutation.mutateAsync({ stage });
  };

  const handleRatingUpdate = async (rating: number) => {
    await updateApplicationMutation.mutateAsync({ rating });
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addCommentMutation.mutateAsync(newComment.trim());
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(position);
    
    // Check for @mention
    const beforeCursor = value.slice(0, position);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const query = beforeCursor.slice(atIndex + 1);
      if (query.length === 0 || /^\w*$/.test(query)) {
        setMentionQuery(query);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredStaff.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < Math.min(filteredStaff.length - 1, 4) ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedStaff = filteredStaff[selectedMentionIndex];
        if (selectedStaff) {
          insertMention(selectedStaff);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const insertMention = (staffMember: any) => {
    const beforeCursor = newComment.slice(0, cursorPosition);
    const afterCursor = newComment.slice(cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    const newValue = beforeCursor.slice(0, atIndex) + `@${staffMember.firstName} ${staffMember.lastName} ` + afterCursor;
    setNewComment(newValue);
    setShowMentions(false);
  };

  const filteredStaff = staff.filter((member: any) => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const getStatusBadgeColor = (stage: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      review: "bg-yellow-100 text-yellow-800",
      interview: "bg-purple-100 text-purple-800",
      not_selected: "bg-red-100 text-red-800",
      test_sent: "bg-orange-100 text-orange-800",
      send_offer: "bg-green-100 text-green-800",
      offer_sent: "bg-green-200 text-green-900",
      offer_accepted: "bg-green-500 text-white",
      offer_rejected: "bg-red-500 text-white"
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatStatusLabel = (stage: string) => {
    const labels = {
      new: "New",
      review: "Review",
      interview: "Interview",
      not_selected: "Not Selected",
      test_sent: "Test Sent",
      send_offer: "Send Offer",
      offer_sent: "Offer Sent",
      offer_accepted: "Offer Accepted",
      offer_rejected: "Offer Rejected"
    };
    return labels[stage as keyof typeof labels] || stage;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading applicant details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Applicant Not Found</h2>
          <p className="text-gray-600 mb-4">The applicant you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/hr")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to HR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => setLocation("/hr")} 
            variant="outline" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{application?.applicantName || 'Unknown Applicant'}</h1>
              <p className="text-gray-600 mt-1">Applying for {application?.positionTitle || 'Unknown Position'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={getStatusBadgeColor(application?.stage || 'new')}>
                {formatStatusLabel(application?.stage || 'new')}
              </Badge>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 cursor-pointer ${
                      star <= (application?.rating || 0) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                    onClick={() => handleRatingUpdate(star)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{application?.applicantEmail || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {application.applicantPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{application?.applicantPhone || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Applied On</p>
                      <p className="font-medium">
                        {application?.appliedAt ? new Date(application.appliedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {application?.experience && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Experience Level</p>
                        <p className="font-medium capitalize">{application?.experience}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents & Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application?.resumeUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Resume</p>
                    <a 
                      href={application?.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Resume
                    </a>
                  </div>
                )}
                
                {application?.coverLetterUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cover Letter</p>
                    <a 
                      href={application?.coverLetterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Cover Letter
                    </a>
                  </div>
                )}
                
                {application?.portfolioUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Portfolio</p>
                    <a 
                      href={application?.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Portfolio
                    </a>
                  </div>
                )}

                {application?.salaryExpectation && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Salary Expectation</p>
                    <p className="font-medium">${Number(application?.salaryExpectation || 0).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {application?.customFieldData && Object.keys(application.customFieldData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(application?.customFieldData || {}).map(([key, value]) => {
                    // Find the field label from form config using the field ID
                    const field = formConfig?.fields?.find((f: any) => f.id === key);
                    const fieldLabel = field?.label || key.replace(/^field_\d+$/, 'Custom Field').replace(/_/g, ' ');
                    
                    return (
                      <div key={key}>
                        <p className="text-sm text-gray-500 mb-1">
                          {fieldLabel}
                        </p>
                        {typeof value === 'string' && value.startsWith('http') ? (
                          <a 
                            href={value} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Link
                          </a>
                        ) : (
                          <p className="font-medium">{value as string}</p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {application?.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Application Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{application?.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Update Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select value={application?.stage || 'new'} onValueChange={handleStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="not_selected">Not Selected</SelectItem>
                      <SelectItem value="test_sent">Test Sent</SelectItem>
                      <SelectItem value="send_offer">Send Offer</SelectItem>
                      <SelectItem value="offer_sent">Offer Sent</SelectItem>
                      <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                      <SelectItem value="offer_rejected">Offer Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingUpdate(star)}
                        className="text-yellow-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (application.rating || 0) ? 'fill-current' : 'stroke-current fill-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Watchers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Watchers/Followers
                </CardTitle>
                <CardDescription>
                  Team members who can view this application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Watcher List */}
                {watchers.length > 0 ? (
                  <div className="space-y-2">
                    {watchers.map((watcher: any) => (
                      <div key={watcher.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={watcher.profileImagePath ? `/objects${watcher.profileImagePath}` : undefined} />
                            <AvatarFallback className="text-xs">
                              {watcher.firstName?.[0] || '?'}{watcher.lastName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{watcher.firstName} {watcher.lastName}</p>
                            <p className="text-xs text-gray-500">{watcher.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWatcherMutation.mutate(watcher.id)}
                          disabled={removeWatcherMutation.isPending}
                          data-testid={`button-remove-watcher-${watcher.staffId}`}
                        >
                          <X className="h-4 w-4 text-gray-500 hover:text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No watchers yet
                  </p>
                )}
                
                {/* Add Watcher Button */}
                <Popover open={isWatcherPopoverOpen} onOpenChange={setIsWatcherPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-add-watcher">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Watcher
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          {staff
                            .filter((member: any) => 
                              !watchers.some((w: any) => w.staffId === member.id)
                            )
                            .map((member: any) => (
                              <CommandItem
                                key={member.id}
                                value={`${member.firstName} ${member.lastName}`}
                                onSelect={() => addWatcherMutation.mutate(member.id)}
                                data-testid={`option-add-watcher-${member.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.profileImagePath ? `/objects${member.profileImagePath}` : undefined} />
                                    <AvatarFallback className="text-xs">
                                      {member.firstName?.[0] || '?'}{member.lastName?.[0] || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                                    <p className="text-xs text-gray-500">{member.email}</p>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Internal Comments
                </CardTitle>
                <CardDescription>
                  Add notes visible only to your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment */}
                <div className="space-y-2 relative">
                  <div className="relative">
                    <Textarea
                      placeholder="Add an internal comment... Use @name to mention team members"
                      value={newComment}
                      onChange={handleCommentChange}
                      onKeyDown={handleKeyDown}
                      rows={3}
                    />
                    
                    {/* Mention Dropdown */}
                    {showMentions && filteredStaff.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                        {filteredStaff.slice(0, 5).map((member: any, index: number) => (
                          <button
                            key={member.id}
                            onClick={() => insertMention(member)}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                              index === selectedMentionIndex 
                                ? 'bg-blue-50 border-l-2 border-blue-500' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.profileImagePath ? `/objects${member.profileImagePath}` : undefined} />
                              <AvatarFallback className="text-xs">
                                {member.firstName[0]}{member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.firstName} {member.lastName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Use @name to mention team members and send them a notification
                    </p>
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.authorName ? 
                              comment.authorName.split(' ').map(n => n[0]).join('') : 
                              '?'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{comment.authorName || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500">
                              {comment.createdAt && new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}