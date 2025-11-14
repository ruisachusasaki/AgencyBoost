import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Plus, Users, Clock, Star, Play, BookOpen, 
  TrendingUp, Award, Filter, GraduationCap
} from "lucide-react";
import { useHasPermission } from "@/hooks/use-has-permission";

export default function Training() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("browse");
  
  // Check permissions
  const { hasPermission: canViewAnalytics } = useHasPermission('training.view_analytics');
  const { hasPermission: canManageCourses } = useHasPermission('training.manage_courses');
  
  // Fetch training data
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/training/categories"],
  });
  
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/training/courses", { 
      search: searchTerm,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== "all" ? selectedDifficulty : undefined,
      // Show all courses (published and unpublished) so you can see your created courses
    }],
  });
  
  const { data: myCourses = [] } = useQuery({
    queryKey: ["/api/training/my-courses"],
  });

  // Filter courses for display
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = searchTerm === "" || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6" data-testid="training-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Training
          </h1>
          <p className="text-gray-600 mt-1">
            Expand your skills with our comprehensive training courses
          </p>
        </div>
        
        <div className="flex gap-2">
          {canViewAnalytics && (
            <Button variant="outline" asChild data-testid="button-analytics">
              <Link href="/training/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
          )}
          {canManageCourses && (
            <Button asChild data-testid="button-create-course">
              <Link href="/training/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40" data-testid="select-difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "browse", name: "Browse Courses", icon: Search },
              { id: "my-courses", name: `My Courses (${myCourses.length})`, icon: BookOpen },
              { id: "my-progress", name: "My Progress", icon: TrendingUp }
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
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Browse Courses Tab */}
        {activeTab === "browse" && (
          <div className="space-y-6">
            {filteredCourses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedCategory !== "all" || selectedDifficulty !== "all"
                      ? "Try adjusting your search criteria"
                      : "No courses are available yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow overflow-hidden" data-testid={`course-card-${course.id}`}>
                    {/* Course Thumbnail */}
                    <Link href={`/training/courses/${course.id}`} className="block cursor-pointer" data-testid={`image-link-course-${course.id}`}>
                      {course.thumbnailUrl ? (
                        <div className="aspect-video w-full overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full bg-gray-100 hidden items-center justify-center">
                            <BookOpen className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-gray-100 flex items-center justify-center hover:opacity-90 transition-opacity">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </Link>
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {course.shortDescription || course.description?.substring(0, 100) + "..."}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {course.categoryName && (
                          <Badge variant="secondary" style={{ backgroundColor: course.categoryColor + "20", color: course.categoryColor }}>
                            {course.categoryName}
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {course.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course.lessonCount} lessons
                        </div>
                        
                        {course.estimatedDuration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.round(course.estimatedDuration / 60)}h
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollmentCount} enrolled
                        </div>
                      </div>
                      
                      <Button asChild className="w-full" data-testid={`button-start-course-${course.id}`}>
                        <Link href={`/training/courses/${course.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          {myCourses.some(enrollment => enrollment.courseId === course.id) ? 'Continue Course' : 'Start Course'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === "my-courses" && (
          <div className="space-y-6">
            {myCourses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't enrolled in any courses yet. Browse available courses to get started.
                  </p>
                  <Button asChild data-testid="button-browse-courses">
                    <Link href="/training">
                      <Search className="h-4 w-4 mr-2" />
                      Browse Courses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((enrollment) => (
                  <Card key={enrollment.enrollmentId} className="hover:shadow-md transition-shadow overflow-hidden" data-testid={`my-course-card-${enrollment.courseId}`}>
                    {/* Course Thumbnail */}
                    <Link href={`/training/courses/${enrollment.courseId}`} className="block cursor-pointer" data-testid={`image-link-my-course-${enrollment.courseId}`}>
                      {enrollment.thumbnailUrl ? (
                        <div className="aspect-video w-full overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                          <img 
                            src={enrollment.thumbnailUrl} 
                            alt={enrollment.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full bg-gray-100 hidden items-center justify-center">
                            <BookOpen className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-gray-100 flex items-center justify-center hover:opacity-90 transition-opacity">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </Link>
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{enrollment.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {enrollment.shortDescription}
                          </CardDescription>
                        </div>
                        
                        {enrollment.enrollmentStatus === "completed" && (
                          <Award className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {enrollment.categoryName && (
                          <Badge variant="secondary" style={{ backgroundColor: enrollment.categoryColor + "20", color: enrollment.categoryColor }}>
                            {enrollment.categoryName}
                          </Badge>
                        )}
                        <Badge 
                          variant={enrollment.enrollmentStatus === "completed" ? "default" : "outline"}
                          className="capitalize"
                        >
                          {enrollment.enrollmentStatus.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{enrollment.progress || 0}%</span>
                        </div>
                        <Progress value={enrollment.progress || 0} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">
                          {enrollment.completedLessons || 0} of {enrollment.totalLessons || 0} lessons completed
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </span>
                        {enrollment.lastAccessedAt && (
                          <span>
                            Last accessed: {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <Button asChild className="w-full" data-testid={`button-continue-course-${enrollment.courseId}`}>
                        <Link href={`/training/courses/${enrollment.courseId}`}>
                          {enrollment.enrollmentStatus === "completed" ? (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Review Course
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Continue Learning
                            </>
                          )}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Progress Tab */}
        {activeTab === "my-progress" && (
          <MyProgressTab />
        )}
      </div>
    </div>
  );
}

// Personal Analytics Component
function MyProgressTab() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/training/my-analytics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics available</h3>
          <p className="text-gray-500">Start taking courses to see your progress!</p>
        </CardContent>
      </Card>
    );
  }

  const { overview, courseProgress, recentActivity } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card data-testid="card-total-enrollments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.inProgressCourses} in progress
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-courses">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview.completedCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalEnrollments > 0 
                ? `${Math.round((overview.completedCourses / overview.totalEnrollments) * 100)}% completion rate`
                : "No courses yet"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-average-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageProgress}%</div>
            <Progress value={overview.averageProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-lessons-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalLessonsCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-time-spent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent Learning</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.totalTimeSpentMinutes < 60 
                ? `${overview.totalTimeSpentMinutes}m`
                : `${Math.floor(overview.totalTimeSpentMinutes / 60)}h ${overview.totalTimeSpentMinutes % 60}m`
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Video watch time
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Details */}
      {courseProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Course Progress</CardTitle>
            <CardDescription>Detailed view of your enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseProgress.map((course) => (
                <div key={course.courseId} className="border rounded-lg p-4 space-y-3" data-testid={`progress-course-${course.courseId}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/training/courses/${course.courseId}`} className="font-medium hover:text-primary">
                        {course.courseTitle}
                      </Link>
                      <div className="flex gap-2 mt-2">
                        {course.categoryName && (
                          <Badge variant="secondary" style={{ backgroundColor: course.categoryColor + "20", color: course.categoryColor }}>
                            {course.categoryName}
                          </Badge>
                        )}
                        <Badge 
                          variant={course.enrollmentStatus === "completed" ? "default" : "outline"}
                          className="capitalize"
                        >
                          {course.enrollmentStatus.replace("_", " ")}
                        </Badge>
                        {course.difficulty && (
                          <Badge variant="outline" className="capitalize">
                            {course.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {course.enrollmentStatus === "completed" && (
                      <Award className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{course.completedLessons || 0} of {course.totalLessons || 0} lessons</span>
                      {course.estimatedDuration && (
                        <span>{Math.round(course.estimatedDuration / 60)}h total</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}</span>
                    {course.completedAt ? (
                      <span className="text-green-600 font-medium">
                        Completed: {new Date(course.completedAt).toLocaleDateString()}
                      </span>
                    ) : course.lastAccessedAt ? (
                      <span>Last accessed: {new Date(course.lastAccessedAt).toLocaleDateString()}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your learning activity in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={`${activity.lessonId}-${index}`} className="flex items-start gap-3 pb-3 border-b last:border-0" data-testid={`activity-${index}`}>
                  <div className={`mt-1 ${activity.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                    {activity.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.lessonTitle}</p>
                    <p className="text-xs text-gray-500">{activity.courseTitle}</p>
                  </div>
                  {activity.completedAt && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {courseProgress.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Learning Journey</h3>
            <p className="text-gray-500 mb-4">
              Enroll in courses to track your progress and see your achievements here.
            </p>
            <Button asChild data-testid="button-browse-courses-empty">
              <Link href="/training">
                <Search className="h-4 w-4 mr-2" />
                Browse Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}