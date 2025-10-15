import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Check, 
  X, 
  Clock, 
  Eye,
  Calendar,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TimeOffRequest, Staff } from "@shared/schema";

interface TimeOffRequestWithStaff extends TimeOffRequest {
  staff: {
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    position?: string;
  };
  dayBreakdown?: Array<{
    date: string;
    hours: number;
  }>;
}

export default function ApprovalBoard() {
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequestWithStaff | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvalsPage, setApprovalsPage] = useState(1);
  const [approvalsPageSize, setApprovalsPageSize] = useState(20);
  const [sortField, setSortField] = useState<'employee' | 'type' | 'dates' | 'duration' | 'submitted' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is admin
  useQuery({
    queryKey: ["/api/user-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/user-permissions");
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const permissions = await response.json();
      
      // Check if user has HR management permissions (admin-level access)
      setIsAdmin(
        permissions.tasks?.canDelete || 
        permissions.settings?.canAccess || 
        permissions.clients?.canDelete || false
      );
      
      return permissions;
    },
  });

  // Fetch pending time off requests for direct reports
  const { data: pendingRequests = [], isLoading } = useQuery<TimeOffRequestWithStaff[]>({
    queryKey: ["/api/hr/time-off-requests/pending-for-approval"],
    queryFn: async () => {
      const response = await fetch("/api/hr/time-off-requests/pending-for-approval");
      if (!response.ok) throw new Error('Failed to fetch pending approvals');
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Apply sorting to requests
  const sortedRequests = [...pendingRequests].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'employee':
        aValue = `${a.staff?.firstName || ''} ${a.staff?.lastName || ''}`.toLowerCase();
        bValue = `${b.staff?.firstName || ''} ${b.staff?.lastName || ''}`.toLowerCase();
        break;
      case 'type':
        aValue = a.type?.toLowerCase() || '';
        bValue = b.type?.toLowerCase() || '';
        break;
      case 'dates':
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
        break;
      case 'duration':
        aValue = getTotalHours(a);
        bValue = getTotalHours(b);
        break;
      case 'submitted':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Calculate pagination at top level (before any conditional returns)
  const totalItems = sortedRequests.length;
  const totalPages = Math.ceil(totalItems / approvalsPageSize);
  
  // Clamp page synchronously to prevent hooks order issues
  const currentPage = totalPages > 0 && approvalsPage > totalPages 
    ? Math.max(1, totalPages) 
    : approvalsPage;
  
  const startIndex = (currentPage - 1) * approvalsPageSize;
  const endIndex = startIndex + approvalsPageSize;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex);
  
  // Update state if page was clamped
  useEffect(() => {
    if (currentPage !== approvalsPage) {
      setApprovalsPage(currentPage);
    }
  }, [currentPage, approvalsPage]);

  // Delete mutation (ADMINS ONLY)
  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("DELETE", `/api/hr/time-off-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests/pending-for-approval"] });
      toast({
        title: "Success",
        description: "Time off request deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete request",
        variant: "destructive",
      });
    },
  });

  // Approve/Reject mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ requestId, action, reason }: { 
      requestId: string; 
      action: "approve" | "reject"; 
      reason?: string 
    }) => {
      return await apiRequest("PUT", `/api/hr/time-off-requests/${requestId}/approval`, {
        action,
        rejectionReason: reason,
      });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests/pending-for-approval"] });
      toast({
        title: "Success",
        description: `Time off request ${action === "approve" ? "approved" : "rejected"} successfully`,
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const handleApproveReject = (request: TimeOffRequestWithStaff, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    if (action === "reject") {
      // Show rejection reason dialog
      return;
    }
    
    // For approval, process immediately
    approvalMutation.mutate({
      requestId: request.id,
      action: "approve",
    });
  };

  const handleDeleteRequest = (requestId: string) => {
    if (confirm("Are you sure you want to delete this time off request? This action cannot be undone.")) {
      deleteMutation.mutate(requestId);
    }
  };

  const handleConfirmRejection = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    approvalMutation.mutate({
      requestId: selectedRequest.id,
      action: "reject",
      reason: rejectionReason,
    });
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setRejectionReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTotalHours = (request: TimeOffRequestWithStaff) => {
    if (request.dayBreakdown && request.dayBreakdown.length > 0) {
      return request.dayBreakdown.reduce((sum, day) => sum + day.hours, 0);
    }
    return request.totalHours || 0;
  };

  // Sort handler
  const handleSort = (field: 'employee' | 'type' | 'dates' | 'duration' | 'submitted') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sortable Header Component
  const SortableHeader = ({ field, children }: { field: 'employee' | 'type' | 'dates' | 'duration' | 'submitted'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
      data-testid={`header-sort-${field}`}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'asc' 
                ? 'text-primary' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortDirection === 'desc' 
                ? 'text-primary' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Loading approval requests...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No pending time off requests require your approval.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Pending Approvals ({pendingRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="employee">Employee</SortableHeader>
                <SortableHeader field="type">Type</SortableHeader>
                <SortableHeader field="dates">Dates</SortableHeader>
                <SortableHeader field="duration">Duration</SortableHeader>
                <SortableHeader field="submitted">Submitted</SortableHeader>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {request.staff?.firstName || 'Unknown'} {request.staff?.lastName || 'User'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {request.staff?.position || 'N/A'} • {request.staff?.department || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getTotalHours(request)} hours
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(request.createdAt), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        data-testid={`button-view-${request.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveReject(request, "approve")}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        data-testid={`button-approve-${request.id}`}
                        disabled={approvalMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveReject(request, "reject")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-reject-${request.id}`}
                        disabled={approvalMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${request.id}`}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <Select value={approvalsPageSize.toString()} onValueChange={(value) => {
                    setApprovalsPageSize(Number(value));
                    setApprovalsPage(1);
                  }}>
                    <SelectTrigger className="w-20" data-testid="select-approvals-page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} requests
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApprovalsPage(Math.max(1, approvalsPage - 1))}
                  disabled={approvalsPage === 1}
                  data-testid="button-approvals-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (approvalsPage <= 3) {
                      pageNumber = i + 1;
                    } else if (approvalsPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = approvalsPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={approvalsPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setApprovalsPage(pageNumber)}
                        className="w-9 h-9"
                        data-testid={`button-approvals-page-${pageNumber}`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApprovalsPage(Math.min(totalPages, approvalsPage + 1))}
                  disabled={approvalsPage === totalPages}
                  data-testid="button-approvals-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      {selectedRequest && actionType !== "reject" && (
        <Dialog open={!!selectedRequest && actionType !== "reject"} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Time Off Request Details</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Employee Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg">
                    {selectedRequest.staff.firstName} {selectedRequest.staff.lastName}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedRequest.staff.position} • {selectedRequest.staff.department}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.staff.email}</p>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedRequest.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm">
                    {selectedRequest.totalDays} day{selectedRequest.totalDays !== 1 ? 's' : ''} ({getTotalHours(selectedRequest)} hours)
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm">{format(new Date(selectedRequest.startDate), 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm">{format(new Date(selectedRequest.endDate), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>

              {/* Daily Hours Breakdown */}
              {selectedRequest.dayBreakdown && selectedRequest.dayBreakdown.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Daily Hours Breakdown</Label>
                  <div className="mt-2 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.dayBreakdown.map((day, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(day.date), 'EEEE, MMM d')}</TableCell>
                            <TableCell>{day.hours} hours</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.reason && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedRequest.reason}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleApproveReject(selectedRequest, "reject")}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  disabled={approvalMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveReject(selectedRequest, "approve")}
                  disabled={approvalMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Reason Dialog */}
      {selectedRequest && actionType === "reject" && (
        <Dialog open={actionType === "reject"} onOpenChange={handleCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Time Off Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {selectedRequest.staff.firstName}'s time off request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  data-testid="textarea-rejection-reason"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmRejection}
                  disabled={approvalMutation.isPending || !rejectionReason.trim()}
                  data-testid="button-confirm-rejection"
                >
                  {approvalMutation.isPending ? "Rejecting..." : "Reject Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}