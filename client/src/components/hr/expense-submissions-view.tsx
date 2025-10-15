import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Eye, Calendar, Receipt, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ExpenseSubmission = {
  id: number;
  fullName: string;
  supervisorId: string | null;
  purpose: string | null;
  expenseType: string | null;
  expenseDate: string | null;
  expenseTotal: string;
  departmentTeam: string | null;
  client: string | null;
  reimbursement: string | null;
  paymentMethod: string | null;
  notes: string | null;
  receipts: any;
  status: string;
  submittedAt: string;
};

export default function ExpenseSubmissionsView() {
  const [sortField, setSortField] = useState<keyof ExpenseSubmission | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch expense submissions
  const { data: submissions = [], isLoading } = useQuery<ExpenseSubmission[]>({
    queryKey: ["/api/expense-report-submissions"],
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/expense-report-submissions/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expense-report-submissions'] });
      toast({
        title: "Success",
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
  const SortableHeader = ({ field, children }: { field: keyof ExpenseSubmission; children: React.ReactNode }) => (
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

  // Sorted submissions
  const sortedSubmissions = useMemo(() => {
    if (!sortField) return submissions;
    
    return [...submissions].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      // Parse numeric fields for proper sorting
      if (sortField === 'expenseTotal') {
        aVal = parseFloat(aVal as string) || 0;
        bVal = parseFloat(bVal as string) || 0;
      }
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [submissions, sortField, sortDirection]);

  // Paginated submissions
  const paginatedSubmissions = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedSubmissions.slice(start, end);
  }, [sortedSubmissions, page, pageSize]);

  const totalPages = Math.ceil(sortedSubmissions.length / pageSize);

  // Reset to last valid page when data changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [sortedSubmissions.length, pageSize, totalPages]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading submissions...</p>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Expense Submissions Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              When users submit expense reports, they will appear here for review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table className="bg-white">
            <TableHeader>
              <TableRow>
                <SortableHeader field="fullName">Employee</SortableHeader>
                <SortableHeader field="purpose">Purpose</SortableHeader>
                <SortableHeader field="expenseType">Type</SortableHeader>
                <SortableHeader field="expenseTotal">Amount</SortableHeader>
                <SortableHeader field="expenseDate">Date</SortableHeader>
                <SortableHeader field="reimbursement">Reimbursement</SortableHeader>
                <SortableHeader field="submittedAt">Submitted</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubmissions.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-gray-50" data-testid={`row-expense-${submission.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{submission.fullName}</p>
                      <p className="text-sm text-slate-600">{submission.departmentTeam || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-xs truncate">{submission.purpose || 'N/A'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{submission.expenseType || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium text-slate-900">
                      <DollarSign className="h-4 w-4" />
                      {submission.expenseTotal ? parseFloat(submission.expenseTotal).toFixed(2) : '0.00'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      {submission.expenseDate ? new Date(submission.expenseDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={submission.reimbursement === 'Yes' ? 'default' : 'secondary'}
                      className={
                        submission.reimbursement === 'Yes' 
                          ? 'bg-green-100 text-green-800' 
                          : submission.reimbursement === 'No' 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {submission.reimbursement || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-600">{new Date(submission.submittedAt).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}
                      className={
                        submission.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : submission.status === 'rejected' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {submission.status === 'approved' ? 'Approved' : submission.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            data-testid={`button-view-expense-${submission.id}`}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Expense Report Details</DialogTitle>
                            <DialogDescription>
                              Submitted by {submission.fullName} on {new Date(submission.submittedAt).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <p className="text-sm text-slate-900">{submission.fullName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Supervisor</label>
                                <p className="text-sm text-slate-900">{submission.supervisorId || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Purpose</label>
                                <p className="text-sm text-slate-900">{submission.purpose || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Expense Type</label>
                                <p className="text-sm text-slate-900">{submission.expenseType || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Expense Date</label>
                                <p className="text-sm text-slate-900">
                                  {submission.expenseDate ? new Date(submission.expenseDate).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Total Amount</label>
                                <p className="text-sm font-semibold text-slate-900">
                                  ${submission.expenseTotal ? parseFloat(submission.expenseTotal).toFixed(2) : '0.00'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Department/Team</label>
                                <p className="text-sm text-slate-900">{submission.departmentTeam || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Client</label>
                                <p className="text-sm text-slate-900">{submission.client || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Reimbursement</label>
                                <p className="text-sm text-slate-900">{submission.reimbursement || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Payment Method</label>
                                <p className="text-sm text-slate-900">{submission.paymentMethod || 'N/A'}</p>
                              </div>
                            </div>
                            
                            {submission.notes && (
                              <div>
                                <label className="text-sm font-medium text-slate-700">Notes</label>
                                <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-md mt-1">
                                  {submission.notes}
                                </p>
                              </div>
                            )}
                            
                            {submission.receipts && (
                              <div>
                                <label className="text-sm font-medium text-slate-700">Receipts</label>
                                <div className="mt-2">
                                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                    <Receipt className="h-4 w-4" />
                                    Receipt attached
                                  </Badge>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-4 border-t">
                              <label className="text-sm font-medium text-slate-700">Change Status:</label>
                              <div className="flex gap-2">
                                {submission.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: submission.id, status: 'approved' })}
                                    disabled={updateStatusMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                    data-testid={`button-approve-${submission.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {submission.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateStatusMutation.mutate({ id: submission.id, status: 'rejected' })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`button-reject-${submission.id}`}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                )}
                                {submission.status !== 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatusMutation.mutate({ id: submission.id, status: 'pending' })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`button-pending-${submission.id}`}
                                  >
                                    Reset to Pending
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Show:</span>
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
                  <SelectTrigger className="w-20" data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600">per page</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
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
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
