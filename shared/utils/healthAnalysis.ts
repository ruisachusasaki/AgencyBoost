import type { ClientHealthScore } from "../schema";

/**
 * Default field scoring values based on business rules
 */
const DEFAULT_FIELD_SCORING = {
  goals: {
    Above: 3,
    "On Track": 3,
    Below: 0
  },
  fulfillment: {
    Early: 3,
    "On Time": 3,
    Behind: 0
  },
  relationship: {
    Engaged: 3,
    Passive: 2,
    Disengaged: 1
  },
  clientActions: {
    Early: 3,
    "Up to Date": 3,
    Late: 1
  }
} as const;

/**
 * Default health indicator thresholds
 */
const DEFAULT_HEALTH_THRESHOLDS = {
  GREEN: 3,
  YELLOW: 2
} as const;

/**
 * Default highlighting rules
 */
const DEFAULT_HIGHLIGHT_RULES = {
  weeksToEvaluate: 4,
  minRedWeeksForRedHighlight: 2,
  considerImprovementTrend: true,
} as const;

export interface HealthSettings {
  greenThreshold: number;
  yellowThreshold: number;
  fieldScoring: {
    goals: Record<string, number>;
    fulfillment: Record<string, number>;
    relationship: Record<string, number>;
    clientActions: Record<string, number>;
  };
  highlightRules: {
    weeksToEvaluate: number;
    minRedWeeksForRedHighlight: number;
    considerImprovementTrend: boolean;
  };
}

export function getDefaultHealthSettings(): HealthSettings {
  return {
    greenThreshold: DEFAULT_HEALTH_THRESHOLDS.GREEN,
    yellowThreshold: DEFAULT_HEALTH_THRESHOLDS.YELLOW,
    fieldScoring: {
      goals: { ...DEFAULT_FIELD_SCORING.goals },
      fulfillment: { ...DEFAULT_FIELD_SCORING.fulfillment },
      relationship: { ...DEFAULT_FIELD_SCORING.relationship },
      clientActions: { ...DEFAULT_FIELD_SCORING.clientActions },
    },
    highlightRules: { ...DEFAULT_HIGHLIGHT_RULES },
  };
}

/**
 * Health analysis result interface
 */
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
 * Calculate score for a specific field and value
 */
export function calculateFieldScore(field: string, value: string, settings?: HealthSettings): number {
  const scoring = settings?.fieldScoring || DEFAULT_FIELD_SCORING;
  const fieldScoring = scoring[field as keyof typeof scoring];
  if (!fieldScoring) {
    return 0;
  }
  
  return (fieldScoring as Record<string, number>)[value] || 0;
}

/**
 * Calculate total score, average score, and health indicator
 */
export function calculateHealthMetrics(data: {
  goals: string;
  fulfillment: string;
  relationship: string;
  clientActions: string;
}, settings?: HealthSettings): {
  totalScore: number;
  averageScore: number;
  healthIndicator: string;
} {
  const goalsScore = calculateFieldScore('goals', data.goals, settings);
  const fulfillmentScore = calculateFieldScore('fulfillment', data.fulfillment, settings);
  const relationshipScore = calculateFieldScore('relationship', data.relationship, settings);
  const clientActionsScore = calculateFieldScore('clientActions', data.clientActions, settings);
  
  const totalScore = goalsScore + fulfillmentScore + relationshipScore + clientActionsScore;
  const averageScore = parseFloat((totalScore / 4).toFixed(2));
  
  const greenThreshold = settings?.greenThreshold ?? DEFAULT_HEALTH_THRESHOLDS.GREEN;
  const yellowThreshold = settings?.yellowThreshold ?? DEFAULT_HEALTH_THRESHOLDS.YELLOW;

  let healthIndicator: string;
  if (averageScore >= greenThreshold) {
    healthIndicator = 'Green';
  } else if (averageScore >= yellowThreshold) {
    healthIndicator = 'Yellow';
  } else {
    healthIndicator = 'Red';
  }
  
  return {
    totalScore,
    averageScore,
    healthIndicator
  };
}

/**
 * Analyzes the last N weeks of client health scores to determine highlighting
 */
export function analyzeHealthStatus(healthScores: ClientHealthScore[], settings?: HealthSettings): HealthStatusResult {
  const weeksToEvaluate = settings?.highlightRules?.weeksToEvaluate ?? DEFAULT_HIGHLIGHT_RULES.weeksToEvaluate;
  const minRedWeeks = settings?.highlightRules?.minRedWeeksForRedHighlight ?? DEFAULT_HIGHLIGHT_RULES.minRedWeeksForRedHighlight;
  const considerImprovement = settings?.highlightRules?.considerImprovementTrend ?? DEFAULT_HIGHLIGHT_RULES.considerImprovementTrend;

  const sortedScores = [...healthScores].sort((a, b) => 
    new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
  );

  const recentWeeks = sortedScores.slice(0, weeksToEvaluate);
  
  if (recentWeeks.length < weeksToEvaluate) {
    return {
      shouldHighlight: false,
      highlightType: null,
      reason: `Insufficient data (less than ${weeksToEvaluate} weeks)`,
      weeks: recentWeeks.map(score => ({
        weekStart: score.weekStartDate,
        healthIndicator: score.healthIndicator,
        isGreen: score.healthIndicator === 'Green'
      }))
    };
  }

  const hasGreenWeek = recentWeeks.some(score => score.healthIndicator === 'Green');
  
  if (hasGreenWeek) {
    return {
      shouldHighlight: false,
      highlightType: null,
      reason: `Has green week(s) in last ${weeksToEvaluate} weeks`,
      weeks: recentWeeks.map(score => ({
        weekStart: score.weekStartDate,
        healthIndicator: score.healthIndicator,
        isGreen: score.healthIndicator === 'Green'
      }))
    };
  }

  const redWeeks = recentWeeks.filter(score => score.healthIndicator === 'Red');
  const yellowWeeks = recentWeeks.filter(score => score.healthIndicator === 'Yellow');
  
  const isShowingImprovement = considerImprovement ? checkImprovementPattern(recentWeeks) : false;
  
  let highlightType: 'red' | 'yellow' | null = null;
  let reason = '';

  if (redWeeks.length >= minRedWeeks && !isShowingImprovement) {
    highlightType = 'red';
    reason = `${redWeeks.length} red weeks in last ${weeksToEvaluate} weeks, no improvement trend`;
  } else if (yellowWeeks.length >= 2 || isShowingImprovement) {
    highlightType = 'yellow';
    reason = isShowingImprovement 
      ? 'Showing improvement from red to yellow'
      : `${yellowWeeks.length} yellow weeks in last ${weeksToEvaluate} weeks`;
  }

  return {
    shouldHighlight: highlightType !== null,
    highlightType,
    reason,
    weeks: recentWeeks.map(score => ({
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
  if (weeklyScores.length < 2) return false;
  
  const halfPoint = Math.floor(weeklyScores.length / 2);
  const recentHalf = weeklyScores.slice(0, halfPoint);
  const olderHalf = weeklyScores.slice(halfPoint);
  
  const recentRedCount = recentHalf.filter(score => score.healthIndicator === 'Red').length;
  const olderRedCount = olderHalf.filter(score => score.healthIndicator === 'Red').length;
  
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

  return `Health Alert: ${healthStatus.reason}\n\nLast ${healthStatus.weeks.length} weeks:\n${weekSummary}`;
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
