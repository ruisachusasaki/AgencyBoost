import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  TrendingUp,
  GraduationCap,
  Clock,
  UserCheck,
  Target,
  Search,
  BarChart3
} from "lucide-react";

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
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/training/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Training Analytics
        </h1>
        <p className="text-gray-600 mt-1">Employee training progress and performance overview</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
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
              {(analytics.courseStats || []).slice(0, 6).map((course) => {
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
              })}
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
              {(analytics.userStats || []).slice(0, 6).map((user) => (
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
              ))}
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
            {(analytics.recentActivity || []).slice(0, 8).map((activity) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}