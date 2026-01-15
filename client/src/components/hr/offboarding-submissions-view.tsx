import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Eye, 
  Calendar,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OffboardingSubmission = {
  id: number;
  fullName: string;
  departmentTeam: string | null;
  position: string | null;
  employmentEndDate: string | null;
  accountSuspensionDate: string | null;
  payOffRamp: string | null;
  status: string;
  submittedById: string | null;
  completedBy: string | null;
  completedAt: string | null;
  submittedAt: string;
  customFieldData: any;
};

export default function OffboardingSubmissionsView() {
  const [sortField, setSortField] = useState<keyof OffboardingSubmission | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFrameFilter, setTimeFrameFilter] = useState<string>('30days');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch offboarding submissions
  const { data: submissions = [], isLoading } = useQuery<OffboardingSubmission[]>({
    queryKey: ["/api/offboarding-submissions"],
  });

  // Fetch staff to get submitter names
  const { data: staffData = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  // Helper to get staff name by ID
  const getStaffName = (staffId: string | null) => {
    if (!staffId) return 'Unknown';
    const staff = staffData.find(s => s.id === staffId);
    return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/offboarding-submissions/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offboarding-submissions'] });
      setSelectedSubmissionId(null); // Close the dialog
      toast({
        title: "Success",
        variant: "success",
        description: "Status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Sortable header component
  const SortableHeader = ({ field, children }: { field: keyof OffboardingSubmission; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-50"
      onClick={() => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDirection('asc');
        }
      }}
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

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Time frame filter
    if (timeFrameFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeFrameFilter) {
        case '7days':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case 'thisMonth':
          cutoffDate.setDate(1);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'thisYear':
          cutoffDate.setMonth(0, 1);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
      }

      filtered = filtered.filter(s => new Date(s.submittedAt) >= cutoffDate);
    }

    return filtered;
  }, [submissions, statusFilter, timeFrameFilter]);

  // Sorted submissions
  const sortedSubmissions = useMemo(() => {
    if (!sortField) return filteredSubmissions;

    return [...filteredSubmissions].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredSubmissions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSubmissions.length / pageSize);
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedSubmissions.slice(startIndex, endIndex);
  }, [sortedSubmissions, page, pageSize]);

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);

  const handleStatusChange = (status: string) => {
    if (selectedSubmissionId) {
      updateStatusMutation.mutate({ id: selectedSubmissionId, status });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-600">Loading submissions...</p>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-600">No offboarding submissions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Filter Controls */}
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]" data-testid="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Time Frame:</span>
            <Select
              value={timeFrameFilter}
              onValueChange={(value) => {
                setTimeFrameFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]" data-testid="filter-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'all' || timeFrameFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setTimeFrameFilter('all');
                setPage(1);
              }}
              className="text-slate-600 hover:text-slate-900"
            >
              Clear Filters
            </Button>
          )}

          <div className="ml-auto text-sm text-slate-500">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white">
          <Table className="bg-white">
            <TableHeader>
              <TableRow>
                <SortableHeader field="fullName">Employee</SortableHeader>
                <SortableHeader field="departmentTeam">Department</SortableHeader>
                <SortableHeader field="position">Position</SortableHeader>
                <SortableHeader field="employmentEndDate">End Date</SortableHeader>
                <SortableHeader field="accountSuspensionDate">Account Suspension</SortableHeader>
                <SortableHeader field="submittedAt">Submitted</SortableHeader>
                <SortableHeader field="submittedById">Submitted By</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubmissions.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-gray-50" data-testid={`row-offboarding-${submission.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{submission.fullName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{submission.departmentTeam || 'N/A'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{submission.position || 'N/A'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      {submission.employmentEndDate ? new Date(submission.employmentEndDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      {submission.accountSuspensionDate ? new Date(submission.accountSuspensionDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{getStaffName(submission.submittedById)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={submission.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        submission.status === 'completed'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      }
                    >
                      {submission.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSubmissionId(submission.id)}
                      className="flex items-center gap-1"
                      data-testid={`button-view-${submission.id}`}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[70px]" data-testid="select-page-size">
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

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-previous-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Submission Details Dialog */}
      <Dialog open={selectedSubmissionId !== null} onOpenChange={() => setSelectedSubmissionId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offboarding Submission Details</DialogTitle>
            <DialogDescription>
              Review offboarding information and update status
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Employee Name</p>
                  <p className="text-base font-semibold">{selectedSubmission.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Department/Team</p>
                  <p className="text-base">{selectedSubmission.departmentTeam || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Position</p>
                  <p className="text-base">{selectedSubmission.position || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Employment End Date</p>
                  <p className="text-base">
                    {selectedSubmission.employmentEndDate 
                      ? new Date(selectedSubmission.employmentEndDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Account Suspension Date</p>
                  <p className="text-base">
                    {selectedSubmission.accountSuspensionDate 
                      ? new Date(selectedSubmission.accountSuspensionDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Submitted On</p>
                  <p className="text-base">{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedSubmission.payOffRamp && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Pay Off-Ramp</p>
                  <p className="text-base bg-slate-50 p-3 rounded-lg">{selectedSubmission.payOffRamp}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Current Status</p>
                <Badge 
                  variant={selectedSubmission.status === 'completed' ? 'default' : 'secondary'}
                  className={
                    selectedSubmission.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {selectedSubmission.status === 'completed' ? 'Completed' : 'Pending'}
                </Badge>
              </div>

              {selectedSubmission.completedAt && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed On</p>
                  <p className="text-base">{new Date(selectedSubmission.completedAt).toLocaleDateString()}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleStatusChange('pending')}
                  variant="outline"
                  disabled={selectedSubmission.status === 'pending' || updateStatusMutation.isPending}
                  data-testid="button-status-pending"
                >
                  Mark as Pending
                </Button>
                <Button
                  onClick={() => handleStatusChange('completed')}
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                  disabled={selectedSubmission.status === 'completed' || updateStatusMutation.isPending}
                  data-testid="button-status-completed"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Completed'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
