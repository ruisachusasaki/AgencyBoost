import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TaskDetailUltraBasic() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ultra Basic Task Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Task ID from URL:</strong> {taskId || "No ID"}
            </div>
            <div>
              <strong>Current Location:</strong> {location}
            </div>
            <div>
              <strong>Status:</strong> Component loaded successfully
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}