import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  TrendingUp,
  GraduationCap,
  Clock,
  UserCheck,
  Target,
  BarChart3,
  ArrowLeft,
  ShieldAlert
} from "lucide-react";
import { useHasPermission } from "@/hooks/use-has-permission";

interface CourseStats {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  completedEnrollments: number;
  avgProgress: number;
}

interface UserStats {
  userId: string;
  userName: string;
  totalEnrollments: number;
  completedCourses: number;
  avgProgress: number;
}

interface RecentActivity {
  id: string;
  userName: string;
  courseTitle: string;
  enrolledAt: string;
  status: string;
  progress: number;
}

interface AnalyticsData {
  summary: {
    totalCourses: number;
    totalCategories: number;
    totalEnrollments: number;
  };
  courseStats: CourseStats[];
  userStats: UserStats[];
  recentActivity: RecentActivity[];
}

export default function TrainingAnalytics() {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [, setLocation] = useLocation();
  
  // Check permission for viewing analytics
  const { hasPermission: canViewAnalytics, isLoading: permissionLoading } = useHasPermission('training.analytics.view');

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!permissionLoading && !canViewAnalytics) {
      setLocation('/training');
    }
  }, [canViewAnalytics, permissionLoading, setLocation]);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: [
      "/api/training/analytics", 
      { courseId: selectedCourse !== "all" ? selectedCourse : undefined, 
        userId: selectedUser !== "all" ? selectedUser : undefined }
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCourse !== "all") {
        params.append("courseId", selectedCourse);
      }
      if (selectedUser !== "all") {
        params.append("userId", selectedUser);
      }
      
      const url = `/api/training/analytics${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  // Show access denied if no permission
  if (permissionLoading) {
    return (
      <div className="space-y-6">
        <div>Loading...</div>
      </div>
    );
  }

  if (!canViewAnalytics) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to view training analytics. Contact your administrator if you need access.
          </AlertDescription>
        </Alert>
        <Link href="/training">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Link href="/training">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Training</span>
            </Button>
          </Link>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Training Analytics
          </h1>
          <p className="text-gray-600 mt-1">Employee training progress and performance overview</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Link href="/training">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Training</span>
            </Button>
          </Link>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Training Analytics
          </h1>
          <p className="text-gray-600 mt-1">Employee training progress and performance overview</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">No analytics data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = analytics.summary.totalEnrollments > 0 
    ? (analytics.courseStats.reduce((sum, course) => sum + course.completedEnrollments, 0) / analytics.summary.totalEnrollments * 100)
    : 0;

  const avgUserProgress = analytics.userStats.length > 0 
    ? analytics.userStats.reduce((sum, user) => sum + (Number(user.avgProgress) || 0), 0) / analytics.userStats.length
    : 0;

  const activeUsers = analytics.userStats.filter(user => (Number(user.avgProgress) || 0) > 0).length;

  // Filter data based on selected filters
  const filteredUserStats = analytics.userStats.filter(user => {
    const matchesUserFilter = selectedUser === "all" || user.userId === selectedUser;
    return matchesUserFilter;
  });

  const filteredCourseStats = analytics.courseStats.filter(course => {
    const matchesCourseFilter = selectedCourse === "all" || 
      course.courseId === selectedCourse;
    return matchesCourseFilter;
  });

  const filteredRecentActivity = analytics.recentActivity.filter(activity => {
    const matchesUserFilter = selectedUser === "all" || 
      analytics.userStats.find(user => user.userId === selectedUser)?.userName === activity.userName;
    const matchesCourseFilter = selectedCourse === "all" || 
      analytics.courseStats.find(course => course.courseId === selectedCourse)?.courseTitle === activity.courseTitle;
    return matchesUserFilter && matchesCourseFilter;
  });

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/training">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Training</span>
          </Button>
        </Link>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Training Analytics
        </h1>
        <p className="text-gray-600 mt-1">Employee training progress and performance overview</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {(analytics?.userStats || []).map((user) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {(analytics?.courseStats || []).map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Learners</p>
                <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCourseStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No courses found matching your filters.</p>
              ) : (
                filteredCourseStats.slice(0, 6).map((course) => {
                const courseCompletionRate = (Number(course.totalEnrollments) || 0) > 0 
                  ? ((Number(course.completedEnrollments) || 0) / (Number(course.totalEnrollments) || 1) * 100) 
                  : 0;
                
                return (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {course.courseTitle}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {course.completedEnrollments}/{course.totalEnrollments} completed
                        </p>
                      </div>
                      <Badge variant={courseCompletionRate >= 80 ? "default" : courseCompletionRate >= 50 ? "secondary" : "destructive"} className="ml-2">
                        {courseCompletionRate.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={courseCompletionRate} className="h-2" />
                  </div>
                );
              })
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Employee Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUserStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No employees found matching your filters.</p>
              ) : (
                filteredUserStats.slice(0, 6).map((user) => (
                <div key={user.userId} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {user.userName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {user.completedCourses}/{user.totalEnrollments} courses completed
                      </p>
                    </div>
                    <Badge variant={(Number(user.avgProgress) || 0) >= 80 ? "default" : (Number(user.avgProgress) || 0) >= 50 ? "secondary" : "destructive"} className="ml-2">
                      {(Number(user.avgProgress) || 0).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={Number(user.avgProgress) || 0} className="h-2" />
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Training Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity found matching your filters.</p>
            ) : (
              filteredRecentActivity.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName || "Unknown User"}</span> enrolled in {" "}
                    <span className="font-medium">{activity.courseTitle || "Unknown Course"}</span>
                    <span className="text-gray-500"> - {activity.progress || 0}% complete</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.enrolledAt).toLocaleDateString()} at{" "}
                    {new Date(activity.enrolledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}