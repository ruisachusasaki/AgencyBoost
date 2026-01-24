import { db } from "./db";
import { taskIntakeSections, taskIntakeQuestions } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

interface AnswerMap {
  [questionId: string]: string | string[] | null;
}

interface Section {
  id: string;
  sectionName: string;
  descriptionTemplate: string | null;
  orderIndex: number;
}

interface Question {
  id: string;
  internalLabel: string | null;
}

function processTemplate(template: string, variables: Record<string, string | string[] | null>): string {
  let result = template;

  // Process {{#each variable_name}}content{{/each}} blocks for arrays
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, varName, content) => {
    const value = variables[varName];
    if (Array.isArray(value) && value.length > 0) {
      return value.map(item => content.replace(/\{\{this\}\}/g, item)).join('');
    }
    return '';
  });

  // Process {{#if variable_name}}content{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    const value = variables[varName];
    const hasValue = value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true);
    return hasValue ? content : '';
  });

  // Process {{variable_name}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    const value = variables[varName];
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  });

  return result;
}

function cleanupOutput(text: string): string {
  // Remove lines that only have labels with no values (e.g., "**Label:** ")
  let result = text.replace(/^\*\*[^*]+:\*\*\s*$/gm, '');
  
  // Remove lines that are just "- " with nothing after
  result = result.replace(/^-\s*$/gm, '');
  
  // Remove lines that are just "1. ", "2. ", etc. with nothing after
  result = result.replace(/^\d+\.\s*$/gm, '');
  
  // Collapse multiple consecutive blank lines into maximum 2
  result = result.replace(/\n{4,}/g, '\n\n\n');
  
  // Remove leading/trailing blank lines from sections
  result = result.replace(/---\n+/g, '---\n');
  
  // Trim each line's trailing whitespace
  result = result.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Trim overall
  return result.trim();
}

export async function generateDescription(
  visibleSectionIds: string[],
  answers: AnswerMap,
  formId: string
): Promise<string> {
  if (!visibleSectionIds || visibleSectionIds.length === 0) {
    return '';
  }

  // Check if this is a personal task - return blank description
  for (const answer of Object.values(answers)) {
    if (answer === 'Personal Task') {
      return '';
    }
  }

  // Get all visible sections with their templates
  const sections = await db
    .select({
      id: taskIntakeSections.id,
      sectionName: taskIntakeSections.sectionName,
      descriptionTemplate: taskIntakeSections.descriptionTemplate,
      orderIndex: taskIntakeSections.orderIndex,
    })
    .from(taskIntakeSections)
    .where(inArray(taskIntakeSections.id, visibleSectionIds));

  // Sort by orderIndex
  sections.sort((a, b) => a.orderIndex - b.orderIndex);

  // Get all questions for this form to build internalLabel -> questionId mapping
  const questions = await db
    .select({
      id: taskIntakeQuestions.id,
      internalLabel: taskIntakeQuestions.internalLabel,
    })
    .from(taskIntakeQuestions)
    .where(eq(taskIntakeQuestions.formId, formId));

  // Build internalLabel -> answer value mapping
  // First, create questionId -> internalLabel map
  const questionIdToLabel: Record<string, string> = {};
  for (const q of questions) {
    if (q.internalLabel) {
      // Strip "TRIGGER - " prefix if present
      const label = q.internalLabel.replace(/^TRIGGER\s*-\s*/i, '');
      questionIdToLabel[q.id] = label;
    }
  }

  // Build variables object: internalLabel -> answer value
  const variables: Record<string, string | string[] | null> = {};
  for (const [questionId, answer] of Object.entries(answers)) {
    const label = questionIdToLabel[questionId];
    if (label) {
      variables[label] = answer;
    }
  }

  // Process each section's template
  const processedSections: string[] = [];
  for (const section of sections) {
    if (!section.descriptionTemplate) {
      continue;
    }

    const processed = processTemplate(section.descriptionTemplate, variables);
    if (processed.trim()) {
      processedSections.push(processed);
    }
  }

  // Concatenate and clean up
  const combined = processedSections.join('\n\n');
  return cleanupOutput(combined);
}

// Priority mapping from intake form to task priority
export function mapPriority(intakePriority: string | null | undefined): string {
  if (!intakePriority) return 'normal';
  
  const priority = intakePriority.toLowerCase();
  switch (priority) {
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'normal';
    case 'low':
      return 'low';
    default:
      return 'normal';
  }
}
