import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trash2, GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TrainingCompletionWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-training-completion" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Training Completion Status
            </CardTitle>
            <CardDescription className="text-xs">
              Course completion rates
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          data-testid="button-remove-widget"
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {data && data.length > 0 ? (
              data.map((course: any) => (
                <div
                  key={course.courseId}
                  data-testid={`training-course-${course.courseId}`}
                  className="p-3 border rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm flex-1 min-w-0 truncate" data-testid={`course-name-${course.courseId}`}>
                        {course.courseName}
                      </p>
                      <span className="text-xs font-medium text-primary">
                        {course.completionRate}%
                      </span>
                    </div>
                    <Progress value={parseFloat(course.completionRate)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {course.completedEnrollments}/{course.totalEnrollments} completed
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active training courses</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
