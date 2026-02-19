import { db } from './db';
import { taskIntakeAssignmentRules, staff, taskIntakeOptions } from '@shared/schema';
import { eq, and, asc, inArray, sql } from 'drizzle-orm';

interface RuleCondition {
  questionId: string;
  operator?: string;
  value?: string | string[];
  optionIds?: string[];
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

async function resolveOptionIds(optionIds: string[]): Promise<string[]> {
  if (!optionIds || optionIds.length === 0) return [];

  const resolvedNames: string[] = [];

  for (const optId of optionIds) {
    if (optId.startsWith('dept-')) {
      const deptId = optId.replace('dept-', '');
      try {
        const result = await db.execute(sql`SELECT name FROM departments WHERE id = ${deptId}`);
        const rows = result.rows || result;
        if (Array.isArray(rows) && rows.length > 0) {
          resolvedNames.push(String((rows[0] as any).name).toLowerCase().trim());
        }
      } catch (e) {
        console.log(`[AssignmentRules] Could not resolve dept option ${optId}:`, e);
      }
    } else {
      try {
        const options = await db.select({ optionText: taskIntakeOptions.optionText, optionValue: taskIntakeOptions.optionValue })
          .from(taskIntakeOptions)
          .where(eq(taskIntakeOptions.id, optId))
          .limit(1);
        if (options.length > 0) {
          resolvedNames.push(String(options[0].optionValue || options[0].optionText).toLowerCase().trim());
        }
      } catch (e) {
        console.log(`[AssignmentRules] Could not resolve option ${optId}:`, e);
      }
    }
  }

  return resolvedNames;
}

async function evaluateCondition(condition: RuleCondition, answers: Record<string, any>): Promise<boolean> {
  const answer = answers[condition.questionId];
  if (answer === undefined || answer === null) return false;

  const answerValues: string[] = Array.isArray(answer) 
    ? answer.map((v: any) => String(v).toLowerCase().trim())
    : [String(answer).toLowerCase().trim()];

  let compareValues: string[];

  if (condition.optionIds && condition.optionIds.length > 0) {
    compareValues = await resolveOptionIds(condition.optionIds);
    console.log(`[AssignmentRules] optionIds resolved: ${JSON.stringify(condition.optionIds)} -> ${JSON.stringify(compareValues)}, answer: ${JSON.stringify(answerValues)}`);
    if (compareValues.length === 0) return false;
    return answerValues.some(av => compareValues.includes(av));
  }

  if (condition.value !== undefined) {
    compareValues = Array.isArray(condition.value) 
      ? condition.value.map(v => String(v).toLowerCase().trim())
      : [String(condition.value).toLowerCase().trim()];
  } else {
    return false;
  }

  switch (condition.operator) {
    case 'equals':
      return answerValues.some(av => compareValues.includes(av));
    case 'not_equals':
      return !answerValues.some(av => compareValues.includes(av));
    case 'contains':
      return answerValues.some(av => compareValues.some(cv => av.includes(cv)));
    case 'in':
      return answerValues.some(av => compareValues.includes(av));
    case 'any':
      return answerValues.some(av => compareValues.includes(av));
    default:
      return answerValues.some(av => compareValues.includes(av));
  }
}

async function evaluateConditions(conditions: any, answers: Record<string, any>): Promise<boolean> {
  if (!conditions || (Array.isArray(conditions) && conditions.length === 0)) {
    return true;
  }

  if (Array.isArray(conditions)) {
    for (const condition of conditions) {
      if (!(await evaluateCondition(condition as RuleCondition, answers))) {
        return false;
      }
    }
    return true;
  }

  if (conditions.operator && conditions.conditions) {
    const group = conditions as ConditionGroup;
    if (group.operator === 'OR') {
      for (const c of group.conditions) {
        if (await evaluateCondition(c, answers)) return true;
      }
      return false;
    }
    for (const c of group.conditions) {
      if (!(await evaluateCondition(c, answers))) return false;
    }
    return true;
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
    .orderBy(asc(staff.firstName), asc(staff.lastName))
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

  console.log(`[AssignmentRules] Evaluating ${rules.length} rules for form ${formId}, answer keys: ${Object.keys(answers).join(', ')}`);

  for (const rule of rules) {
    const conditions = rule.conditions as any;
    console.log(`[AssignmentRules] Checking rule "${rule.name}" (priority: ${rule.priority}), conditions:`, JSON.stringify(conditions));
    
    if (await evaluateConditions(conditions, answers)) {
      let assignToUserId: string | null = null;

      if (rule.assignToRole) {
        assignToUserId = await findUserByRole(rule.assignToRole);
      }

      if (!assignToUserId && rule.assignToStaffId) {
        assignToUserId = rule.assignToStaffId;
      }

      console.log(`[AssignmentRules] Rule "${rule.name}" MATCHED -> assignToUserId: ${assignToUserId}`);

      return {
        assignToUserId,
        categoryId: rule.setCategoryId || null,
        tags: (rule.setTags as string[]) || [],
      };
    } else {
      console.log(`[AssignmentRules] Rule "${rule.name}" did NOT match`);
    }
  }

  return {
    assignToUserId: null,
    categoryId: null,
    tags: [],
  };
}

export function generateConditionSummary(conditions: any): string {
  if (!conditions) return 'Match all (catch-all)';

  if (Array.isArray(conditions) && conditions.length === 0) {
    return 'Match all (catch-all)';
  }

  if (Array.isArray(conditions)) {
    return conditions.map((c: any) => {
      if (c.optionIds) {
        return `Q:${c.questionId.substring(0, 8)}... matches optionIds [${c.optionIds.join(', ')}]`;
      }
      return `Q:${c.questionId.substring(0, 8)}... ${c.operator || 'equals'} "${c.value}"`;
    }).join(' AND ');
  }

  if (conditions.operator && conditions.conditions) {
    const group = conditions as ConditionGroup;
    return group.conditions.map((c: any) => {
      if ((c as any).optionIds) {
        return `Q:${c.questionId.substring(0, 8)}... matches optionIds [${(c as any).optionIds.join(', ')}]`;
      }
      return `Q:${c.questionId.substring(0, 8)}... ${c.operator || 'equals'} "${c.value}"`;
    }).join(` ${group.operator} `);
  }

  if (conditions.questionId) {
    const c = conditions as any;
    if (c.optionIds) {
      return `Q:${c.questionId.substring(0, 8)}... matches optionIds [${c.optionIds.join(', ')}]`;
    }
    return `Q:${c.questionId.substring(0, 8)}... ${c.operator || 'equals'} "${c.value}"`;
  }

  return 'Complex conditions';
}
