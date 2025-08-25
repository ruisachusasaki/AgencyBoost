import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  UserCheck
} from "lucide-react";
import { Staff, TimeOffRequest, JobApplication } from "@shared/schema";
import TimeOffRequestForm from "@/components/forms/time-off-request-form";
import ApprovalBoard from "@/components/hr/approval-board";

export default function HRPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Filter states for staff directory
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  
  // Time off request form state
  const [isTimeOffRequestOpen, setIsTimeOffRequestOpen] = useState(false);

  // Fetch staff data
  const { data: staffData = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });
  
  // Check if current user is a manager (has direct reports)
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/current-user"],
  });
  
  const { data: directReports = [], isLoading: directReportsLoading } = useQuery<Staff[]>({
    queryKey: ["/api/hr/direct-reports"],
    enabled: !!currentUser?.id,
  });
  
  const isManager = directReports.length > 0;
  

  // Fetch time off requests
  const { data: timeOffRequests = [] } = useQuery<TimeOffRequest[]>({
    queryKey: ["/api/hr/time-off-requests"],
  });

  // Fetch job applications
  const { data: jobApplications = [] } = useQuery<JobApplication[]>({
    queryKey: ["/api/hr/job-applications"],
  });

  const pendingTimeOffRequests = timeOffRequests.filter(req => req.status === "pending");
  const recentApplications = jobApplications.filter(app => {
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

  // Filter staff data based on selected filters
  const filteredStaffData = useMemo(() => {
    return staffData.filter(member => {
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
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "dashboard", name: "Dashboard", icon: BarChart3, count: 0 },
            { id: "time-off", name: "Time Off", icon: CalendarDays, count: pendingTimeOffRequests.length },
            { id: "staff-directory", name: "Staff Directory", icon: Users, count: staffData.length },
            ...(isManager ? [{ id: "approvals", name: "Approvals", icon: CheckCircle, count: pendingTimeOffRequests.length }] : []),
            { id: "applications", name: "Applications", icon: UserPlus, count: recentApplications.length },
            { id: "reports", name: "Reports", icon: FileText, count: 0 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
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
                <div className="text-2xl font-bold">{staffData.length}</div>
                <p className="text-xs text-slate-600">Active employees</p>
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
                <div className="text-2xl font-bold">3</div>
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
            <CardHeader>
              <CardTitle>Time Off Requests</CardTitle>
              <CardDescription>All time off requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {timeOffRequests.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No time off requests</p>
              ) : (
                <div className="space-y-4">
                  {timeOffRequests.map((request) => {
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
                              {request.type.replace('_', ' ')} • {request.totalDays} days
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
                        <div className="text-right">
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
                      </div>
                    );
                  })}
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
                  <SelectTrigger className="w-40" data-testid="select-department-filter">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((department) => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Position:</label>
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-40" data-testid="select-position-filter">
                    <SelectValue placeholder="All Positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map((position) => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>Track candidates through the hiring process</CardDescription>
            </CardHeader>
            <CardContent>
              {jobApplications.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No job applications</p>
              ) : (
                <div className="space-y-4">
                  {jobApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{application.applicantName}</h4>
                        <p className="text-sm text-slate-600">{application.applicantEmail}</p>
                        {application.applicantPhone && (
                          <p className="text-sm text-slate-600">{application.applicantPhone}</p>
                        )}
                        <p className="text-sm text-slate-600">
                          Applied {application.appliedAt && new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {getApplicationStageBadge(application.stage)}
                        {application.experience && (
                          <p className="text-xs text-slate-600 mt-1">
                            {application.experience} level
                          </p>
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
                <p className="text-slate-500 text-center py-8">Department analytics coming soon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Off Usage</CardTitle>
                <CardDescription>Time off trends and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-center py-8">Time off analytics coming soon</p>
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

      {/* Time Off Request Dialog */}
      <TimeOffRequestForm 
        open={isTimeOffRequestOpen} 
        onOpenChange={setIsTimeOffRequestOpen} 
      />
    </div>
  );
}