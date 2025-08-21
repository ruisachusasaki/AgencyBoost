import type { Task } from "@shared/schema";

export interface ProjectProgress {
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
}

/**
 * Calculate project progress based on task completion
 * @param tasks - All tasks for the project
 * @returns Project progress information
 */
export function calculateProjectProgress(tasks: Task[]): ProjectProgress {
  if (tasks.length === 0) {
    return {
      completedTasks: 0,
      totalTasks: 0,
      progressPercentage: 0,
    };
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  return {
    completedTasks,
    totalTasks,
    progressPercentage,
  };
}

/**
 * Get tasks for a specific project
 * @param allTasks - All tasks from the API
 * @param projectId - The project ID to filter by
 * @returns Tasks belonging to the project
 */
export function getProjectTasks(allTasks: Task[], projectId: string): Task[] {
  return allTasks.filter(task => task.projectId === projectId);
}

/**
 * Get progress summary for multiple projects
 * @param allTasks - All tasks from the API
 * @param projectIds - Array of project IDs
 * @returns Map of project ID to progress information
 */
export function getProjectsProgress(allTasks: Task[], projectIds: string[]): Map<string, ProjectProgress> {
  const progressMap = new Map<string, ProjectProgress>();
  
  projectIds.forEach(projectId => {
    const projectTasks = getProjectTasks(allTasks, projectId);
    const progress = calculateProjectProgress(projectTasks);
    progressMap.set(projectId, progress);
  });

  return progressMap;
}