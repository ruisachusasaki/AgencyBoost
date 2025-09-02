import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Plus, Users, Clock, Star, Play, BookOpen, 
  TrendingUp, Award, Filter, GraduationCap
} from "lucide-react";

export default function Training() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  
  // Fetch training data
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/training/categories"],
  });
  
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/training/courses", { 
      search: searchTerm,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== "all" ? selectedDifficulty : undefined,
      published: true
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
          <Button variant="outline" asChild data-testid="button-analytics">
            <Link href="/training/analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button asChild data-testid="button-create-course">
            <Link href="/training/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
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
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse" data-testid="tab-browse">
            <Search className="h-4 w-4 mr-2" />
            Browse Courses
          </TabsTrigger>
          <TabsTrigger value="my-courses" data-testid="tab-my-courses">
            <BookOpen className="h-4 w-4 mr-2" />
            My Courses ({myCourses.length})
          </TabsTrigger>
        </TabsList>

        {/* Browse Courses Tab */}
        <TabsContent value="browse" className="space-y-6">
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
                <Card key={course.id} className="hover:shadow-md transition-shadow" data-testid={`course-card-${course.id}`}>
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
                        Start Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Courses Tab */}
        <TabsContent value="my-courses" className="space-y-6">
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
                <Card key={enrollment.enrollmentId} className="hover:shadow-md transition-shadow" data-testid={`my-course-card-${enrollment.courseId}`}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}