import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileInput, 
  Search, 
  Filter, 
  Download, 
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { format } from "date-fns";
import type { FormSubmission, Form, CustomField } from "@shared/schema";

export default function FormsSubmissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFormId, setSelectedFormId] = useState<string>("all");
  const [sortField, setSortField] = useState<"submittedAt" | "fullName" | "email">("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["submittedAt", "fullName", "email"]);
  const itemsPerPage = 20;

  // Fetch submissions
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery<FormSubmission[]>({
    queryKey: ["/api/form-submissions"],
  });

  // Fetch forms for filter dropdown
  const { data: forms = [] } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  // Fetch custom fields for column options
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields"],
  });

  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter((submission) => {
      // Filter by form
      if (selectedFormId !== "all" && submission.formId !== selectedFormId) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          submission.fullName?.toLowerCase().includes(searchLower) ||
          submission.email?.toLowerCase().includes(searchLower) ||
          submission.firstName?.toLowerCase().includes(searchLower) ||
          submission.lastName?.toLowerCase().includes(searchLower) ||
          submission.phone?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case "fullName":
          aValue = a.fullName || "";
          bValue = b.fullName || "";
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "submittedAt":
        default:
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
          break;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const totalSubmissions = filteredSubmissions.length;
  const totalPages = Math.ceil(totalSubmissions / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: "submittedAt" | "fullName" | "email") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "submittedAt" | "fullName" | "email") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getFormName = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    return form?.name || "Unknown Form";
  };

  const handleExport = () => {
    // This would implement CSV/Excel export functionality
    console.log("Export submissions:", filteredSubmissions);
  };

  const getClientLink = (submission: FormSubmission) => {
    if (submission.clientId) {
      return `/clients/${submission.clientId}`;
    }
    return null;
  };

  const isColumnVisible = (column: string) => visibleColumns.includes(column);

  const availableColumns = [
    { id: "submittedAt", name: "Submitted Date & Time" },
    { id: "fullName", name: "Full Name" },
    { id: "email", name: "Email" },
    { id: "phone", name: "Phone" },
    { id: "formName", name: "Form Name" },
    { id: "ipAddress", name: "IP Address" },
    { id: "country", name: "Country" },
    ...customFields.map(field => ({ id: `custom_${field.id}`, name: field.name }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileInput className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Form Submissions</h2>
            <p className="text-sm text-muted-foreground">
              Manage and view all form submissions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[300px]"
                  data-testid="input-search-submissions"
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Form</label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger className="w-[200px]" data-testid="select-form-filter">
                  <SelectValue placeholder="All forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Columns</label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-manage-columns">
                    Manage Columns
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Visible Columns</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {availableColumns.map((column) => (
                        <label key={column.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isColumnVisible(column.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisibleColumns([...visibleColumns, column.id]);
                              } else {
                                setVisibleColumns(visibleColumns.filter(c => c !== column.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{column.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Submissions ({totalSubmissions})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isColumnVisible("submittedAt") && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("submittedAt")}
                      data-testid="header-submitted-at"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Submitted Date & Time</span>
                        {getSortIcon("submittedAt")}
                      </div>
                    </TableHead>
                  )}
                  {isColumnVisible("fullName") && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("fullName")}
                      data-testid="header-full-name"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Full Name</span>
                        {getSortIcon("fullName")}
                      </div>
                    </TableHead>
                  )}
                  {isColumnVisible("email") && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("email")}
                      data-testid="header-email"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {getSortIcon("email")}
                      </div>
                    </TableHead>
                  )}
                  {isColumnVisible("phone") && (
                    <TableHead>Phone</TableHead>
                  )}
                  {isColumnVisible("formName") && (
                    <TableHead>Form</TableHead>
                  )}
                  {isColumnVisible("ipAddress") && (
                    <TableHead>IP Address</TableHead>
                  )}
                  {isColumnVisible("country") && (
                    <TableHead>Country</TableHead>
                  )}
                  {customFields.map((field) => 
                    isColumnVisible(`custom_${field.id}`) && (
                      <TableHead key={field.id}>{field.name}</TableHead>
                    )
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubmissions ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading submissions...
                    </TableCell>
                  </TableRow>
                ) : paginatedSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedFormId !== "all" 
                          ? "No submissions match your filters." 
                          : "No form submissions yet."
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubmissions.map((submission) => (
                    <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                      {isColumnVisible("submittedAt") && (
                        <TableCell data-testid={`text-submitted-at-${submission.id}`}>
                          {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                        </TableCell>
                      )}
                      {isColumnVisible("fullName") && (
                        <TableCell data-testid={`text-full-name-${submission.id}`}>
                          {getClientLink(submission) ? (
                            <Link href={getClientLink(submission)!}>
                              <button className="text-primary hover:underline flex items-center space-x-1">
                                <span>{submission.fullName || "No Name"}</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </Link>
                          ) : (
                            <span>{submission.fullName || "No Name"}</span>
                          )}
                        </TableCell>
                      )}
                      {isColumnVisible("email") && (
                        <TableCell data-testid={`text-email-${submission.id}`}>
                          {submission.email || "No Email"}
                        </TableCell>
                      )}
                      {isColumnVisible("phone") && (
                        <TableCell data-testid={`text-phone-${submission.id}`}>
                          {submission.phone || "No Phone"}
                        </TableCell>
                      )}
                      {isColumnVisible("formName") && (
                        <TableCell data-testid={`text-form-name-${submission.id}`}>
                          <Badge variant="outline">
                            {getFormName(submission.formId)}
                          </Badge>
                        </TableCell>
                      )}
                      {isColumnVisible("ipAddress") && (
                        <TableCell data-testid={`text-ip-${submission.id}`}>
                          {submission.ipAddress || "Unknown"}
                        </TableCell>
                      )}
                      {isColumnVisible("country") && (
                        <TableCell data-testid={`text-country-${submission.id}`}>
                          {submission.country || "Unknown"}
                        </TableCell>
                      )}
                      {customFields.map((field) => 
                        isColumnVisible(`custom_${field.id}`) && (
                          <TableCell key={field.id} data-testid={`text-custom-${field.id}-${submission.id}`}>
                            {submission.data && typeof submission.data === 'object' && field.name in submission.data
                              ? String((submission.data as any)[field.name]) 
                              : "—"
                            }
                          </TableCell>
                        )
                      )}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                          data-testid={`button-view-${submission.id}`}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalSubmissions)} of {totalSubmissions} submissions
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form</label>
                  <div className="font-medium">{getFormName(selectedSubmission.formId)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <div className="font-medium">
                    {format(new Date(selectedSubmission.submittedAt), "PPP 'at' p")}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <div className="font-medium">{selectedSubmission.fullName || "No Name"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="font-medium">{selectedSubmission.email || "No Email"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="font-medium">{selectedSubmission.phone || "No Phone"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <div className="font-medium">
                    {selectedSubmission.city && selectedSubmission.country 
                      ? `${selectedSubmission.city}, ${selectedSubmission.country}`
                      : selectedSubmission.country || "Unknown"
                    }
                  </div>
                </div>
              </div>

              {/* Form Data */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Form Data</label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedSubmission.data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                {selectedSubmission.clientId && (
                  <Link href={`/clients/${selectedSubmission.clientId}`}>
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      View Client Record
                    </Button>
                  </Link>
                )}
                <Button onClick={() => setSelectedSubmission(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}