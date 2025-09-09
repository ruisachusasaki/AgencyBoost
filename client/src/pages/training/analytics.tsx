import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  TrendingUp,
  GraduationCap,
  Clock,
  UserCheck,
  Target
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
  email: string;
  totalCourses: number;
  completedCourses: number;
  avgProgress: number;
}

interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  action: string;
  createdAt: string;
}

interface AnalyticsData {
  totalCourses: number;
  totalCategories: number;
  totalEnrollments: number;
  courseStats: CourseStats[];
  userStats: UserStats[];
  recentActivity: RecentActivity[];
}

export default function TrainingAnalytics() {
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

  const completionRate = analytics.totalEnrollments > 0 
    ? (analytics.courseStats.reduce((sum, course) => sum + course.completedEnrollments, 0) / analytics.totalEnrollments * 100)
    : 0;

  const avgUserProgress = analytics.userStats.length > 0 
    ? analytics.userStats.reduce((sum, user) => sum + user.avgProgress, 0) / analytics.userStats.length
    : 0;

  const activeUsers = analytics.userStats.filter(user => user.avgProgress > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
        <p className="text-gray-600 mt-1">Employee training progress and performance overview</p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalCourses}</p>
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
                <p className="text-2xl font-bold text-gray-900">{analytics.totalEnrollments}</p>
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
              {analytics.courseStats.slice(0, 6).map((course) => {
                const courseCompletionRate = course.totalEnrollments > 0 
                  ? (course.completedEnrollments / course.totalEnrollments * 100) 
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
              {analytics.userStats.slice(0, 6).map((user) => (
                <div key={user.userId} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {user.userName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {user.completedCourses}/{user.totalCourses} courses completed
                      </p>
                    </div>
                    <Badge variant={user.avgProgress >= 80 ? "default" : user.avgProgress >= 50 ? "secondary" : "destructive"} className="ml-2">
                      {user.avgProgress.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={user.avgProgress} className="h-2" />
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
            {analytics.recentActivity.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span> {activity.action.toLowerCase()} {" "}
                    <span className="font-medium">{activity.courseTitle}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()} at{" "}
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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