import { db } from './db';
import { taskIntakeAssignmentRules, staff } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';

interface RuleCondition {
  questionId: string;
  operator: string;
  value: string | string[];
}

interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: RuleCondition[];
}

interface AssignmentResult {
  assignToUserId: string | null;
  categoryId: string | null;
  tags: string[];
}

function evaluateCondition(condition: RuleCondition, answers: Record<string, any>): boolean {
  const answer = answers[condition.questionId];
  if (answer === undefined || answer === null) return false;

  const answerStr = String(answer).toLowerCase().trim();
  const compareValue = Array.isArray(condition.value) 
    ? condition.value.map(v => String(v).toLowerCase().trim())
    : String(condition.value).toLowerCase().trim();

  switch (condition.operator) {
    case 'equals':
      return Array.isArray(compareValue) 
        ? compareValue.includes(answerStr)
        : answerStr === compareValue;
    case 'not_equals':
      return Array.isArray(compareValue)
        ? !compareValue.includes(answerStr)
        : answerStr !== compareValue;
    case 'contains':
      return Array.isArray(compareValue)
        ? compareValue.some(v => answerStr.includes(v))
        : answerStr.includes(compareValue);
    case 'in':
      if (Array.isArray(compareValue)) {
        return compareValue.includes(answerStr);
      }
      return answerStr === compareValue;
    default:
      return answerStr === compareValue;
  }
}

function evaluateConditions(conditions: any, answers: Record<string, any>): boolean {
  if (!conditions || (Array.isArray(conditions) && conditions.length === 0)) {
    return false;
  }

  if (Array.isArray(conditions)) {
    return conditions.every((condition: RuleCondition) => evaluateCondition(condition, answers));
  }

  if (conditions.operator && conditions.conditions) {
    const group = conditions as ConditionGroup;
    if (group.operator === 'OR') {
      return group.conditions.some(c => evaluateCondition(c, answers));
    }
    return group.conditions.every(c => evaluateCondition(c, answers));
  }

  if (conditions.questionId) {
    return evaluateCondition(conditions as RuleCondition, answers);
  }

  return false;
}

async function findUserByRole(role: string): Promise<string | null> {
  if (!role) return null;

  const [foundStaff] = await db.select({ id: staff.id })
    .from(staff)
    .where(eq(staff.position, role))
    .limit(1);

  return foundStaff?.id || null;
}

export async function evaluateAssignmentRules(
  formId: string, 
  answers: Record<string, any>
): Promise<AssignmentResult> {
  const rules = await db.select()
    .from(taskIntakeAssignmentRules)
    .where(and(
      eq(taskIntakeAssignmentRules.formId, formId),
      eq(taskIntakeAssignmentRules.enabled, true)
    ))
    .orderBy(asc(taskIntakeAssignmentRules.priority));

  for (const rule of rules) {
    const conditions = rule.conditions as any;
    
    if (evaluateConditions(conditions, answers)) {
      let assignToUserId: string | null = null;

      if (rule.assignToRole) {
        assignToUserId = await findUserByRole(rule.assignToRole);
      }

      if (!assignToUserId && rule.assignToStaffId) {
        assignToUserId = rule.assignToStaffId;
      }

      return {
        assignToUserId,
        categoryId: rule.setCategoryId || null,
        tags: (rule.setTags as string[]) || [],
      };
    }
  }

  return {
    assignToUserId: null,
    categoryId: null,
    tags: [],
  };
}

export function generateConditionSummary(conditions: any): string {
  if (!conditions) return 'No conditions';

  if (Array.isArray(conditions) && conditions.length === 0) {
    return 'No conditions';
  }

  if (Array.isArray(conditions)) {
    return conditions.map((c: RuleCondition) => 
      `Q:${c.questionId.substring(0, 8)}... ${c.operator} "${c.value}"`
    ).join(' AND ');
  }

  if (conditions.operator && conditions.conditions) {
    const group = conditions as ConditionGroup;
    return group.conditions.map((c: RuleCondition) => 
      `Q:${c.questionId.substring(0, 8)}... ${c.operator} "${c.value}"`
    ).join(` ${group.operator} `);
  }

  if (conditions.questionId) {
    const c = conditions as RuleCondition;
    return `Q:${c.questionId.substring(0, 8)}... ${c.operator} "${c.value}"`;
  }

  return 'Complex conditions';
}
