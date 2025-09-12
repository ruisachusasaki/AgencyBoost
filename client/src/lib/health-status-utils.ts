import type { ClientHealthScore } from "@shared/schema";

export interface HealthStatusResult {
  shouldHighlight: boolean;
  highlightType: 'red' | 'yellow' | null;
  reason: string;
  weeks: {
    weekStart: string;
    healthIndicator: string;
    isGreen: boolean;
  }[];
}

/**
 * Analyzes the last 4 weeks of client health scores to determine highlighting
 * 
 * Rules:
 * - Red background: 4 consecutive non-green weeks with 2+ red weeks AND not showing improvement
 * - Yellow background: 4 consecutive non-green weeks with mostly yellow OR showing improvement from red to yellow
 * - Remove highlights when 1+ green weeks appear in last 4 weeks
 */
export function analyzeHealthStatus(healthScores: ClientHealthScore[]): HealthStatusResult {
  // Sort scores by week start date (most recent first)
  const sortedScores = [...healthScores].sort((a, b) => 
    new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
  );

  // Get the last 4 weeks
  const lastFourWeeks = sortedScores.slice(0, 4);
  
  // If we don't have 4 weeks of data, no highlighting
  if (lastFourWeeks.length < 4) {
    return {
      shouldHighlight: false,
      highlightType: null,
      reason: 'Insufficient data (less than 4 weeks)',
      weeks: lastFourWeeks.map(score => ({
        weekStart: score.weekStartDate,
        healthIndicator: score.healthIndicator,
        isGreen: score.healthIndicator === 'Green'
      }))
    };
  }

  // Check if any of the last 4 weeks are green
  const hasGreenWeek = lastFourWeeks.some(score => score.healthIndicator === 'Green');
  
  if (hasGreenWeek) {
    return {
      shouldHighlight: false,
      highlightType: null,
      reason: 'Has green week(s) in last 4 weeks',
      weeks: lastFourWeeks.map(score => ({
        weekStart: score.weekStartDate,
        healthIndicator: score.healthIndicator,
        isGreen: score.healthIndicator === 'Green'
      }))
    };
  }

  // All 4 weeks are non-green (Yellow or Red)
  const redWeeks = lastFourWeeks.filter(score => score.healthIndicator === 'Red');
  const yellowWeeks = lastFourWeeks.filter(score => score.healthIndicator === 'Yellow');
  
  // Check for improvement pattern (Red to Yellow trend)
  const isShowingImprovement = checkImprovementPattern(lastFourWeeks);
  
  // Determine highlighting type
  let highlightType: 'red' | 'yellow' | null = null;
  let reason = '';

  if (redWeeks.length >= 2 && !isShowingImprovement) {
    // Red background: 4 consecutive non-green weeks with 2+ red weeks AND not showing improvement
    highlightType = 'red';
    reason = `${redWeeks.length} red weeks in last 4 weeks, no improvement trend`;
  } else if (yellowWeeks.length >= 2 || isShowingImprovement) {
    // Yellow background: 4 consecutive non-green weeks with mostly yellow OR showing improvement
    highlightType = 'yellow';
    reason = isShowingImprovement 
      ? 'Showing improvement from red to yellow'
      : `${yellowWeeks.length} yellow weeks in last 4 weeks`;
  }

  return {
    shouldHighlight: highlightType !== null,
    highlightType,
    reason,
    weeks: lastFourWeeks.map(score => ({
      weekStart: score.weekStartDate,
      healthIndicator: score.healthIndicator,
      isGreen: score.healthIndicator === 'Green'
    }))
  };
}

/**
 * Checks if there's an improvement pattern (Red scores becoming Yellow scores over time)
 */
function checkImprovementPattern(weeklyScores: ClientHealthScore[]): boolean {
  // Look for pattern where more recent weeks are better than older weeks
  // weeklyScores is already sorted by most recent first
  
  if (weeklyScores.length < 2) return false;
  
  // Simple improvement check: recent weeks have fewer red scores than older weeks
  const recentTwoWeeks = weeklyScores.slice(0, 2);
  const olderTwoWeeks = weeklyScores.slice(2, 4);
  
  const recentRedCount = recentTwoWeeks.filter(score => score.healthIndicator === 'Red').length;
  const olderRedCount = olderTwoWeeks.filter(score => score.healthIndicator === 'Red').length;
  
  // Improvement if recent weeks have fewer red scores than older weeks
  return recentRedCount < olderRedCount && olderRedCount > 0;
}

/**
 * Formats a health status tooltip message
 */
export function formatHealthStatusTooltip(healthStatus: HealthStatusResult): string {
  if (!healthStatus.shouldHighlight) {
    return 'Client health status is good';
  }

  const weekSummary = healthStatus.weeks.map(week => {
    const date = new Date(week.weekStart);
    const weekOfYear = getWeekOfYear(date);
    return `Week ${weekOfYear}: ${week.healthIndicator}`;
  }).join('\n');

  return `Health Alert: ${healthStatus.reason}\n\nLast 4 weeks:\n${weekSummary}`;
}

/**
 * Gets the week number of the year for a given date
 */
function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Gets CSS classes for health status highlighting
 */
export function getHealthStatusClasses(healthStatus: HealthStatusResult): string {
  if (!healthStatus.shouldHighlight || !healthStatus.highlightType) {
    return '';
  }

  const baseClasses = 'transition-colors duration-200';
  
  switch (healthStatus.highlightType) {
    case 'red':
      return `${baseClasses} bg-red-50 border-red-200 text-red-900`;
    case 'yellow':
      return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-900`;
    default:
      return baseClasses;
  }
}