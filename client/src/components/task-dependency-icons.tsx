import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  GitBranch, 
  Target, 
  RotateCcw
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface TaskDependencyIconsProps {
  taskId: string;
  className?: string;
}

interface TaskDependency {
  id: string;
  dependsOnTaskId: string;
  dependencyType: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
  task: {
    id: string;
    title: string;
    status: string;
  };
}

interface DependencyResponse {
  dependencies: TaskDependency[];
  dependentTasks: any[];
}

const dependencyTypeConfig = {
  finish_to_start: {
    icon: AlertTriangle,
    label: "Finish to Start",
    description: "This task starts after dependency finishes",
    color: "text-amber-500"
  },
  start_to_start: {
    icon: GitBranch, 
    label: "Start to Start",
    description: "This task starts when dependency starts", 
    color: "text-green-500"
  },
  finish_to_finish: {
    icon: Target,
    label: "Finish to Finish", 
    description: "This task finishes when dependency finishes",
    color: "text-orange-500"
  },
  start_to_finish: {
    icon: RotateCcw,
    label: "Start to Finish",
    description: "This task finishes when dependency starts",
    color: "text-purple-500"
  }
};

export function TaskDependencyIcons({ taskId, className = "" }: TaskDependencyIconsProps) {
  const { data: dependencyResponse } = useQuery<DependencyResponse>({
    queryKey: ["/api/tasks", taskId, "dependencies"],
  });

  // Extract dependencies array from the response
  const dependencyList = dependencyResponse?.dependencies || [];
  
  if (dependencyList.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ml-2 ${className}`}>
      {dependencyList.map((dependency: TaskDependency) => {
        // Skip if dependency data is incomplete
        if (!dependency.dependencyType || !dependency.task?.title) {
          return null;
        }
        
        const config = dependencyTypeConfig[dependency.dependencyType];
        if (!config) {
          return null;
        }
        
        const Icon = config.icon;
        
        return (
          <TooltipProvider key={dependency.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Icon 
                    className={`h-4 w-4 ${config.color} opacity-75 hover:opacity-100 transition-opacity`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <div className="text-center">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Depends on: "{dependency.task.title}"
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {config.description}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}