import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Staff, TimeOffRequest, JobApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import TimeOffRequestForm from "@/components/forms/time-off-request-form";
import ApprovalBoard from "@/components/hr/approval-board";

export default function HRPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Admin permission state
  const [isHRAdmin, setIsHRAdmin] = useState(false);
  
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
  
  // Filter states for applications
  const [applicationPositionFilter, setApplicationPositionFilter] = useState("all");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");
  
  // Time off request form state
  const [isTimeOffRequestOpen, setIsTimeOffRequestOpen] = useState(false);

  // Delete time off request mutation (ADMINS ONLY)
  const deleteTimeOffMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("DELETE", `/api/hr/time-off-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/time-off-requests?page=${timeOffPage}&limit=${timeOffPageSize}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests/pending-for-approval"] });
      // Show success message
    },
    onError: (error: any) => {
      console.error("Failed to delete time off request:", error);
    },
  });

  const handleDeleteTimeOffRequest = (requestId: string, status: string) => {
    const message = status === 'approved' 
      ? "Are you sure you want to delete this APPROVED time off request? This will restore their time off balance."
      : "Are you sure you want to delete this time off request? This action cannot be undone.";
      
    if (confirm(message)) {
      deleteTimeOffMutation.mutate(requestId);
    }
  };

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
  
  // Hiring manager search state
  const [hiringManagerSearchOpen, setHiringManagerSearchOpen] = useState(false);
  const [hiringManagerSearchValue, setHiringManagerSearchValue] = useState("");

  // Application sorting state
  const [applicationSortField, setApplicationSortField] = useState<'applicantName' | 'positionTitle' | 'stage' | 'rating' | 'appliedAt' | null>(null);
  const [applicationSortDirection, setApplicationSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch staff data
  const { data: staffData = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });
  
  // Filtered staff for hiring manager search
  const filteredStaff = useMemo(() => {
    return staffData.filter(staff => {
      const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
      const searchTerm = hiringManagerSearchValue.toLowerCase();
      return fullName.includes(searchTerm);
    });
  }, [staffData, hiringManagerSearchValue]);
  
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
  const canViewAllData = isAdmin;
  const canManageJobOpenings = isManager || isAdmin;
  

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
    queryKey: [`/api/hr/time-off-requests?page=${timeOffPage}&limit=${timeOffPageSize}`],
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
    queryKey: ["/api/departments", selectedDepartmentId, "positions"],
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
    if (canViewAllData) {
      return timeOffRequests; // Admins see all requests
    } else if (isManager) {
      // Managers see requests from their team
      const teamStaffIds = directReports.map(staff => staff.id);
      return timeOffRequests.filter(request => teamStaffIds.includes(request.staffId));
    }
    return []; // Regular users don't see time off requests in dashboard
  }, [timeOffRequests, directReports, canViewAllData, isManager]);

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
      description: "Careers URL copied to clipboard",
    });
  };

  const getApplicationStageBadge = (stage: string) => {
    const stageColors = {
      applied: "bg-blue-100 text-blue-800",
      screening: "bg-yellow-100 text-yellow-800",
      interview: "bg-purple-100 text-purple-800",
      offer: "bg-green-100 text-green-800",
      hired: "bg-green-500 text-white",
      rejected: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={stageColors[stage as keyof typeof stageColors] || "bg-gray-100 text-gray-800"}>
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <span>Human Resources</span>
          </h1>
          <p className="text-slate-600">Manage staff, time off, and recruitment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex w-full">
          {[
            ...(isManager || isAdmin ? [{ id: "dashboard", name: "Dashboard", icon: BarChart3, count: 0 }] : []),
            { id: "staff-directory", name: "Staff Directory", icon: Users, count: filteredStaffData.length },
            { id: "time-off", name: "Time Off", icon: CalendarDays, count: pendingTimeOffRequests.length },
            { id: "time-off-calendar", name: "Who's Off", icon: Calendar, count: 0 },
            ...(isManager ? [{ id: "approvals", name: "Approvals", icon: CheckCircle, count: pendingTimeOffRequests.length }] : []),
            { id: "job-openings", name: "Job Openings", icon: FileText, count: activeJobOpenings.length },
            { id: "applications", name: "Applications", icon: UserPlus, count: recentApplications.length },
            ...(isManager || isAdmin ? [{ id: "onboarding-submissions", name: "Onboarding Submissions", icon: UserCheck, count: onboardingSubmissions?.length || 0 }] : []),
            ...(isManager || isAdmin ? [{ id: "reports", name: "Reports", icon: FileText, count: 0 }] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-2 border-b-2 font-medium text-sm flex-1 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            );
          })}
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
                              <AvatarImage src={staff?.profileImagePath || undefined} />
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
                              {request.startDate && new Date(request.startDate).toLocaleDateString()}
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
            <Button onClick={() => setIsTimeOffRequestOpen(true)} data-testid="button-new-request">
              <CalendarDays className="h-4 w-4 mr-2" />
              New Request
            </Button>
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
                const filteredRequests = requestStatusFilter === "all" 
                  ? timeOffRequests 
                  : timeOffRequests.filter(request => request.status === requestStatusFilter);
                  
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
                            <AvatarImage src={staff?.profileImagePath || undefined} />
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
                                `${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}`
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
                    <SelectItem value="offer_rejected">Offer Rejected</SelectItem>
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
                              {application.stage === 'offer_rejected' && 'Offer Rejected'}
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
                            <SelectItem value="offer_rejected">Offer Rejected</SelectItem>
                          </SelectContent>
                        </Select>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === "time-off-calendar" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Time Off Calendar</h2>
            <p className="text-slate-600">See who's off and when to help plan workload and approval decisions</p>
          </div>

          {(() => {
            // Get approved time off requests for the next 60 days
            const today = new Date();
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(today.getDate() + 60);

            // Filter approved time off requests within date range
            const approvedTimeOff = filteredTimeOffRequests.filter(request => {
              if (request.status !== 'approved') return false;
              
              const startDate = new Date(request.startDate);
              const endDate = new Date(request.endDate);
              
              return (startDate <= sixtyDaysFromNow && endDate >= today);
            });

            // Group time off by date ranges
            const timeOffByDateRange = approvedTimeOff.reduce((acc, request) => {
              const staff = staffData.find(s => s.id === request.staffId);
              if (!staff) return acc;

              const startDate = new Date(request.startDate);
              const endDate = new Date(request.endDate);
              
              // Create date range key
              const startStr = startDate.toLocaleDateString();
              const endStr = endDate.toLocaleDateString();
              const dateRangeKey = startStr === endStr ? startStr : `${startStr} - ${endStr}`;
              
              if (!acc[dateRangeKey]) {
                acc[dateRangeKey] = {
                  startDate,
                  endDate,
                  requests: []
                };
              }
              
              acc[dateRangeKey].requests.push({
                ...request,
                staffName: `${staff.firstName} ${staff.lastName}`,
                department: staff.department,
                position: staff.position
              });
              
              return acc;
            }, {} as Record<string, any>);

            // Sort by date
            const sortedTimeOff = Object.entries(timeOffByDateRange)
              .sort(([,a], [,b]) => a.startDate.getTime() - b.startDate.getTime());

            // Removed type color function for privacy

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
                  sortedTimeOff.map(([dateRange, data]) => (
                    <Card key={dateRange} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
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
                            <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="text-sm font-medium">
                                    {request.staffName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">{request.staffName}</p>
                                  <p className="text-sm text-slate-600">{request.department} • {request.position}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                  Time Off
                                </Badge>
                                <p className="text-sm text-slate-600 mt-1">
                                  {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                                  {request.totalHours && ` (${request.totalHours}h)`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {sortedTimeOff.length > 0 && (
                  <div className="text-center text-sm text-slate-500 pt-4 border-t">
                    Showing approved time off for the next 60 days • 
                    {canViewAllData ? ' All staff' : isManager ? ' Your team' : ' Your requests only'}
                  </div>
                )}
              </div>
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Emergency Contact</TableHead>
                    <TableHead>Payment Platform</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onboardingSubmissions.map((submission: any) => (
                    <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{submission.name}</p>
                          <p className="text-sm text-slate-600">DOB: {submission.dateOfBirth ? new Date(submission.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.startDate ? new Date(submission.startDate).toLocaleDateString() : 'N/A'}
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
                                      {submission.startDate ? new Date(submission.startDate).toLocaleDateString() : 'N/A'}
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

      {activeTab === "approvals" && isManager && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Time Off Approvals</h2>
            <p className="text-slate-600">Review and approve time off requests from your team</p>
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
                      <Popover open={hiringManagerSearchOpen} onOpenChange={setHiringManagerSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={hiringManagerSearchOpen}
                            className="w-full justify-between"
                            data-testid="select-hiring-manager"
                          >
                            {jobOpeningForm.hiringManagerId
                              ? staffData.find((staff) => staff.id === jobOpeningForm.hiringManagerId)
                                  ? `${staffData.find((staff) => staff.id === jobOpeningForm.hiringManagerId)?.firstName} ${staffData.find((staff) => staff.id === jobOpeningForm.hiringManagerId)?.lastName}`
                                  : "Select Hiring Manager"
                              : "Select Hiring Manager"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search staff members..." 
                              value={hiringManagerSearchValue}
                              onValueChange={setHiringManagerSearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>No staff member found.</CommandEmpty>
                              <CommandGroup>
                                {filteredStaff.map((staff) => (
                                  <CommandItem
                                    key={staff.id}
                                    value={`${staff.firstName} ${staff.lastName}`}
                                    onSelect={() => {
                                      setJobOpeningForm(prev => ({...prev, hiringManagerId: staff.id}));
                                      setHiringManagerSearchOpen(false);
                                      setHiringManagerSearchValue("");
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        jobOpeningForm.hiringManagerId === staff.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                                        <div className="text-sm text-slate-500">{staff.department} • {staff.position}</div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
          <Dialog open={isEditJobOpeningModalOpen} onOpenChange={setIsEditJobOpeningModalOpen}>
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

                  {/* Hiring Manager - with search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hiring Manager *</label>
                    <Popover open={hiringManagerSearchOpen} onOpenChange={setHiringManagerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={hiringManagerSearchOpen}
                          className="w-full justify-between"
                          data-testid="button-edit-hiring-manager"
                        >
                          {jobOpeningForm.hiringManagerId ? 
                            (() => {
                              const selectedStaff = filteredStaff.find(s => s.id === jobOpeningForm.hiringManagerId);
                              return selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : "Select hiring manager...";
                            })()
                            : "Select hiring manager..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search staff members..." 
                            value={hiringManagerSearchValue}
                            onValueChange={setHiringManagerSearchValue}
                          />
                          <CommandEmpty>No staff members found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {filteredStaff.map((staff) => (
                              <CommandItem
                                key={staff.id}
                                value={`${staff.firstName} ${staff.lastName}`}
                                onSelect={() => {
                                  setJobOpeningForm(prev => ({...prev, hiringManagerId: staff.id}));
                                  setHiringManagerSearchValue("");
                                  setHiringManagerSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    jobOpeningForm.hiringManagerId === staff.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{staff.firstName} {staff.lastName}</span>
                                  <span className="text-sm text-slate-500">{staff.department} • {staff.position}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Off Request Dialog */}
      <TimeOffRequestForm 
        open={isTimeOffRequestOpen} 
        onOpenChange={setIsTimeOffRequestOpen} 
      />
    </div>
  );
}