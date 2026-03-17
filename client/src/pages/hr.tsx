import React, { useState, useMemo, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  CalendarDays, 
  Users, 
  FileText, 
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  UserCheck,
  Search,
  Filter,
  Check,
  ChevronsUpDown,
  Star,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  DollarSign,
  Receipt,
  MessageCircle,
  Network,
  Presentation,
  Plus,
  List,
  LayoutGrid,
  ClipboardCheck
} from "lucide-react";
import { Staff, TimeOffRequest, JobApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useHasPermissions } from "@/hooks/use-has-permission";
import TimeOffRequestForm from "@/components/forms/time-off-request-form";
import AdminTimeOffForm from "@/components/forms/admin-time-off-form";
import ApprovalBoard from "@/components/hr/approval-board";
import ExpenseReportForm from "@/components/hr/expense-report-form";
import ExpenseSubmissionsView from "@/components/hr/expense-submissions-view";
import OffboardingForm from "@/components/hr/offboarding-form";
import OffboardingSubmissionsView from "@/components/hr/offboarding-submissions-view";
import OneOnOneMeetings from "@/components/hr/one-on-one-meetings";
import PxMeetings from "@/components/hr/px-meetings";
import OnboardingChecklist from "@/pages/hr/OnboardingChecklist";
import OnboardingDashboard from "@/pages/hr/OnboardingDashboard";
import OrgChart from "@/components/hr/org-chart";

function HiringManagerDropdown({ value, onChange, staffData, testId }: {
  value: string;
  onChange: (value: string) => void;
  staffData: Array<{ id: string; firstName: string; lastName: string; department: string; position: string }>;
  testId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return staffData;
    const term = search.toLowerCase();
    return staffData.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(term));
  }, [staffData, search]);

  const selectedStaff = staffData.find(s => s.id === value);
  const displayText = selectedStaff
    ? `${selectedStaff.firstName} ${selectedStaff.lastName} — ${selectedStaff.department} • ${selectedStaff.position}`
    : "Select Hiring Manager";

  return (
    <div ref={containerRef} data-testid={testId}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearch(""); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(!isOpen); } }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={`truncate ${!selectedStaff ? "text-muted-foreground" : ""}`}>{displayText}</span>
        <ChevronDown className={`h-4 w-4 opacity-50 shrink-0 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <div className="mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search staff..."
              className="w-full px-2 py-1.5 text-sm border rounded-md bg-background outline-none focus:ring-1 focus:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
            <div
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
            >
              — None —
            </div>
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${value === s.id ? "bg-accent font-medium" : ""}`}
                onClick={() => { onChange(s.id); setIsOpen(false); setSearch(""); }}
              >
                {s.firstName} {s.lastName} — {s.department} • {s.position}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No staff found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface HRPageProps {
  initialTab?: string;
  meetingId?: string;
}

export default function HRPage({ initialTab, meetingId }: HRPageProps = {}) {
  const [location, setLocation] = useLocation();
  
  // Derive initial tab from prop, query param (fallback), or default
  const deriveInitialTab = useMemo(() => {
    if (initialTab) return initialTab;
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam || "dashboard";
  }, [initialTab]);
  
  // Derive meetingId from URL or prop
  const deriveMeetingId = useMemo(() => {
    if (meetingId) return meetingId;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('meetingId') || undefined;
  }, [meetingId]);
  
  const [activeMeetingId, setActiveMeetingId] = useState<string | undefined>(deriveMeetingId);
  
  // Sync activeMeetingId when meetingId prop changes (from route params)
  useEffect(() => {
    if (meetingId !== activeMeetingId) {
      setActiveMeetingId(meetingId);
    }
  }, [meetingId]);
  
  // Also sync activeMeetingId when URL query params change (legacy support)
  useEffect(() => {
    if (!meetingId) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMeetingId = urlParams.get('meetingId') || undefined;
      if (urlMeetingId !== activeMeetingId) {
        setActiveMeetingId(urlMeetingId);
      }
    }
  }, [location, meetingId]);
  
  const [activeTab, setActiveTab] = useState(deriveInitialTab);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Sync activeTab when initialTab prop changes (for route navigation)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    } else if (!initialTab) {
      // Check if there's a query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const expectedTab = tabParam || "dashboard";
      
      if (activeTab !== expectedTab) {
        setActiveTab(expectedTab);
      }
    }
  }, [initialTab, activeTab, location]);
  
  // Handle tab change with URL sync
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const newPath = tabId === "dashboard" ? "/hr" : `/hr/${tabId}`;
    setLocation(newPath);
  };
  
  // Admin permission state
  const [isHRAdmin, setIsHRAdmin] = useState(false);
  
  // Responsive tabs state
  const [visibleTabsCount, setVisibleTabsCount] = useState(10);
  
  // Check if current user has HR admin permissions
  useQuery({
    queryKey: ["/api/user-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/user-permissions");
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const permissions = await response.json();
      
      setIsHRAdmin(
        permissions.tasks?.canDelete || 
        permissions.settings?.canAccess || 
        permissions.clients?.canDelete || false
      );
      
      return permissions;
    },
  });
  
  // Filter states for staff directory
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  
  // Filter states for time off reports
  const [reportSearchTerm, setReportSearchTerm] = useState("");
  const [reportDepartmentFilter, setReportDepartmentFilter] = useState("all");
  
  // Filter state for time off requests
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  
  // Pagination state for time off requests
  const [timeOffPage, setTimeOffPage] = useState(1);
  const [timeOffPageSize, setTimeOffPageSize] = useState(20);
  
  // Pagination state for who's off calendar
  const [whosOffPage, setWhosOffPage] = useState(1);
  const [whosOffPageSize, setWhosOffPageSize] = useState(20);
  const [whosOffViewMode, setWhosOffViewMode] = useState<"list" | "calendar">("list");
  const [whosOffCalendarMonth, setWhosOffCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  // Filter states for applications
  const [applicationPositionFilter, setApplicationPositionFilter] = useState("all");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");
  
  // Time off request form state
  const [isTimeOffRequestOpen, setIsTimeOffRequestOpen] = useState(false);
  const [isAdminTimeOffOpen, setIsAdminTimeOffOpen] = useState(false);
  
  // Delete time off confirmation dialog state
  const [deleteTimeOffDialog, setDeleteTimeOffDialog] = useState<{
    open: boolean;
    requestId: string | null;
    status: string;
  }>({ open: false, requestId: null, status: '' });

  // Delete time off request mutation (ADMINS ONLY)
  const deleteTimeOffMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("DELETE", `/api/hr/time-off-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests/pending-for-approval"] });
      // Show success message
    },
    onError: (error: any) => {
      console.error("Failed to delete time off request:", error);
    },
  });

  const handleDeleteTimeOffRequest = (requestId: string, status: string) => {
    setDeleteTimeOffDialog({ open: true, requestId, status });
  };
  
  const confirmDeleteTimeOffRequest = () => {
    if (deleteTimeOffDialog.requestId) {
      deleteTimeOffMutation.mutate(deleteTimeOffDialog.requestId);
    }
    setDeleteTimeOffDialog({ open: false, requestId: null, status: '' });
  };

  // Delete applicant mutation (ADMINS ONLY)
  const deleteApplicantMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest("DELETE", `/api/hr/job-applications/${applicationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/job-applications'] });
      setDeletingApplicant(null);
    },
    onError: (error: any) => {
      console.error("Failed to delete applicant:", error);
    },
  });

  // Helper function to format time off duration
  const formatDuration = (totalHours: string, totalDays: number) => {
    const hours = parseFloat(totalHours || "0");
    const fullDays = Math.floor(hours / 8);
    const remainingHours = hours % 8;
    
    if (hours < 8) {
      // Less than a full day - show hours
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else if (remainingHours === 0) {
      // Full days only
      return `${fullDays} ${fullDays === 1 ? 'day' : 'days'}`;
    } else {
      // Mixed days and hours
      return `${fullDays} ${fullDays === 1 ? 'day' : 'days'}, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`;
    }
  };
  
  // Job opening modal state
  const [isJobOpeningModalOpen, setIsJobOpeningModalOpen] = useState(false);
  const [isEditJobOpeningModalOpen, setIsEditJobOpeningModalOpen] = useState(false);
  const [editingJobOpening, setEditingJobOpening] = useState<any>(null);

  // Application sorting state
  const [applicationSortField, setApplicationSortField] = useState<'applicantName' | 'positionTitle' | 'stage' | 'rating' | 'appliedAt' | null>(null);
  const [applicationSortDirection, setApplicationSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Delete applicant state
  const [deletingApplicant, setDeletingApplicant] = useState<JobApplication | null>(null);

  // Onboarding submissions sorting and pagination state
  const [onboardingSortField, setOnboardingSortField] = useState<'name' | 'startDate' | 'phone' | 'emergencyContact' | 'paymentPlatform' | 'submitted' | 'status' | null>(null);
  const [onboardingSortDirection, setOnboardingSortDirection] = useState<'asc' | 'desc'>('asc');
  const [onboardingPage, setOnboardingPage] = useState(1);
  const [onboardingPageSize, setOnboardingPageSize] = useState(20);

  // Fetch staff data
  const { data: staffData = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch client team assignments for org chart
  const { data: clientTeamAssignments = [] } = useQuery({
    queryKey: ["/api/client-team-assignments"],
  });
  

  
  // Check if current user is a manager (has direct reports) and get role info
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/current-user"],
  });
  
  const { data: directReports = [], isLoading: directReportsLoading } = useQuery<Staff[]>({
    queryKey: ["/api/hr/direct-reports"],
    enabled: !!(currentUser as any)?.id,
  });
  
  const isManager = directReports.length > 0;
  const isAdmin = ((currentUser as any)?.role?.toLowerCase() === 'admin') || (currentUser as any)?.id?.startsWith('dev-admin'); // Include dev admin detection with case-insensitive check
  const isAccounting = (currentUser as any)?.role?.toLowerCase() === 'accounting';
  
  // Granular HR permissions
  const { permissions: hrPermissions } = useHasPermissions([
    'hr.staff.view',
    'hr.staff.edit',
    'hr.time_off.view_all',
    'hr.time_off.approve',
    'hr.applications.view',
    'hr.applications.manage',
    'hr.job_openings.view',
    'hr.job_openings.edit',
    'hr.expenses.view_all',
    'hr.expenses.approve',
    'hr.px_meetings.view',
    'hr.px_meetings.create',
    'hr.px_meetings.manage',
    'hr.one_on_one.view_own',
    'hr.one_on_one.view_all',
    'hr.one_on_one.create',
    'hr.one_on_one.manage',
    'hr.offboarding.view',
    'hr.offboarding.manage',
  ]);
  
  // Permission-based access (falls back to role-based for backwards compatibility)
  const canViewStaffDirectory = isAdmin || hrPermissions['hr.staff.view'];
  const canManageStaff = isAdmin || hrPermissions['hr.staff.edit'];
  const canViewTimeOffRequests = isAdmin || hrPermissions['hr.time_off.view_all'];
  const canManageTimeOffRequests = isAdmin || hrPermissions['hr.time_off.approve'];
  const canViewJobApplications = isAdmin || hrPermissions['hr.applications.view'];
  const canManageJobApplications = isAdmin || hrPermissions['hr.applications.manage'];
  const canViewJobOpenings = isAdmin || hrPermissions['hr.job_openings.view'];
  const canManageJobOpeningsPermission = isAdmin || hrPermissions['hr.job_openings.edit'];
  const canViewExpenseReports = isAdmin || isAccounting || hrPermissions['hr.expenses.view_all'];
  const canManageExpenseReports = isAdmin || hrPermissions['hr.expenses.approve'];
  const canViewPxMeetings = isAdmin || isManager || hrPermissions['hr.px_meetings.view'];
  const canViewOneOnOne = isAdmin || isManager || hrPermissions['hr.one_on_one.view_own'] || hrPermissions['hr.one_on_one.view_all'];
  const canViewOffboarding = isAdmin || isManager || hrPermissions['hr.offboarding.view'] || hrPermissions['hr.offboarding.manage'];
  
  const canViewAllData = isAdmin;
  const canManageJobOpenings = isManager || isAdmin || canManageJobOpeningsPermission;
  

  // Fetch time off requests with pagination
  interface PaginatedTimeOffResponse {
    requests: TimeOffRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }
  
  const { data: timeOffData } = useQuery<PaginatedTimeOffResponse>({
    queryKey: ['/api/hr/time-off-requests', { page: timeOffPage, limit: timeOffPageSize }],
  });
  
  const timeOffRequests = timeOffData?.requests || [];
  const timeOffPagination = timeOffData?.pagination;

  // Fetch job applications (role-based filtering handled on backend)
  const { data: jobApplications = [] } = useQuery<JobApplication[]>({
    queryKey: ["/api/hr/job-applications"],
  });

  // Fetch new hire onboarding submissions (Admin/Manager only)
  const { data: onboardingSubmissions = [] } = useQuery({
    queryKey: ["/api/new-hire-onboarding-submissions"],
    enabled: isManager || isAdmin,
  });

  const { data: myOnboardingData } = useQuery<{ instance: any | null }>({
    queryKey: ["/api/onboarding/my-checklist"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/my-checklist", { credentials: "include" });
      if (!res.ok) return { instance: null };
      return res.json();
    },
  });
  const hasOnboardingChecklist = !!myOnboardingData?.instance || isAdmin || isManager;

  // Fetch job openings (visible to all, but creation restricted to managers/admins)
  const { data: jobOpenings = [] } = useQuery<any[]>({
    queryKey: ["/api/job-openings"],
  });

  // Fetch departments and staff for dropdowns
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    enabled: canManageJobOpenings,
  });

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const { data: positions = [] } = useQuery<any[]>({
    queryKey: [`/api/departments/${selectedDepartmentId}/positions`],
    enabled: canManageJobOpenings && !!selectedDepartmentId,
  });

  // Job Opening Form State
  const [jobOpeningForm, setJobOpeningForm] = useState({
    departmentId: "",
    positionId: "",
    employmentType: "",
    hiringManagerId: "",
    compensation: "",
    compensationType: "annual",
    jobDescription: "",
    benefits: "",
    usePositionDescription: true // New flag for using position description
  });
  
  // Track position descriptions
  const [positionDescription, setPositionDescription] = useState("");

  // Create Job Opening Mutation
  const createJobOpeningMutation = useMutation({
    mutationFn: async (jobOpeningData: any) => {
      const response = await fetch("/api/job-openings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobOpeningData),
      });
      if (!response.ok) {
        throw new Error("Failed to create job opening");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
      resetJobOpeningForm();
      setIsJobOpeningModalOpen(false);
    },
  });

  // Update Job Opening Mutation  
  const updateJobOpeningMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/job-openings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update job opening");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
      resetJobOpeningForm();
      setIsEditJobOpeningModalOpen(false);
      setEditingJobOpening(null);
    },
  });

  // Approve/Reject Job Opening Mutation
  const approveJobOpeningMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }: { id: string; action: 'approve' | 'reject'; rejectionReason?: string }) => {
      const response = await fetch(`/api/job-openings/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${action} job opening`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
    },
  });

  // Delete Job Opening Mutation
  const deleteJobOpeningMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/job-openings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete job opening");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
      toast({
        title: "Job Opening Deleted",
        variant: "default",
        description: "The job opening has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job opening. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark as Filled Mutation
  const markAsFilledMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/job-openings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "filled" }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark job opening as filled");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
      toast({
        title: "Job Opening Updated",
        variant: "default",
        description: "The job opening has been marked as filled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job opening. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset form function
  const resetJobOpeningForm = () => {
    setJobOpeningForm({
      departmentId: "",
      positionId: "",
      employmentType: "",
      hiringManagerId: "",
      compensation: "",
      compensationType: "annual",
      jobDescription: "",
      benefits: "",
      usePositionDescription: true
    });
    setPositionDescription("");
    setSelectedDepartmentId("");
  };

  // Handle form submission
  const handleCreateJobOpening = () => {
    // Basic validation
    if (!jobOpeningForm.departmentId || !jobOpeningForm.positionId || !jobOpeningForm.employmentType || !jobOpeningForm.hiringManagerId) {
      alert("Please fill in all required fields");
      return;
    }

    const jobOpeningData = {
      ...jobOpeningForm,
      compensation: jobOpeningForm.compensation || null,
    };
    
    // Remove the usePositionDescription field before sending to API
    const { usePositionDescription, ...submitData } = jobOpeningData;
    
    console.log("Submitting job opening data:", submitData);
    createJobOpeningMutation.mutate(submitData);
  };

  // Handle edit job opening
  const handleEditJobOpening = (opening: any) => {
    setEditingJobOpening(opening);
    // Populate form with existing data
    setJobOpeningForm({
      departmentId: opening.departmentId || "",
      positionId: opening.positionId || "",
      employmentType: opening.employmentType || "",
      hiringManagerId: opening.hiringManagerId || "",
      compensation: opening.compensation || "",
      compensationType: opening.compensationType || "annual",
      jobDescription: opening.jobDescription || "",
      benefits: opening.benefits || "",
      usePositionDescription: false // Default to custom when editing
    });
    setSelectedDepartmentId(opening.departmentId || "");
    setPositionDescription(opening.jobDescription || "");
    setIsEditJobOpeningModalOpen(true);
  };

  // Handle update job opening
  const handleUpdateJobOpening = () => {
    if (!editingJobOpening) return;
    
    // Basic validation
    if (!jobOpeningForm.departmentId || !jobOpeningForm.positionId || !jobOpeningForm.employmentType || !jobOpeningForm.hiringManagerId) {
      alert("Please fill in all required fields");
      return;
    }

    const jobOpeningData = {
      ...jobOpeningForm,
      compensation: jobOpeningForm.compensation || null,
    };
    
    // Remove the usePositionDescription field before sending to API
    const { usePositionDescription, ...updateData } = jobOpeningData;
    
    updateJobOpeningMutation.mutate({ 
      id: editingJobOpening.id, 
      data: updateData 
    });
  };

  // Handle approve/reject job opening
  const handleApproveJobOpening = (id: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    approveJobOpeningMutation.mutate({ id, action, rejectionReason });
  };

  // Update form when department changes
  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setJobOpeningForm(prev => ({
      ...prev,
      departmentId,
      positionId: "" // Reset position when department changes
    }));
    setPositionDescription(""); // Reset position description
  };

  // Handle position change and fetch description
  const handlePositionChange = async (positionId: string) => {
    setJobOpeningForm(prev => ({...prev, positionId}));
    
    if (positionId) {
      try {
        const response = await fetch(`/api/positions/${positionId}`);
        if (response.ok) {
          const position = await response.json();
          setPositionDescription(position.description || "");
          
          // If using position description, update job description
          if (jobOpeningForm.usePositionDescription) {
            setJobOpeningForm(prev => ({
              ...prev,
              jobDescription: position.description || ""
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching position description:", error);
        setPositionDescription("");
      }
    } else {
      setPositionDescription("");
    }
  };
  
  // Handle toggle for using position description
  const handleUsePositionDescriptionToggle = (useDefault: boolean) => {
    setJobOpeningForm(prev => ({
      ...prev,
      usePositionDescription: useDefault,
      jobDescription: useDefault ? positionDescription : ""
    }));
  };

  // Fetch time off policies to get current allocations
  const { data: policies = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/time-off-policies"],
  });

  // Role-based data filtering
  const filteredTimeOffRequests = useMemo(() => {
    const currentUserId = (currentUser as any)?.id;
    if (canViewAllData) {
      return timeOffRequests; // Admins see all requests
    } else if (isManager) {
      // Managers see requests from their team plus their own
      const teamStaffIds = directReports.map(staff => staff.id);
      return timeOffRequests.filter(request => 
        teamStaffIds.includes(request.staffId) || request.staffId === currentUserId
      );
    }
    // Regular users see only their own requests
    return timeOffRequests.filter(request => request.staffId === currentUserId);
  }, [timeOffRequests, directReports, canViewAllData, isManager, currentUser]);

  const filteredJobApplications = useMemo(() => {
    // Backend already filters applications based on hiring manager
    return jobApplications;
  }, [jobApplications]);

  // Active job openings count
  const activeJobOpenings = jobOpenings.filter(job => job.status === 'active' || job.isActive !== false);

  const pendingTimeOffRequests = filteredTimeOffRequests.filter(req => req.status === "pending");
  const recentApplications = filteredJobApplications.filter(app => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return app.appliedAt && new Date(app.appliedAt) > oneWeekAgo;
  });

  // Extract unique departments and positions for filters
  const uniqueDepartments = useMemo(() => {
    const departments = Array.from(new Set(staffData
      .map(member => member.department)
      .filter(dept => dept && dept.trim() !== "")))
      .sort();
    return departments;
  }, [staffData]);

  const uniquePositions = useMemo(() => {
    const positions = Array.from(new Set(staffData
      .map(member => member.position)
      .filter(pos => pos && pos.trim() !== "")))
      .sort();
    return positions;
  }, [staffData]);

  // Filter staff data based on selected filters - Staff Directory is visible to EVERYONE
  const filteredStaffData = useMemo(() => {
    // Staff Directory shows all staff to everyone - no role restrictions
    const staffToShow = staffData;
    
    // Apply department and position filters
    return staffToShow.filter(member => {
      const matchesDepartment = departmentFilter === "all" || member.department === departmentFilter;
      const matchesPosition = positionFilter === "all" || member.position === positionFilter;
      return matchesDepartment && matchesPosition;
    });
  }, [staffData, departmentFilter, positionFilter]);

  // Who's Off calendar data calculation (moved to top level to avoid hooks inside conditionals)
  // Who's Off should show ALL approved time off to everyone so the whole team can see who's out
  const whosOffSortedTimeOff = useMemo(() => {
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const approvedTimeOff = timeOffRequests.filter(request => {
      if (request.status !== 'approved') return false;
      const startDate = parseISO(request.startDate);
      const endDate = parseISO(request.endDate);
      return (startDate <= sixtyDaysFromNow && endDate >= today);
    });

    const timeOffByDateRange = approvedTimeOff.reduce((acc, request) => {
      const staff = staffData.find(s => s.id === request.staffId);
      if (!staff) return acc;

      const startDate = parseISO(request.startDate);
      const endDate = parseISO(request.endDate);
      const startStr = format(startDate, 'M/d/yyyy');
      const endStr = format(endDate, 'M/d/yyyy');
      const dateRangeKey = startStr === endStr ? startStr : `${startStr} - ${endStr}`;
      
      if (!acc[dateRangeKey]) {
        acc[dateRangeKey] = { startDate, endDate, requests: [] };
      }
      
      acc[dateRangeKey].requests.push({
        ...request,
        staffName: `${staff.firstName} ${staff.lastName}`,
        department: staff.department,
        position: staff.position
      });
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(timeOffByDateRange)
      .sort(([,a], [,b]) => a.startDate.getTime() - b.startDate.getTime());
  }, [timeOffRequests, staffData]);

  const whosOffTotalPages = useMemo(() => {
    return Math.ceil(whosOffSortedTimeOff.length / whosOffPageSize);
  }, [whosOffSortedTimeOff.length, whosOffPageSize]);

  const whosOffCalendarData = useMemo(() => {
    const year = whosOffCalendarMonth.getFullYear();
    const month = whosOffCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const approvedTimeOff = timeOffRequests.filter(request => {
      if (request.status !== 'approved') return false;
      const startDate = parseISO(request.startDate);
      const endDate = parseISO(request.endDate);
      return (startDate <= lastDay && endDate >= firstDay);
    });

    const dayMap: Record<number, Array<{ id: string; staffName: string; staffId: string; type: string; startDate: Date; endDate: Date; color: string }>> = {};
    const colorPalette = [
      'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    ];
    const getStaffColor = (staffId: string) => {
      let hash = 0;
      for (let i = 0; i < staffId.length; i++) {
        hash = ((hash << 5) - hash) + staffId.charCodeAt(i);
        hash |= 0;
      }
      return colorPalette[Math.abs(hash) % colorPalette.length];
    };

    approvedTimeOff.forEach(request => {
      const staff = staffData.find(s => s.id === request.staffId);
      if (!staff) return;
      const staffName = `${staff.firstName} ${staff.lastName}`;
      const startDate = parseISO(request.startDate);
      const endDate = parseISO(request.endDate);
      const loopStart = new Date(Math.max(startDate.getTime(), firstDay.getTime()));
      const loopEnd = new Date(Math.min(endDate.getTime(), lastDay.getTime()));

      for (let d = new Date(loopStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
        const dayNum = d.getDate();
        if (!dayMap[dayNum]) dayMap[dayNum] = [];
        if (!dayMap[dayNum].find(e => e.id === request.id)) {
          dayMap[dayNum].push({
            id: request.id,
            staffName,
            staffId: request.staffId,
            type: (request as any).type || 'Time Off',
            startDate,
            endDate,
            color: getStaffColor(request.staffId),
          });
        }
      }
    });

    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    return { dayMap, startDayOfWeek, daysInMonth, year, month };
  }, [timeOffRequests, staffData, whosOffCalendarMonth]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 font-medium"><AlertCircle className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-medium"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 font-medium"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Copy careers URL handler
  const handleCopyCareersUrl = () => {
    const careersUrl = `${window.location.origin}/careers`;
    navigator.clipboard.writeText(careersUrl);
    toast({
      title: "Success",
      variant: "default",
      description: "Careers URL copied to clipboard",
    });
  };

  const getApplicationStageBadge = (stage: string) => {
    const stageColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      applied: "bg-blue-100 text-blue-800",
      review: "bg-yellow-100 text-yellow-800",
      screening: "bg-yellow-100 text-yellow-800",
      interview: "bg-purple-100 text-purple-800",
      not_selected: "bg-red-100 text-red-800",
      test_sent: "bg-orange-100 text-orange-800",
      offer: "bg-green-100 text-green-800",
      send_offer: "bg-yellow-100 text-yellow-800",
      offer_sent: "bg-yellow-100 text-yellow-800",
      offer_accepted: "bg-[hsl(179,100%,39%)]/15 text-[hsl(179,100%,30%)]",
      offer_declined: "bg-red-100 text-red-800",
      hired: "bg-green-500 text-white",
      rejected: "bg-red-100 text-red-800",
    };
    
    const stageLabels: Record<string, string> = {
      new: "New",
      applied: "Applied",
      review: "Review",
      screening: "Screening",
      interview: "Interview",
      not_selected: "Not Selected",
      test_sent: "Test Sent",
      send_offer: "Send Offer",
      offer_sent: "Offer Sent",
      offer_accepted: "Offer Accepted \u2713",
      offer_declined: "Offer Declined",
      hired: "Hired \uD83C\uDF89",
      rejected: "Rejected",
    };

    return (
      <Badge className={stageColors[stage] || "bg-gray-100 text-gray-800"}>
        {stageLabels[stage] || stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, " ")}
      </Badge>
    );
  };

  // Application sorting handler
  const handleApplicationSort = (field: 'applicantName' | 'positionTitle' | 'stage' | 'rating' | 'appliedAt') => {
    if (applicationSortField === field) {
      setApplicationSortDirection(applicationSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setApplicationSortField(field);
      setApplicationSortDirection('asc');
    }
  };

  // Get unique positions and statuses for filters
  const uniqueApplicationPositions = useMemo(() => {
    const positions = jobApplications
      .map(app => app.positionTitle)
      .filter(position => position && position.trim() !== '')
      .filter((position, index, arr) => arr.indexOf(position) === index);
    return positions.sort();
  }, [jobApplications]);

  const uniqueApplicationStatuses = useMemo(() => {
    const statuses = jobApplications
      .map(app => app.stage)
      .filter(status => status && status.trim() !== '')
      .filter((status, index, arr) => arr.indexOf(status) === index);
    return statuses.sort();
  }, [jobApplications]);

  // Filter and sort applications
  const sortedApplications = useMemo(() => {
    let filtered = [...jobApplications];
    
    // Apply position filter
    if (applicationPositionFilter && applicationPositionFilter !== "all") {
      filtered = filtered.filter(app => app.positionTitle === applicationPositionFilter);
    }
    
    // Apply status filter
    if (applicationStatusFilter && applicationStatusFilter !== "all") {
      filtered = filtered.filter(app => app.stage === applicationStatusFilter);
    }
    
    // Apply sorting
    if (applicationSortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[applicationSortField];
        let bValue: any = b[applicationSortField];
        
        if (applicationSortField === 'appliedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else if (applicationSortField === 'rating') {
          aValue = aValue || 0;
          bValue = bValue || 0;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (applicationSortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    
    return filtered;
  }, [jobApplications, applicationPositionFilter, applicationStatusFilter, applicationSortField, applicationSortDirection]);

  // Application Sortable Header Component
  const ApplicationSortableHeader = ({ field, children }: { field: 'applicantName' | 'positionTitle' | 'stage' | 'rating' | 'appliedAt'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleApplicationSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              applicationSortField === field && applicationSortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              applicationSortField === field && applicationSortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  // Onboarding sorting handler
  const handleOnboardingSort = (field: 'name' | 'startDate' | 'phone' | 'emergencyContact' | 'paymentPlatform' | 'submitted' | 'status') => {
    if (onboardingSortField === field) {
      setOnboardingSortDirection(onboardingSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOnboardingSortField(field);
      setOnboardingSortDirection('asc');
    }
  };

  // Sort and paginate onboarding submissions
  const sortedOnboardingSubmissions = useMemo(() => {
    let sorted = [...onboardingSubmissions];
    
    if (onboardingSortField) {
      sorted.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        switch (onboardingSortField) {
          case 'name':
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
            break;
          case 'startDate':
            aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
            bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
            break;
          case 'phone':
            aValue = a.phoneNumber?.toLowerCase() || '';
            bValue = b.phoneNumber?.toLowerCase() || '';
            break;
          case 'emergencyContact':
            aValue = a.emergencyContactName?.toLowerCase() || '';
            bValue = b.emergencyContactName?.toLowerCase() || '';
            break;
          case 'paymentPlatform':
            aValue = a.paymentPlatform?.toLowerCase() || '';
            bValue = b.paymentPlatform?.toLowerCase() || '';
            break;
          case 'submitted':
            aValue = new Date(a.submittedAt).getTime();
            bValue = new Date(b.submittedAt).getTime();
            break;
          case 'status':
            aValue = a.status?.toLowerCase() || '';
            bValue = b.status?.toLowerCase() || '';
            break;
          default:
            return 0;
        }

        if (onboardingSortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    
    return sorted;
  }, [onboardingSubmissions, onboardingSortField, onboardingSortDirection]);

  // Onboarding pagination
  const onboardingTotalPages = Math.ceil(sortedOnboardingSubmissions.length / onboardingPageSize);
  const onboardingCurrentPage = onboardingTotalPages > 0 && onboardingPage > onboardingTotalPages 
    ? Math.max(1, onboardingTotalPages) 
    : onboardingPage;
  const onboardingStartIndex = (onboardingCurrentPage - 1) * onboardingPageSize;
  const onboardingEndIndex = onboardingStartIndex + onboardingPageSize;
  const paginatedOnboardingSubmissions = sortedOnboardingSubmissions.slice(onboardingStartIndex, onboardingEndIndex);

  // Onboarding Sortable Header Component
  const OnboardingSortableHeader = ({ field, children }: { field: 'name' | 'startDate' | 'phone' | 'emergencyContact' | 'paymentPlatform' | 'submitted' | 'status'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleOnboardingSort(field)}
      data-testid={`header-sort-${field}`}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              onboardingSortField === field && onboardingSortDirection === 'asc' 
                ? 'text-primary' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              onboardingSortField === field && onboardingSortDirection === 'desc' 
                ? 'text-primary' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  // Calculate visible tabs based on screen width
  useEffect(() => {
    const calculateVisibleTabs = () => {
      const width = window.innerWidth;
      
      // Responsive breakpoints for tab visibility
      if (width >= 1400) {
        setVisibleTabsCount(8); // XL screens - show 8 tabs, rest in overflow menu
      } else if (width >= 1200) {
        setVisibleTabsCount(6); // Large screens
      } else if (width >= 900) {
        setVisibleTabsCount(4); // Medium screens
      } else if (width >= 600) {
        setVisibleTabsCount(3); // Small screens
      } else {
        setVisibleTabsCount(2); // Extra small screens
      }
    };
    
    calculateVisibleTabs();
    window.addEventListener('resize', calculateVisibleTabs);
    
    return () => window.removeEventListener('resize', calculateVisibleTabs);
  }, []);

  // Clamp Who's Off page number when data changes
  useEffect(() => {
    if (whosOffTotalPages > 0 && whosOffPage > whosOffTotalPages) {
      setWhosOffPage(Math.max(1, whosOffTotalPages));
    }
  }, [whosOffTotalPages, whosOffPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <span>HR</span>
          </h1>
          <p className="text-slate-600">Manage staff, time off, and recruitment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex w-full">
          {(() => {
            const allTabs = [
              ...(isManager || isAdmin ? [{ id: "dashboard", name: "Dashboard", icon: BarChart3, count: 0, overflowOnly: false }] : []),
              ...(canViewStaffDirectory ? [{ id: "staff-directory", name: "Staff Directory", icon: Users, count: filteredStaffData.length, overflowOnly: false }] : []),
              ...(canViewStaffDirectory ? [{ id: "org-chart", name: "Org Chart", icon: Network, count: 0, overflowOnly: false }] : []),
              ...(canViewOneOnOne ? [{ id: "one-on-one", name: "1v1 Meetings", icon: MessageCircle, count: 0, overflowOnly: false }] : []),
              ...(canViewPxMeetings ? [{ id: "px-meetings", name: "Meetings", icon: Presentation, count: 0, overflowOnly: false }] : []),
              { id: "time-off", name: "Time Off", icon: CalendarDays, count: pendingTimeOffRequests.length, overflowOnly: false },
              { id: "time-off-calendar", name: "Who's Off", icon: Calendar, count: 0, overflowOnly: false },
              ...(canManageTimeOffRequests ? [{ id: "approvals", name: "Approvals", icon: CheckCircle, count: pendingTimeOffRequests.length, overflowOnly: false }] : []),
              ...(canViewJobOpenings ? [{ id: "job-openings", name: "Job Openings", icon: FileText, count: activeJobOpenings.length, overflowOnly: false }] : []),
              ...(canViewJobApplications ? [{ id: "applications", name: "Applications", icon: UserPlus, count: recentApplications.length, overflowOnly: false }] : []),
              ...(canManageJobApplications || isManager || isAdmin ? [{ id: "onboarding-submissions", name: "Onboarding Submissions", icon: UserCheck, count: onboardingSubmissions?.length || 0, overflowOnly: false }] : []),
              { id: "expense-report", name: "Expense Report", icon: DollarSign, count: 0, overflowOnly: true },
              ...(canViewExpenseReports ? [{ id: "expense-submissions", name: "Expense Submissions", icon: Receipt, count: 0, overflowOnly: true }] : []),
              ...(canViewOffboarding ? [{ id: "offboarding-form", name: "Offboarding Form", icon: UserCheck, count: 0, overflowOnly: true }] : []),
              ...(canViewOffboarding ? [{ id: "offboarding-submissions", name: "Offboarding Submissions", icon: Users, count: 0, overflowOnly: true }] : []),
              ...(isManager || isAdmin ? [{ id: "onboarding", name: "New Hire Onboarding", icon: Users, count: 0, overflowOnly: true }] : []),
              ...(hasOnboardingChecklist ? [{ id: "onboarding-checklist", name: "Onboarding Checklist", icon: ClipboardCheck, count: 0, overflowOnly: true }] : []),
              ...(canManageStaff || isManager || isAdmin ? [{ id: "reports", name: "Reports", icon: FileText, count: 0, overflowOnly: true }] : [])
            ];
            
            const primaryTabs = allTabs.filter(t => !t.overflowOnly);
            const alwaysOverflowTabs = allTabs.filter(t => t.overflowOnly);
            const visibleTabs = primaryTabs.slice(0, visibleTabsCount);
            const overflowTabs = [...primaryTabs.slice(visibleTabsCount), ...alwaysOverflowTabs];
            
            return (
              <>
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.name} {tab.count > 0 && `(${tab.count})`}
                    </button>
                  );
                })}
                
                {overflowTabs.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                          overflowTabs.some(tab => tab.id === activeTab)
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                        data-testid="tab-overflow-menu"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {overflowTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <DropdownMenuItem
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 ${
                              activeTab === tab.id ? "bg-primary/10 text-primary" : ""
                            }`}
                            data-testid={`dropdown-tab-${tab.id}`}
                          >
                            <Icon className="h-4 w-4" />
                            {tab.name} {tab.count > 0 && `(${tab.count})`}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            );
          })()}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{canViewAllData ? staffData.length : (isManager ? directReports.length + 1 : 1)}</div>
                <p className="text-xs text-slate-600">{canViewAllData ? 'Active employees' : 'Team members'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Time Off</CardTitle>
                <CalendarDays className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTimeOffRequests.length}</div>
                <p className="text-xs text-slate-600">Requests awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Applications</CardTitle>
                <UserPlus className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentApplications.length}</div>
                <p className="text-xs text-slate-600">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                <FileText className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeJobOpenings.length}</div>
                <p className="text-xs text-slate-600">Active job postings</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Time Off Requests</CardTitle>
                <CardDescription>Latest time off requests requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTimeOffRequests.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No pending time off requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTimeOffRequests.slice(0, 5).map((request) => {
                      const staff = staffData.find(s => s.id === request.staffId);
                      return (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={staff?.profileImagePath ? `/objects${staff.profileImagePath}` : undefined} />
                              <AvatarFallback>
                                {staff?.firstName?.[0]}{staff?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{staff?.firstName} {staff?.lastName}</p>
                              <p className="text-sm text-slate-600">
                                {request.type.replace('_', ' ')} • {request.totalDays} days
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(request.status)}
                            <p className="text-xs text-slate-600 mt-1">
                              {request.startDate && format(parseISO(request.startDate), 'M/d/yyyy')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Job Applications</CardTitle>
                <CardDescription>Latest applications for open positions</CardDescription>
              </CardHeader>
              <CardContent>
                {jobApplications.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No recent applications</p>
                ) : (
                  <div className="space-y-4">
                    {jobApplications.slice(0, 5).map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{application.applicantName}</p>
                          <p className="text-sm text-slate-600">{application.applicantEmail}</p>
                        </div>
                        <div className="text-right">
                          {getApplicationStageBadge(application.stage)}
                          <p className="text-xs text-slate-600 mt-1">
                            {application.appliedAt && new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "time-off" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Time Off Management</h2>
              <p className="text-slate-600">Manage vacation, sick leave, and personal day requests</p>
            </div>
            <div className="flex gap-2">
              {(canManageTimeOffRequests || isManager) && (
                <Button variant="outline" onClick={() => setIsAdminTimeOffOpen(true)} data-testid="button-admin-add-time-off">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Off
                </Button>
              )}
              <Button onClick={() => setIsTimeOffRequestOpen(true)} data-testid="button-new-request">
                <CalendarDays className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Time Off Requests</CardTitle>
                <CardDescription>All time off requests and their status</CardDescription>
              </div>
              <Popover open={isStatusFilterOpen} onOpenChange={setIsStatusFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-auto" data-testid="filter-status">
                    <Filter className="h-4 w-4 mr-2" />
                    {requestStatusFilter === "all" ? "All Status" : 
                     requestStatusFilter === "pending" ? "Pending" :
                     requestStatusFilter === "approved" ? "Approved" : "Rejected"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setRequestStatusFilter("all");
                            setIsStatusFilterOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              requestStatusFilter === "all" ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          All Status
                        </CommandItem>
                        <CommandItem
                          value="pending"
                          onSelect={() => {
                            setRequestStatusFilter("pending");
                            setIsStatusFilterOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              requestStatusFilter === "pending" ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Pending
                        </CommandItem>
                        <CommandItem
                          value="approved"
                          onSelect={() => {
                            setRequestStatusFilter("approved");
                            setIsStatusFilterOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              requestStatusFilter === "approved" ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Approved
                        </CommandItem>
                        <CommandItem
                          value="rejected"
                          onSelect={() => {
                            setRequestStatusFilter("rejected");
                            setIsStatusFilterOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              requestStatusFilter === "rejected" ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Rejected
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              {(() => {
                // Apply role-based filtering first, then status filter
                const roleFilteredRequests = filteredTimeOffRequests;
                const filteredRequests = requestStatusFilter === "all" 
                  ? roleFilteredRequests 
                  : roleFilteredRequests.filter(request => request.status === requestStatusFilter);
                  
                return filteredRequests.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    {requestStatusFilter === "all" 
                      ? "No time off requests" 
                      : `No ${requestStatusFilter} requests`}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => {
                    const staff = staffData.find(s => s.id === request.staffId);
                    const isProcessed = request.status !== "pending";
                    const cardClasses = isProcessed 
                      ? `flex items-center justify-between p-4 border rounded-lg ${
                          request.status === "approved" 
                            ? "bg-green-50 border-green-200" 
                            : request.status === "rejected" 
                            ? "bg-red-50 border-red-200" 
                            : ""
                        }` 
                      : "flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200";
                    
                    return (
                      <div key={request.id} className={cardClasses}>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={staff?.profileImagePath ? `/objects${staff.profileImagePath}` : undefined} />
                            <AvatarFallback>
                              {staff?.firstName?.[0]}{staff?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{staff?.firstName} {staff?.lastName}</p>
                            <p className="text-sm text-slate-600">
                              {request.type === 'vacation' ? 'Vacation (PTO)' : 
                               request.type === 'sick' ? 'Sick Leave' : 
                               request.type === 'personal' ? 'Personal Time Off' : 
                               request.type.replace('_', ' ')} • {formatDuration(request.totalHours, request.totalDays)}
                            </p>
                            <p className="text-sm text-slate-600">
                              {request.startDate && request.endDate && 
                                `${format(parseISO(request.startDate), 'M/d/yyyy')} - ${format(parseISO(request.endDate), 'M/d/yyyy')}`
                              }
                            </p>
                            {isProcessed && (
                              <p className="text-xs text-slate-500 mt-1">
                                {request.status === "approved" ? "✓ " : "✗ "}
                                {request.status === "approved" ? "Approved" : "Rejected"} 
                                {request.updatedAt && ` on ${new Date(request.updatedAt).toLocaleDateString()}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            {getStatusBadge(request.status)}
                            {request.reason && (
                              <p className="text-xs text-slate-600 mt-1 max-w-xs truncate">
                                {request.reason}
                              </p>
                            )}
                            {request.status === "rejected" && request.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1 max-w-xs truncate">
                                Reason: {request.rejectionReason}
                              </p>
                            )}
                          </div>
                          {isHRAdmin && (request.status === "pending" || request.status === "approved") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTimeOffRequest(request.id, request.status)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                              disabled={deleteTimeOffMutation.isPending}
                              data-testid={`button-delete-timeoff-${request.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                );
              })()}
              
              {timeOffPagination && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Items per page:</span>
                      <Select value={timeOffPageSize.toString()} onValueChange={(value) => {
                        setTimeOffPageSize(Number(value));
                        setTimeOffPage(1);
                      }}>
                        <SelectTrigger className="w-20" data-testid="select-timeoff-page-size">
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
                      Showing {((timeOffPage - 1) * timeOffPageSize) + 1} to {Math.min(timeOffPage * timeOffPageSize, timeOffPagination.total)} of {timeOffPagination.total} requests
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTimeOffPage(Math.max(1, timeOffPage - 1))}
                      disabled={!timeOffPagination.hasPrevious}
                      data-testid="button-timeoff-prev"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, timeOffPagination.totalPages) }, (_, i) => {
                        let pageNumber: number;
                        if (timeOffPagination.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (timeOffPage <= 3) {
                          pageNumber = i + 1;
                        } else if (timeOffPage >= timeOffPagination.totalPages - 2) {
                          pageNumber = timeOffPagination.totalPages - 4 + i;
                        } else {
                          pageNumber = timeOffPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={timeOffPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeOffPage(pageNumber)}
                            className="w-9 h-9"
                            data-testid={`button-timeoff-page-${pageNumber}`}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTimeOffPage(Math.min(timeOffPagination.totalPages, timeOffPage + 1))}
                      disabled={!timeOffPagination.hasNext}
                      data-testid="button-timeoff-next"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "staff-directory" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Staff Directory</h2>
              <p className="text-slate-600">View all team members and their information</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Department:</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48" data-testid="select-department-filter">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((department) => (
                      <SelectItem key={department} value={department || ''}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Position:</label>
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-48" data-testid="select-position-filter">
                    <SelectValue placeholder="All Positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map((position) => (
                      <SelectItem key={position} value={position || ''}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaffData.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={member.profileImagePath ? `/objects${member.profileImagePath}` : undefined} 
                      />
                      <AvatarFallback>
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.firstName} {member.lastName}</h3>
                      <p className="text-sm text-slate-600">{member.position}</p>
                      <p className="text-sm text-slate-600">{member.department}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.hireDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>Hired {new Date(member.hireDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "org-chart" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Organization Chart</h2>
            <p className="text-slate-600">View team hierarchy and reporting structure</p>
          </div>

          <OrgChart staffData={staffData} clientTeamAssignments={clientTeamAssignments} />
        </div>
      )}

      {activeTab === "applications" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Applicant Tracking</h2>
              <p className="text-slate-600">Manage job applications and recruitment pipeline</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Position:</label>
                <Select value={applicationPositionFilter} onValueChange={setApplicationPositionFilter}>
                  <SelectTrigger className="w-48" data-testid="select-application-position-filter">
                    <SelectValue placeholder="All Positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniqueApplicationPositions.map((position) => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Status:</label>
                <Select value={applicationStatusFilter} onValueChange={setApplicationStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-application-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="not_selected">Not Selected</SelectItem>
                    <SelectItem value="test_sent">Test Sent</SelectItem>
                    <SelectItem value="send_offer">Send Offer</SelectItem>
                    <SelectItem value="offer_sent">Offer Sent</SelectItem>
                    <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                    <SelectItem value="offer_declined">Offer Declined</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {jobApplications.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500">
                Job applications will appear here when candidates apply.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table className="bg-white">
                <TableHeader>
                  <TableRow>
                    <ApplicationSortableHeader field="applicantName">Candidate Name</ApplicationSortableHeader>
                    <ApplicationSortableHeader field="positionTitle">Position</ApplicationSortableHeader>
                    <ApplicationSortableHeader field="stage">Status</ApplicationSortableHeader>
                    <ApplicationSortableHeader field="rating">Rating</ApplicationSortableHeader>
                    <ApplicationSortableHeader field="appliedAt">Application Date</ApplicationSortableHeader>
                    <TableHead className="w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedApplications.map((application) => (
                    <TableRow key={application.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <button
                            onClick={() => window.location.href = `/hr/applicant/${application.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                            data-testid={`link-applicant-${application.id}`}
                          >
                            {application.applicantName}
                          </button>
                          <div className="text-sm text-gray-600">{application.applicantEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {application.positionTitle || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.stage === 'hired' ? (
                          <Badge className="bg-green-500 text-white">Hired 🎉</Badge>
                        ) : (
                          <Select
                            value={application.stage}
                            onValueChange={async (newStage) => {
                              try {
                                const response = await fetch(`/api/hr/job-applications/${application.id}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ stage: newStage }),
                                });
                                
                                if (response.ok) {
                                  queryClient.invalidateQueries({ queryKey: ['/api/hr/job-applications'] });
                                }
                              } catch (error) {
                                console.error('Failed to update status:', error);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[150px]" data-testid={`select-status-${application.id}`}>
                              <SelectValue placeholder="Select status">
                                {application.stage === 'new' && 'New'}
                                {application.stage === 'review' && 'Review'}
                                {application.stage === 'interview' && 'Interview'}
                                {application.stage === 'not_selected' && 'Not Selected'}
                                {application.stage === 'test_sent' && 'Test Sent'}
                                {application.stage === 'send_offer' && 'Send Offer'}
                                {application.stage === 'offer_sent' && 'Offer Sent'}
                                {application.stage === 'offer_accepted' && 'Offer Accepted'}
                                {application.stage === 'offer_declined' && 'Offer Declined'}
                              </SelectValue>
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
                              <SelectItem value="offer_declined">Offer Declined</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/hr/job-applications/${application.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ rating: star }),
                                  });
                                  
                                  if (response.ok) {
                                    queryClient.invalidateQueries({ queryKey: ['/api/hr/job-applications'] });
                                  }
                                } catch (error) {
                                  console.error('Failed to update rating:', error);
                                }
                              }}
                              className="hover:scale-110 transition-transform"
                              data-testid={`rating-star-${star}`}
                            >
                              <Star 
                                className={`h-4 w-4 ${
                                  star <= (application.rating || 0) 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/hr/applicant/${application.id}`}
                            className="flex items-center gap-2"
                            data-testid={`view-application-${application.id}`}
                          >
                            <Eye className="h-4 w-4" />
                            VIEW
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingApplicant(application)}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`delete-application-${application.id}`}
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
            </div>
          )}
        </div>
      )}

      {/* Delete Applicant Confirmation Dialog */}
      <AlertDialog open={!!deletingApplicant} onOpenChange={(open) => !open && setDeletingApplicant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Applicant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application from "{deletingApplicant?.applicantName}"? 
              This will permanently remove all their application data, comments, and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingApplicant && deleteApplicantMutation.mutate(deletingApplicant.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeTab === "time-off-calendar" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Time Off Calendar</h2>
              <p className="text-slate-600 dark:text-slate-400">See who's off and when to help plan workload and approval decisions</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setWhosOffViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  whosOffViewMode === "list"
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={whosOffViewMode === "list" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                data-testid="whosoff-view-list"
              >
                <List className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setWhosOffViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  whosOffViewMode === "calendar"
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={whosOffViewMode === "calendar" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                data-testid="whosoff-view-calendar"
              >
                <LayoutGrid className="h-4 w-4" />
                Calendar
              </button>
            </div>
          </div>

          {whosOffViewMode === "list" && (() => {
            const sortedTimeOff = whosOffSortedTimeOff;
            const totalPages = whosOffTotalPages;
            const totalItems = sortedTimeOff.length;
            const startIndex = (whosOffPage - 1) * whosOffPageSize;
            const endIndex = startIndex + whosOffPageSize;
            const paginatedTimeOff = sortedTimeOff.slice(startIndex, endIndex);

            return (
              <div className="space-y-4">
                {sortedTimeOff.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-500 text-lg">No approved time off in the next 60 days</p>
                      <p className="text-slate-400 text-sm mt-2">Time off requests will appear here once approved</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatedTimeOff.map(([dateRange, data]) => (
                      <Card key={dateRange} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Calendar className="h-5 w-5" style={{ color: "hsl(179, 100%, 39%)" }} />
                              {dateRange}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {data.requests.length} {data.requests.length === 1 ? 'person' : 'people'} off
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {data.requests.map((request: any) => (
                              <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="text-sm font-medium">
                                      {request.staffName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-slate-100">{request.staffName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{request.department} • {request.position}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    Time Off
                                  </Badge>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                                    {request.totalHours && ` (${request.totalHours}h)`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Items per page:</span>
                          <Select value={whosOffPageSize.toString()} onValueChange={(value) => {
                            setWhosOffPageSize(Number(value));
                            setWhosOffPage(1);
                          }}>
                            <SelectTrigger className="w-20" data-testid="select-whosoff-page-size">
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} date ranges
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWhosOffPage(Math.max(1, whosOffPage - 1))}
                          disabled={whosOffPage === 1}
                          data-testid="button-whosoff-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber: number;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (whosOffPage <= 3) {
                              pageNumber = i + 1;
                            } else if (whosOffPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = whosOffPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNumber}
                                variant={whosOffPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => setWhosOffPage(pageNumber)}
                                className="w-9 h-9"
                                data-testid={`button-whosoff-page-${pageNumber}`}
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWhosOffPage(Math.min(totalPages, whosOffPage + 1))}
                          disabled={whosOffPage === totalPages}
                          data-testid="button-whosoff-next"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                
                {sortedTimeOff.length > 0 && (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4 border-t">
                    Showing approved time off for the next 60 days • 
                    {canViewAllData ? ' All staff' : isManager ? ' Your team' : ' Your requests only'}
                  </div>
                )}
              </div>
            );
          })()}

          {whosOffViewMode === "calendar" && (() => {
            const { dayMap, startDayOfWeek, daysInMonth, year, month } = whosOffCalendarData;
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date();
            const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

            const totalCells = startDayOfWeek + daysInMonth;
            const rows = Math.ceil(totalCells / 7);

            return (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWhosOffCalendarMonth(new Date(year, month - 1, 1))}
                      data-testid="whosoff-cal-prev"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-lg">
                      {monthNames[month]} {year}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          setWhosOffCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                        }}
                        className="text-xs"
                        data-testid="whosoff-cal-today"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWhosOffCalendarMonth(new Date(year, month + 1, 1))}
                        data-testid="whosoff-cal-next"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-7 border-b dark:border-gray-700">
                    {dayNames.map(day => (
                      <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: rows * 7 }, (_, i) => {
                      const dayNum = i - startDayOfWeek + 1;
                      const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
                      const isToday = isCurrentMonth && dayNum === today.getDate();
                      const isWeekend = i % 7 === 0 || i % 7 === 6;
                      const entries = isValidDay ? (dayMap[dayNum] || []) : [];

                      return (
                        <div
                          key={i}
                          className={`min-h-[100px] border-b border-r dark:border-gray-700 p-1 ${
                            !isValidDay ? 'bg-slate-50 dark:bg-slate-900/50' : 
                            isWeekend ? 'bg-slate-50/50 dark:bg-slate-900/30' : 
                            'bg-white dark:bg-slate-950'
                          } ${i % 7 === 0 ? 'border-l dark:border-gray-700' : ''}`}
                          data-testid={isValidDay ? `whosoff-cal-day-${dayNum}` : undefined}
                        >
                          {isValidDay && (
                            <>
                              <div className={`text-right text-sm mb-1 ${
                                isToday 
                                  ? 'font-bold' 
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                {isToday ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                                    {dayNum}
                                  </span>
                                ) : dayNum}
                              </div>
                              <div className="space-y-0.5">
                                {entries.slice(0, 3).map(entry => (
                                  <div
                                    key={entry.id}
                                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${entry.color}`}
                                    title={`${entry.staffName} - ${entry.type} (${format(entry.startDate, 'M/d')} - ${format(entry.endDate, 'M/d')})`}
                                  >
                                    {entry.staffName.split(' ')[0]}
                                  </div>
                                ))}
                                {entries.length > 3 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="text-[10px] text-slate-500 dark:text-slate-400 px-1 font-medium hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer w-full text-left">
                                        +{entries.length - 3} more
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        {monthNames[month]} {dayNum} — {entries.length} off
                                      </p>
                                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {entries.map(entry => (
                                          <div key={entry.id} className={`text-xs px-2 py-1 rounded ${entry.color}`}>
                                            <span className="font-medium">{entry.staffName}</span>
                                            <span className="opacity-75 ml-1">• {entry.type}</span>
                                            <div className="text-[10px] opacity-75">
                                              {format(entry.startDate, 'M/d')} - {format(entry.endDate, 'M/d')}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(dayMap).length > 0 && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Legend</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const uniqueStaff = new Map<string, string>();
                          Object.values(dayMap).forEach(entries => {
                            entries.forEach(e => {
                              if (!uniqueStaff.has(e.staffName)) {
                                uniqueStaff.set(e.staffName, e.color);
                              }
                            });
                          });
                          return Array.from(uniqueStaff.entries()).map(([name, color]) => (
                            <span key={name} className={`text-xs px-2 py-1 rounded ${color}`}>
                              {name}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4 mt-4 border-t dark:border-gray-700">
                    {canViewAllData ? 'All staff' : isManager ? 'Your team' : 'Your requests only'}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {activeTab === "onboarding-submissions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">New Hire Onboarding Submissions</h2>
              <p className="text-slate-600">Review and manage new employee onboarding information</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-view-public-form"
              >
                <Link href="/onboarding" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  View Public Form
                </Link>
              </Button>
            </div>
          </div>

          {onboardingSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Onboarding Submissions Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                When new hires complete the onboarding form, their submissions will appear here for review.
              </p>
              <div className="mt-6">
                <Button
                  asChild
                  className="flex items-center gap-2"
                  data-testid="button-open-public-form"
                >
                  <Link href="/onboarding" target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    Open Public Onboarding Form
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table className="bg-white">
                <TableHeader>
                  <TableRow>
                    <OnboardingSortableHeader field="name">Name</OnboardingSortableHeader>
                    <OnboardingSortableHeader field="startDate">Start Date</OnboardingSortableHeader>
                    <OnboardingSortableHeader field="phone">Phone</OnboardingSortableHeader>
                    <OnboardingSortableHeader field="emergencyContact">Emergency Contact</OnboardingSortableHeader>
                    <OnboardingSortableHeader field="paymentPlatform">Payment Platform</OnboardingSortableHeader>
                    <OnboardingSortableHeader field="submitted">Submitted</OnboardingSortableHeader>
                    <OnboardingSortableHeader field="status">Status</OnboardingSortableHeader>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOnboardingSubmissions.map((submission: any) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50" data-testid={`row-submission-${submission.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{submission.name}</p>
                          <p className="text-sm text-slate-600">DOB: {submission.dateOfBirth ? new Date(submission.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.startDate ? format(parseISO(submission.startDate), 'M/d/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {submission.phoneNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{submission.emergencyContactName || 'N/A'}</p>
                          <p className="text-xs text-slate-600">
                            {submission.emergencyContactRelationship} • {submission.emergencyContactNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{submission.paymentPlatform || 'N/A'}</p>
                          <p className="text-xs text-slate-600">{submission.paymentEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-600">{new Date(submission.submittedAt).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={submission.status === 'reviewed' ? 'default' : 'secondary'}
                          className={submission.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {submission.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
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
                                data-testid={`button-view-submission-${submission.id}`}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Onboarding Submission Details</DialogTitle>
                                <DialogDescription>
                                  Complete information submitted by {submission.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Full Name</label>
                                    <p className="text-sm text-slate-900">{submission.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Phone Number</label>
                                    <p className="text-sm text-slate-900">{submission.phoneNumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Date of Birth</label>
                                    <p className="text-sm text-slate-900">
                                      {submission.dateOfBirth ? new Date(submission.dateOfBirth).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Start Date</label>
                                    <p className="text-sm text-slate-900">
                                      {submission.startDate ? format(parseISO(submission.startDate), 'M/d/yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">T-shirt Size</label>
                                    <p className="text-sm text-slate-900">{submission.tshirtSize || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Payment Platform</label>
                                    <p className="text-sm text-slate-900">{submission.paymentPlatform || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-600">Address</label>
                                  <p className="text-sm text-slate-900">{submission.address || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-600">Payment Email</label>
                                  <p className="text-sm text-slate-900">{submission.paymentEmail || 'N/A'}</p>
                                </div>
                                <div className="border-t pt-4">
                                  <h4 className="text-sm font-medium text-slate-600 mb-2">Emergency Contact Information</h4>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-slate-500">Name</label>
                                      <p className="text-sm text-slate-900">{submission.emergencyContactName || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-500">Phone</label>
                                      <p className="text-sm text-slate-900">{submission.emergencyContactNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-500">Relationship</label>
                                      <p className="text-sm text-slate-900">{submission.emergencyContactRelationship || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <label className="text-sm font-medium text-slate-600">Status</label>
                                      <p className="text-sm text-slate-900">
                                        {submission.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                                      </p>
                                    </div>
                                    {submission.status !== 'reviewed' && (
                                      <Button
                                        onClick={() => {
                                          // Mark as reviewed
                                          apiRequest('PUT', `/api/new-hire-onboarding-submissions/${submission.id}`, { status: 'reviewed' }).then(() => {
                                            queryClient.invalidateQueries({ queryKey: ["/api/new-hire-onboarding-submissions"] });
                                            toast({
                                              title: "Success",
                                              variant: "default",
                                              description: "Submission marked as reviewed",
                                            });
                                          }).catch((error) => {
                                            toast({
                                              title: "Error",
                                              description: "Failed to update submission status",
                                              variant: "destructive",
                                            });
                                          });
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                        data-testid={`button-mark-reviewed-${submission.id}`}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Reviewed
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  data-testid={`button-delete-submission-${submission.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the onboarding submission for {submission.name || 'this applicant'}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      apiRequest('DELETE', `/api/new-hire-onboarding-submissions/${submission.id}`).then(() => {
                                        queryClient.invalidateQueries({ queryKey: ["/api/new-hire-onboarding-submissions"] });
                                        toast({
                                          title: "Success",
                                          variant: "default",
                                          description: "Onboarding submission deleted successfully",
                                        });
                                      }).catch((error) => {
                                        toast({
                                          title: "Error",
                                          description: "Failed to delete submission",
                                          variant: "destructive",
                                        });
                                      });
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {onboardingTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Items per page:</span>
                      <Select value={onboardingPageSize.toString()} onValueChange={(value) => {
                        setOnboardingPageSize(Number(value));
                        setOnboardingPage(1);
                      }}>
                        <SelectTrigger className="w-20" data-testid="select-onboarding-page-size">
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
                      Showing {onboardingStartIndex + 1} to {Math.min(onboardingEndIndex, sortedOnboardingSubmissions.length)} of {sortedOnboardingSubmissions.length} submissions
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOnboardingPage(Math.max(1, onboardingPage - 1))}
                      disabled={onboardingPage === 1}
                      data-testid="button-onboarding-prev"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, onboardingTotalPages) }, (_, i) => {
                        let pageNumber: number;
                        if (onboardingTotalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (onboardingPage <= 3) {
                          pageNumber = i + 1;
                        } else if (onboardingPage >= onboardingTotalPages - 2) {
                          pageNumber = onboardingTotalPages - 4 + i;
                        } else {
                          pageNumber = onboardingPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={onboardingPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOnboardingPage(pageNumber)}
                            className="w-9 h-9"
                            data-testid={`button-onboarding-page-${pageNumber}`}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOnboardingPage(Math.min(onboardingTotalPages, onboardingPage + 1))}
                      disabled={onboardingPage === onboardingTotalPages}
                      data-testid="button-onboarding-next"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">HR Reports</h2>
            <p className="text-slate-600">Analytics and insights for management</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Headcount</CardTitle>
                <CardDescription>Employee distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calculate department headcount based on role permissions
                  const staffToAnalyze = canViewAllData ? staffData : (isManager ? directReports : []);
                  
                  const departmentCounts = staffToAnalyze.reduce((acc, staff) => {
                    const dept = staff.department || 'Unassigned';
                    acc[dept] = (acc[dept] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const sortedDepartments = Object.entries(departmentCounts)
                    .sort(([,a], [,b]) => b - a);

                  return (
                    <div className="space-y-3">
                      {sortedDepartments.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No department data available</p>
                      ) : (
                        sortedDepartments.map(([department, count]) => (
                          <div key={department} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{department}</p>
                              <p className="text-sm text-slate-600">{count} {count === 1 ? 'employee' : 'employees'}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900">{count}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Off Usage</CardTitle>
                <CardDescription>Remaining time off days for {(currentUser as any)?.role === 'Admin' ? 'all staff' : 'your team'}</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Filter time off requests based on user role
                  const relevantRequests = (currentUser as any)?.role === 'Admin' 
                    ? timeOffRequests 
                    : timeOffRequests.filter(request => {
                        const staff = staffData.find(s => s.id === request.staffId);
                        return staff && directReports.some(dr => dr.id === staff.id);
                      });

                  // Always show staff data, even if no requests exist

                  // Get policy allocations
                  const currentPolicy = policies[0];
                  const policyAllocations = {
                    vacation: currentPolicy?.vacationDaysDefault ?? 15,
                    sick: currentPolicy?.sickDaysDefault ?? 10,
                    personal: currentPolicy?.personalDaysDefault ?? 3
                  };

                  // Calculate usage and remaining statistics - ONLY COUNT APPROVED REQUESTS
                  const usageByStaff = relevantRequests.reduce((acc, request) => {
                    // Only count approved requests toward time off usage
                    if (request.status !== "approved") return acc;
                    
                    const staff = staffData.find(s => s.id === request.staffId);
                    if (!staff) return acc;
                    
                    const staffKey = `${staff.firstName} ${staff.lastName}`;
                    if (!acc[staffKey]) {
                      // Use policy allocations as primary source, only fall back to staff if policy doesn't exist
                      const staffAllocations = {
                        vacation: policyAllocations.vacation,
                        sick: policyAllocations.sick,
                        personal: policyAllocations.personal
                      };
                      
                      acc[staffKey] = {
                        usedVacation: 0,
                        usedSick: 0,
                        usedPersonal: 0,
                        totalUsed: 0,
                        allocatedVacation: staffAllocations.vacation,
                        allocatedSick: staffAllocations.sick,
                        allocatedPersonal: staffAllocations.personal,
                        department: staff.department,
                        position: staff.position
                      };
                    }
                    
                    // Convert hours to fractional days (assuming 8-hour workday)
                    const hours = parseFloat(request.totalHours || "0");
                    const fractionalDays = hours / 8;
                    
                    if (request.type === 'vacation') acc[staffKey].usedVacation += fractionalDays;
                    if (request.type === 'sick') acc[staffKey].usedSick += fractionalDays;
                    if (request.type === 'personal') acc[staffKey].usedPersonal += fractionalDays;
                    acc[staffKey].totalUsed += fractionalDays;
                    return acc;
                  }, {} as Record<string, any>);

                  // Add staff members who have no time off requests but need to show their full allocation
                  const relevantStaffIds = (currentUser as any)?.role === 'Admin' 
                    ? staffData.map(s => s.id)
                    : directReports.map(dr => dr.id);
                    
                  relevantStaffIds.forEach(staffId => {
                    const staff = staffData.find(s => s.id === staffId);
                    if (!staff) return;
                    
                    const staffKey = `${staff.firstName} ${staff.lastName}`;
                    if (!usageByStaff[staffKey]) {
                      // Use policy allocations as primary source, only fall back to staff if policy doesn't exist  
                      const staffAllocations = {
                        vacation: policyAllocations.vacation,
                        sick: policyAllocations.sick,
                        personal: policyAllocations.personal
                      };
                      
                      usageByStaff[staffKey] = {
                        usedVacation: 0,
                        usedSick: 0,
                        usedPersonal: 0,
                        totalUsed: 0,
                        allocatedVacation: staffAllocations.vacation,
                        allocatedSick: staffAllocations.sick,
                        allocatedPersonal: staffAllocations.personal,
                        department: staff.department,
                        position: staff.position
                      };
                    }
                  });

                  // Filter staff data for reports based on search and filters
                  const filteredUsageData = Object.entries(usageByStaff)
                    .filter(([name, usage]) => {
                      const matchesSearch = name.toLowerCase().includes(reportSearchTerm.toLowerCase());
                      const matchesDepartment = reportDepartmentFilter === "all" || usage.department === reportDepartmentFilter;
                      return matchesSearch && matchesDepartment;
                    })
                    .sort(([,a], [,b]) => {
                      const aTotal = (a.allocatedVacation + a.allocatedSick) - a.totalUsed;
                      const bTotal = (b.allocatedVacation + b.allocatedSick) - b.totalUsed;
                      return bTotal - aTotal;
                    });

                  return (
                    <div className="space-y-4">
                      {/* Search and Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            placeholder="Search employees..."
                            value={reportSearchTerm}
                            onChange={(e) => setReportSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-employees"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Select value={reportDepartmentFilter} onValueChange={setReportDepartmentFilter}>
                            <SelectTrigger className="w-40" data-testid="select-department-filter">
                              <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Departments</SelectItem>
                              {uniqueDepartments.filter((dept): dept is string => !!dept).map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium">Employee</th>
                              <th className="text-left py-2 px-3 font-medium">Department</th>
                              <th className="text-center py-2 px-3 font-medium">Vacation Remaining</th>
                              <th className="text-center py-2 px-3 font-medium">Sick Remaining</th>
                              <th className="text-center py-2 px-3 font-medium">Total Remaining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsageData.map(([name, usage]) => {
                                const remainingVacation = Math.max(0, usage.allocatedVacation - usage.usedVacation);
                                const remainingSick = Math.max(0, usage.allocatedSick - usage.usedSick);
                                const totalRemaining = remainingVacation + remainingSick;
                                
                                return (
                                  <tr key={name} className="border-b">
                                    <td className="py-2 px-3">
                                      <div>
                                        <div className="font-medium">{name}</div>
                                        <div className="text-xs text-slate-500">{usage.position}</div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">{usage.department}</td>
                                    <td className="text-center py-2 px-3">
                                      <span className="text-blue-600 font-medium">{remainingVacation}</span>
                                      <span className="text-xs text-slate-500 ml-1">/ {usage.allocatedVacation}</span>
                                    </td>
                                    <td className="text-center py-2 px-3">
                                      <span className="text-orange-600 font-medium">{remainingSick}</span>
                                      <span className="text-xs text-slate-500 ml-1">/ {usage.allocatedSick}</span>
                                    </td>
                                    <td className="text-center py-2 px-3 font-medium">{totalRemaining}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      {filteredUsageData.length > 0 && (
                        <div className="text-xs text-slate-500 mt-4">
                          Showing {filteredUsageData.length} of {Object.keys(usageByStaff).length} employee{Object.keys(usageByStaff).length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {filteredUsageData.length === 0 && Object.keys(usageByStaff).length > 0 && (
                        <div className="text-center py-8">
                          <div className="text-slate-400 mb-2">
                            <Filter className="h-8 w-8 mx-auto" />
                          </div>
                          <p className="text-slate-500">No employees found matching your filters</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setReportSearchTerm("");
                              setReportDepartmentFilter("all");
                            }}
                            className="mt-2"
                            data-testid="button-clear-filters"
                          >
                            Clear filters
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "approvals" && (isManager || isAdmin) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Time Off Approvals</h2>
            <p className="text-slate-600">Review and approve time off requests{isAdmin && !isManager ? ' from all team members' : ' from your team'}</p>
          </div>

          <ApprovalBoard />
        </div>
      )}

      {activeTab === "job-openings" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Job Openings Management</h2>
              <p className="text-slate-600">Manage and track job openings for your department</p>
            </div>
            {canManageJobOpenings && (
              <Dialog open={isJobOpeningModalOpen} onOpenChange={setIsJobOpeningModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-open-create-modal">
                    Create Job Opening
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job Opening</DialogTitle>
                  <DialogDescription>Fill out the details for a new position opening</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Department Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Department *</label>
                      <Select value={jobOpeningForm.departmentId} onValueChange={handleDepartmentChange} data-testid="select-department">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Position *</label>
                      <Select 
                        value={jobOpeningForm.positionId}
                        onValueChange={handlePositionChange}
                        disabled={!selectedDepartmentId} 
                        data-testid="select-position"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Position" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((pos: any) => (
                            <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Employment Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employment Type *</label>
                      <Select 
                        value={jobOpeningForm.employmentType}
                        onValueChange={(value) => setJobOpeningForm(prev => ({...prev, employmentType: value}))}
                        data-testid="select-employment-type"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Employment Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full-Time</SelectItem>
                          <SelectItem value="part_time">Part-Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hiring Manager */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hiring Manager *</label>
                      <HiringManagerDropdown
                        value={jobOpeningForm.hiringManagerId}
                        onChange={(value) => setJobOpeningForm(prev => ({...prev, hiringManagerId: value}))}
                        staffData={staffData}
                        testId="select-hiring-manager"
                      />
                    </div>

                    {/* Compensation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Compensation</label>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        value={jobOpeningForm.compensation}
                        onChange={(e) => setJobOpeningForm(prev => ({...prev, compensation: e.target.value}))}
                        data-testid="input-compensation"
                      />
                    </div>

                    {/* Compensation Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Compensation Type</label>
                      <Select 
                        value={jobOpeningForm.compensationType}
                        onValueChange={(value) => setJobOpeningForm(prev => ({...prev, compensationType: value}))}
                        data-testid="select-compensation-type"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Job Description & Requirements - Combined Field */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Job Description & Requirements</label>
                      {positionDescription && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={jobOpeningForm.usePositionDescription ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUsePositionDescriptionToggle(true)}
                            data-testid="button-use-default-description"
                          >
                            Use Position Default
                          </Button>
                          <Button
                            type="button"
                            variant={!jobOpeningForm.usePositionDescription ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUsePositionDescriptionToggle(false)}
                            data-testid="button-use-custom-description"
                          >
                            Custom Description
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Show preview of position description when available */}
                    {positionDescription && jobOpeningForm.usePositionDescription && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700 font-medium mb-1">Using position description:</p>
                        <div 
                          className="text-sm text-blue-600" 
                          dangerouslySetInnerHTML={{ __html: positionDescription }}
                        />
                      </div>
                    )}
                    
                    <textarea 
                      className="w-full min-h-[120px] p-3 border rounded-md resize-none"
                      placeholder={jobOpeningForm.usePositionDescription && positionDescription 
                        ? "Position description will be used automatically"
                        : "Describe the role, responsibilities, and requirements..."
                      }
                      value={jobOpeningForm.jobDescription}
                      onChange={(e) => {
                        if (!jobOpeningForm.usePositionDescription) {
                          setJobOpeningForm(prev => ({...prev, jobDescription: e.target.value}));
                        }
                      }}
                      disabled={jobOpeningForm.usePositionDescription && !!positionDescription}
                      data-testid="textarea-job-description"
                    />
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Benefits</label>
                    <textarea 
                      className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                      placeholder="Health insurance, 401k, vacation days..."
                      value={jobOpeningForm.benefits}
                      onChange={(e) => setJobOpeningForm(prev => ({...prev, benefits: e.target.value}))}
                      data-testid="textarea-benefits"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleCreateJobOpening}
                    disabled={createJobOpeningMutation.isPending}
                    data-testid="button-create-opening"
                  >
                    {createJobOpeningMutation.isPending ? "Creating..." : "Create Job Opening"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>

          {/* Edit Job Opening Modal */}
          <Dialog open={isEditJobOpeningModalOpen} onOpenChange={(open) => { setIsEditJobOpeningModalOpen(open); if (!open) { setHiringManagerSearchOpen(false); setHiringManagerSearchValue(""); } }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job Opening</DialogTitle>
                <DialogDescription>Update the details for this position</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department *</label>
                    <Select value={jobOpeningForm.departmentId} onValueChange={handleDepartmentChange} data-testid="select-edit-department">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Position Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position *</label>
                    <Select 
                      value={jobOpeningForm.positionId}
                      onValueChange={handlePositionChange}
                      disabled={!selectedDepartmentId} 
                      data-testid="select-edit-position"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position: any) => (
                          <SelectItem key={position.id} value={position.id}>{position.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employment Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employment Type *</label>
                    <Select value={jobOpeningForm.employmentType} onValueChange={(value) => setJobOpeningForm(prev => ({...prev, employmentType: value}))} data-testid="select-edit-employment-type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hiring Manager */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hiring Manager *</label>
                    <HiringManagerDropdown
                      value={jobOpeningForm.hiringManagerId}
                      onChange={(value) => setJobOpeningForm(prev => ({...prev, hiringManagerId: value}))}
                      staffData={staffData}
                      testId="button-edit-hiring-manager"
                    />
                  </div>

                  {/* Compensation */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compensation</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 p-2 border rounded-md"
                        placeholder="50000"
                        value={jobOpeningForm.compensation}
                        onChange={(e) => setJobOpeningForm(prev => ({...prev, compensation: e.target.value}))}
                        data-testid="input-edit-compensation"
                      />
                      <Select value={jobOpeningForm.compensationType} onValueChange={(value) => setJobOpeningForm(prev => ({...prev, compensationType: value}))} data-testid="select-edit-compensation-type">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Description & Requirements *</label>
                  
                  {positionDescription && (
                    <div className="flex gap-2">
                      <Button 
                        variant={jobOpeningForm.usePositionDescription ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setJobOpeningForm(prev => ({...prev, usePositionDescription: true, jobDescription: positionDescription}));
                        }}
                        data-testid="button-edit-use-default-description"
                      >
                        Use Position Default
                      </Button>
                      <Button 
                        variant={!jobOpeningForm.usePositionDescription ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setJobOpeningForm(prev => ({...prev, usePositionDescription: false}));
                        }}
                        data-testid="button-edit-use-custom-description"
                      >
                        Custom Description
                      </Button>
                    </div>
                  )}
                  
                  {/* Show preview of position description when available */}
                  {positionDescription && jobOpeningForm.usePositionDescription && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700 font-medium mb-1">Using position description:</p>
                      <div 
                        className="text-sm text-blue-600" 
                        dangerouslySetInnerHTML={{ __html: positionDescription }}
                      />
                    </div>
                  )}
                  
                  <textarea 
                    className="w-full min-h-[120px] p-3 border rounded-md resize-none"
                    placeholder={jobOpeningForm.usePositionDescription && positionDescription 
                      ? "Position description will be used automatically"
                      : "Describe the role, responsibilities, and requirements..."
                    }
                    value={jobOpeningForm.jobDescription}
                    onChange={(e) => {
                      if (!jobOpeningForm.usePositionDescription) {
                        setJobOpeningForm(prev => ({...prev, jobDescription: e.target.value}));
                      }
                    }}
                    disabled={jobOpeningForm.usePositionDescription && !!positionDescription}
                    data-testid="textarea-edit-job-description"
                  />
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Benefits</label>
                  <textarea 
                    className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                    placeholder="Health insurance, 401k, vacation days..."
                    value={jobOpeningForm.benefits}
                    onChange={(e) => setJobOpeningForm(prev => ({...prev, benefits: e.target.value}))}
                    data-testid="textarea-edit-benefits"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleUpdateJobOpening}
                  disabled={updateJobOpeningMutation.isPending}
                  data-testid="button-update-opening"
                >
                  {updateJobOpeningMutation.isPending ? "Updating..." : "Update Job Opening"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Careers URL Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Public Application Form URL
              </CardTitle>
              <CardDescription>
                Share this URL with potential applicants or post it on your website. This page displays all open positions and the application form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-1 font-mono text-sm break-all">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/careers`}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyCareersUrl}
                    data-testid="button-copy-careers-url"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(`${window.location.origin}/careers`, '_blank')}
                    data-testid="button-open-careers-url"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Job Openings - Now the main content */}
          <Card>
            <CardHeader>
              <CardTitle>Job Openings</CardTitle>
              <CardDescription>View and manage all job openings</CardDescription>
            </CardHeader>
            <CardContent>
              {jobOpenings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <FileText className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-slate-500 mb-4">No job openings created yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => setIsJobOpeningModalOpen(true)}
                    data-testid="button-create-first-opening"
                  >
                    Create Your First Job Opening
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobOpenings.map((opening: any) => (
                    <div key={opening.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">{opening.positionName}</h3>
                            <p className="text-sm text-slate-600">{opening.departmentName} • {opening.employmentType?.replace('_', ' ')}</p>
                            <p className="text-sm text-slate-600">
                              Hiring Manager: {opening.hiringManagerName}
                            </p>
                            {opening.compensation && (
                              <p className="text-sm text-slate-600">
                                ${parseInt(opening.compensation).toLocaleString()}{opening.compensationType === 'hourly' ? '/hr' : '/year'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={opening.status === 'open' ? 'default' : opening.status === 'draft' ? 'secondary' : 'outline'}
                          className={
                            opening.status === 'open' ? 'bg-green-100 text-green-800 border-green-200' :
                            opening.status === 'draft' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                            opening.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            opening.status === 'filled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {opening.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            opening.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            opening.approvalStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {opening.approvalStatus === 'pending' ? (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Approval
                            </>
                          ) : opening.approvalStatus === 'approved' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </>
                          )}
                        </Badge>
                        {opening.approvalStatus === 'pending' && isManager && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleApproveJobOpening(opening.id, 'approve')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              data-testid={`button-approve-${opening.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleApproveJobOpening(opening.id, 'reject', 'Rejected by manager')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-reject-${opening.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditJobOpening(opening)}
                          data-testid={`button-edit-${opening.id}`}
                        >
                          Edit
                        </Button>
                        {isAdmin && opening.status !== 'filled' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => markAsFilledMutation.mutate(opening.id)}
                            disabled={markAsFilledMutation.isPending}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            data-testid={`button-fill-${opening.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Filled
                          </Button>
                        )}
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-${opening.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Job Opening</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this job opening for "{opening.positionName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteJobOpeningMutation.mutate(opening.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "expense-report" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Submit Expense Report</h2>
            <p className="text-slate-600">Submit expenses for reporting and reimbursement</p>
          </div>

          <ExpenseReportForm />
        </div>
      )}

      {activeTab === "expense-submissions" && (isAdmin || isAccounting) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Expense Report Submissions</h2>
            <p className="text-slate-600">Review and manage expense report submissions</p>
          </div>

          <ExpenseSubmissionsView />
        </div>
      )}

      {activeTab === "offboarding-form" && canViewOffboarding && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Submit Offboarding Form</h2>
            <p className="text-slate-600">Complete the offboarding process for departing employees</p>
          </div>

          <OffboardingForm />
        </div>
      )}

      {activeTab === "offboarding-submissions" && canViewOffboarding && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Offboarding Submissions</h2>
            <p className="text-slate-600">Review and manage offboarding submissions</p>
          </div>

          <OffboardingSubmissionsView />
        </div>
      )}

      {activeTab === "one-on-one" && canViewOneOnOne && (
        <OneOnOneMeetings />
      )}

      {activeTab === "px-meetings" && canViewPxMeetings && (
        <PxMeetings meetingId={activeMeetingId} />
      )}

      {activeTab === "onboarding" && (isManager || isAdmin) && (
        <OnboardingDashboard />
      )}

      {activeTab === "onboarding-checklist" && hasOnboardingChecklist && (
        <OnboardingChecklist />
      )}

      {/* Time Off Request Dialog */}
      <TimeOffRequestForm 
        open={isTimeOffRequestOpen} 
        onOpenChange={setIsTimeOffRequestOpen} 
      />
      
      {/* Admin Add Time Off Dialog */}
      <AdminTimeOffForm
        open={isAdminTimeOffOpen}
        onOpenChange={setIsAdminTimeOffOpen}
        staffList={staffData}
      />
      
      {/* Delete Time Off Request Confirmation Dialog */}
      <AlertDialog open={deleteTimeOffDialog.open} onOpenChange={(open) => !open && setDeleteTimeOffDialog({ open: false, requestId: null, status: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Off Request</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTimeOffDialog.status === 'approved' 
                ? "Are you sure you want to delete this APPROVED time off request? This will restore their time off balance."
                : "Are you sure you want to delete this time off request? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTimeOffRequest}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}