/**
 * Workflow Execution Engine
 * 
 * This module provides the core automation engine that:
 * 1. Matches triggers to workflows
 * 2. Executes workflow actions in sequence
 * 3. Handles conditions, delays, and error recovery
 * 4. Tracks execution state and logs
 */

import { db } from "./db";
import { workflows, workflowExecutions, clients, enhancedTasks, staff, automationTriggers } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { slackService } from "./slack-service";

// ===== TYPE DEFINITIONS =====

export interface TriggerEvent {
  type: string; // e.g., "client_created", "client_updated", "task_completed"
  data: Record<string, any>; // The actual event data (client object, task object, etc.)
  context: {
    userId?: string; // Who triggered the event
    timestamp: Date;
    metadata?: Record<string, any>;
  };
}

export interface WorkflowAction {
  id: string;
  type: string; // e.g., "send_email", "create_task", "update_contact"
  config: Record<string, any>; // Action-specific configuration
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: string; // "equals", "contains", "greater_than", etc.
  value: any;
  logicOperator?: "AND" | "OR";
}

export interface WorkflowTrigger {
  id: string;
  type: string;
  config: Record<string, any>;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggerData: Record<string, any>;
  contactId?: string;
  currentStep: number;
  variables: Record<string, any>; // Shared state across actions
}

// ===== CORE ENGINE FUNCTIONS =====

/**
 * Main entry point: Fire a trigger event and execute matching workflows
 */
export async function emitTrigger(event: TriggerEvent): Promise<void> {
  try {
    console.log(`🔔 Trigger fired: ${event.type}`, { data: event.data });

    // Find all active workflows that listen to this trigger
    const matchingWorkflows = await findMatchingWorkflows(event.type);

    if (matchingWorkflows.length === 0) {
      console.log(`ℹ️  No workflows listening to trigger: ${event.type}`);
      return;
    }

    console.log(`📋 Found ${matchingWorkflows.length} workflow(s) for trigger: ${event.type}`);

    // Execute each matching workflow
    for (const workflow of matchingWorkflows) {
      // Check if trigger conditions match
      if (await evaluateTriggerConditions(workflow, event)) {
        // Queue workflow execution (async, non-blocking)
        executeWorkflow(workflow.id, event).catch(error => {
          console.error(`❌ Workflow execution failed: ${workflow.id}`, error);
        });
      } else {
        console.log(`⏭️  Skipping workflow ${workflow.name} - trigger conditions not met`);
      }
    }
  } catch (error) {
    console.error("❌ Error in emitTrigger:", error);
    // Don't throw - we don't want trigger failures to break the main application flow
  }
}

/**
 * Find all active workflows that listen to a specific trigger type
 */
async function findMatchingWorkflows(triggerType: string) {
  const activeWorkflows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.status, "active"));

  // Filter workflows that have this trigger configured
  return activeWorkflows.filter(workflow => {
    const triggers = (workflow.triggers as any[]) || [];
    return triggers.some((t: any) => t.type === triggerType);
  });
}

/**
 * Evaluate trigger conditions to see if workflow should run
 */
async function evaluateTriggerConditions(
  workflow: any,
  event: TriggerEvent
): Promise<boolean> {
  const triggers = (workflow.triggers as any[]) || [];
  const matchingTrigger = triggers.find((t: any) => t.type === event.type);

  if (!matchingTrigger || !matchingTrigger.config) {
    return true; // No conditions = always match
  }

  // Check each condition in the trigger config
  const config = matchingTrigger.config;
  
  for (const [key, expectedValue] of Object.entries(config)) {
    // Skip metadata fields
    if (key === 'trigger_id' || key === 'trigger_name') continue;
    
    // If condition is set and doesn't match, return false
    if (expectedValue !== undefined && expectedValue !== null && expectedValue !== '') {
      const actualValue = getNestedValue(event.data, key);
      
      // Handle array-to-array comparison (e.g., changedFields filter)
      if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
        // Check if there's ANY overlap between the arrays
        const hasOverlap = expectedValue.some((expected: any) => actualValue.includes(expected));
        if (!hasOverlap) {
          console.log(`❌ Condition not met: ${key} has [${actualValue}], expected at least one of [${expectedValue}]`);
          return false;
        }
      }
      // Handle array-to-scalar comparison (e.g., status filter where config is array of statuses)
      else if (Array.isArray(expectedValue) && !Array.isArray(actualValue)) {
        if (!expectedValue.includes(actualValue)) {
          console.log(`❌ Condition not met: ${key} = ${actualValue}, expected one of [${expectedValue}]`);
          return false;
        }
      }
      // Handle exact match
      else if (actualValue !== expectedValue) {
        console.log(`❌ Condition not met: ${key} = ${actualValue}, expected ${expectedValue}`);
        return false;
      }
    }
  }

  return true; // All conditions passed
}

/**
 * Execute a complete workflow from start to finish
 */
export async function executeWorkflow(
  workflowId: string,
  event: TriggerEvent
): Promise<void> {
  let executionId: string | null = null;

  try {
    // Get workflow details
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== "active") {
      console.log(`⏭️  Workflow ${workflow.name} is ${workflow.status}, skipping execution`);
      return;
    }

    const actions = (workflow.actions as any[]) || [];
    
    if (actions.length === 0) {
      console.log(`⚠️  Workflow ${workflow.name} has no actions configured`);
      return;
    }

    console.log(`▶️  Executing workflow: ${workflow.name} (${actions.length} actions)`);

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId: workflow.id,
        contactId: event.data.id || event.data.clientId || null,
        triggerData: event.data,
        status: "running",
        currentStep: 0,
        totalSteps: actions.length,
        executionLog: [],
        startedAt: new Date(),
      })
      .returning();

    executionId = execution.id;

    // Build execution context
    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId: execution.id,
      triggerData: event.data,
      contactId: event.data.id || event.data.clientId,
      currentStep: 0,
      variables: {
        trigger: event.data, // Make trigger data available to actions
      },
    };

    // Execute each action sequentially
    const executionLog: any[] = [];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      context.currentStep = i;

      console.log(`  📌 Step ${i + 1}/${actions.length}: ${action.type}`);

      try {
        // Update current step
        await db
          .update(workflowExecutions)
          .set({ currentStep: i })
          .where(eq(workflowExecutions.id, executionId));

        // Execute action
        const result = await executeAction(action, context);

        // Log success
        executionLog.push({
          step: i + 1,
          action: action.type,
          status: "success",
          result,
          timestamp: new Date().toISOString(),
        });

        console.log(`  ✅ Step ${i + 1} completed successfully`);
      } catch (actionError: any) {
        // Log failure
        executionLog.push({
          step: i + 1,
          action: action.type,
          status: "failed",
          error: actionError.message,
          timestamp: new Date().toISOString(),
        });

        console.error(`  ❌ Step ${i + 1} failed:`, actionError.message);

        // Fail the entire workflow
        await db
          .update(workflowExecutions)
          .set({
            status: "failed",
            errorMessage: `Action ${i + 1} (${action.type}) failed: ${actionError.message}`,
            executionLog,
            completedAt: new Date(),
          })
          .where(eq(workflowExecutions.id, executionId));

        // Update workflow stats
        await db
          .update(workflows)
          .set({
            lastRun: new Date(),
            totalRuns: sql`${workflows.totalRuns} + 1`,
            failedRuns: sql`${workflows.failedRuns} + 1`,
          })
          .where(eq(workflows.id, workflowId));

        throw actionError; // Stop execution
      }
    }

    // Mark workflow as completed
    await db
      .update(workflowExecutions)
      .set({
        status: "completed",
        executionLog,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));

    // Update workflow stats
    await db
      .update(workflows)
      .set({
        lastRun: new Date(),
        totalRuns: sql`${workflows.totalRuns} + 1`,
        successfulRuns: sql`${workflows.successfulRuns} + 1`,
      })
      .where(eq(workflows.id, workflowId));

    console.log(`✅ Workflow completed successfully: ${workflow.name}`);
  } catch (error: any) {
    console.error(`❌ Workflow execution error:`, error);
    
    // If we have an execution ID, mark it as failed
    if (executionId) {
      await db
        .update(workflowExecutions)
        .set({
          status: "failed",
          errorMessage: error.message,
          completedAt: new Date(),
        })
        .where(eq(workflowExecutions.id, executionId));
    }
  }
}

/**
 * Execute a single workflow action
 */
async function executeAction(
  action: WorkflowAction,
  context: ExecutionContext
): Promise<any> {
  // Check action conditions
  if (action.conditions && action.conditions.length > 0) {
    const conditionsMet = evaluateConditions(action.conditions, context);
    if (!conditionsMet) {
      console.log(`  ⏭️  Skipping action - conditions not met`);
      return { skipped: true, reason: "Conditions not met" };
    }
  }

  // Execute based on action type
  switch (action.type) {
    case "create_task":
      return await executeCreateTask(action, context);
    
    case "update_contact":
      return await executeUpdateContact(action, context);
    
    case "send_email":
      return await executeSendEmail(action, context);
    
    case "send_notification":
      return await executeSendNotification(action, context);
    
    case "wait":
      return await executeWait(action, context);
    
    case "add_tag":
      return await executeAddTag(action, context);
    
    case "assign_staff":
      return await executeAssignStaff(action, context);
    
    // Slack actions
    case "send_slack_message":
      return await executeSendSlackMessage(action, context);
    
    case "send_slack_dm":
      return await executeSendSlackDM(action, context);
    
    case "add_slack_reaction":
      return await executeAddSlackReaction(action, context);
    
    case "create_slack_channel":
      return await executeCreateSlackChannel(action, context);
    
    case "set_slack_topic":
      return await executeSetSlackTopic(action, context);
    
    case "create_slack_reminder":
      return await executeCreateSlackReminder(action, context);
    
    default:
      console.warn(`⚠️  Unknown action type: ${action.type}`);
      return { skipped: true, reason: `Unknown action type: ${action.type}` };
  }
}

// ===== ACTION EXECUTORS =====

async function executeCreateTask(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  
  const taskData: any = {
    title: interpolateString(config.title, context),
    description: config.description ? interpolateString(config.description, context) : null,
    priority: config.priority || "medium",
    status: "pending",
    assignedTo: config.assignedTo || null,
    dueDate: config.dueDate ? new Date(config.dueDate) : null,
    projectId: context.triggerData.projectId || null,
    clientId: context.contactId || null,
    automationData: {
      createdBy: "workflow",
      workflowId: context.workflowId,
      executionId: context.executionId,
    },
  };

  const [newTask] = await db
    .insert(enhancedTasks)
    .values(taskData)
    .returning();

  console.log(`    ✅ Created task: ${newTask.title} (${newTask.id})`);
  return { taskId: newTask.id, title: newTask.title };
}

async function executeUpdateContact(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  const clientId = context.contactId;

  if (!clientId) {
    throw new Error("No client ID available for update_contact action");
  }

  const updateData: any = {};
  
  // Map configured fields to update
  if (config.status) updateData.status = config.status;
  if (config.tags) updateData.tags = config.tags;
  if (config.assignedTo) updateData.assignedTo = config.assignedTo;

  if (Object.keys(updateData).length === 0) {
    console.log(`    ℹ️  No fields to update`);
    return { updated: false };
  }

  await db
    .update(clients)
    .set(updateData)
    .where(eq(clients.id, clientId));

  console.log(`    ✅ Updated client: ${clientId}`, updateData);
  return { updated: true, clientId, fields: Object.keys(updateData) };
}

async function executeSendEmail(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  
  // NOTE: Email sending would integrate with your email service here
  // For now, we'll log and create a placeholder implementation
  
  const emailData = {
    to: config.to || context.triggerData.email,
    subject: interpolateString(config.subject, context),
    body: interpolateString(config.body, context),
    from: config.from || "noreply@agencyflow.com",
  };

  console.log(`    📧 Email queued:`, emailData);
  
  // TODO: Integrate with actual email service (e.g., Mailgun, SendGrid)
  // await sendEmailViaService(emailData);

  return { sent: true, to: emailData.to, subject: emailData.subject };
}

async function executeSendNotification(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  
  // Create in-app notification
  // NOTE: This would use your notifications table
  
  console.log(`    🔔 Notification sent:`, {
    userId: config.userId,
    title: config.title,
    message: config.message,
  });

  return { sent: true, userId: config.userId };
}

async function executeWait(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  const delayMs = (config.delay || 0) * 1000; // Convert seconds to ms

  if (delayMs > 0) {
    console.log(`    ⏳ Waiting ${config.delay} seconds...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return { waited: config.delay };
}

async function executeAddTag(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  const clientId = context.contactId;

  if (!clientId) {
    throw new Error("No client ID available for add_tag action");
  }

  // Get current client
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const currentTags = (client.tags || []) as string[];
  const newTag = config.tag;

  if (!currentTags.includes(newTag)) {
    const updatedTags = [...currentTags, newTag];
    
    await db
      .update(clients)
      .set({ tags: updatedTags })
      .where(eq(clients.id, clientId));

    console.log(`    🏷️  Added tag "${newTag}" to client ${clientId}`);
    return { added: true, tag: newTag };
  }

  console.log(`    ℹ️  Tag "${newTag}" already exists on client`);
  return { added: false, reason: "Tag already exists" };
}

async function executeAssignStaff(action: WorkflowAction, context: ExecutionContext) {
  const config = action.config;
  const clientId = context.contactId;

  if (!clientId) {
    throw new Error("No client ID available for assign_staff action");
  }

  await db
    .update(clients)
    .set({ assignedTo: config.staffId })
    .where(eq(clients.id, clientId));

  console.log(`    👤 Assigned staff ${config.staffId} to client ${clientId}`);
  return { assigned: true, staffId: config.staffId, clientId };
}

// ===== SLACK ACTION EXECUTORS =====

async function executeSendSlackMessage(action: WorkflowAction, context: ExecutionContext) {
  // Support both 'config' and 'settings' for backwards compatibility
  const config = action.config || (action as any).settings || {};

  const workspaceId = config.workspaceId || undefined;

  if (!slackService.isConfigured() && !workspaceId) {
    console.warn('    ⚠️  Slack not configured - skipping message');
    return { skipped: true, reason: 'Slack not configured' };
  }

  const message = interpolateString(config.message || config.text || '', context);
  const channel = config.channel || config.channelId || undefined;

  console.log(`    🔍 Slack action config:`, JSON.stringify(config, null, 2));
  console.log(`    📢 Sending to channel: ${channel}, message: ${message}, workspace: ${workspaceId || "default"}`);

  if (!message) {
    throw new Error('No message text provided for send_slack_message action');
  }

  const result = await slackService.sendMessage({
    channel,
    text: message, workspaceId,
  });

  if (result.success) {
    console.log(`    💬 Sent Slack message to ${result.channel}`);
    return { sent: true, channel: result.channel, ts: result.ts };
  } else {
    throw new Error(`Failed to send Slack message: ${result.error}`);
  }
}

async function executeSendSlackDM(action: WorkflowAction, context: ExecutionContext) {
  // Support both 'config' and 'settings' for backwards compatibility
  const config = action.config || (action as any).settings || {};

  const workspaceId = config.workspaceId || undefined;

  if (!slackService.isConfigured() && !workspaceId) {
    console.warn('    ⚠️  Slack not configured - skipping DM');
    return { skipped: true, reason: 'Slack not configured' };
  }

  let userId = config.userId ? interpolateString(config.userId, context) : null;
  const email = config.email ? interpolateString(config.email, context) : null;

  if (!userId && email) {
    console.log(`    🔍 Looking up Slack user by email: ${email}`);
    const lookupResult = await slackService.lookupUserByEmail(email);
    if (lookupResult.success && lookupResult.userId) {
      userId = lookupResult.userId;
      console.log(`    ✓ Found user: ${userId}`);
    } else {
      throw new Error(`Could not find Slack user by email "${email}": ${lookupResult.error || 'User not found'}`);
    }
  }

  if (!userId) {
    throw new Error('No userId or email provided for send_slack_dm action. Configure either userId or email in the action settings.');
  }

  const message = interpolateString(config.message || config.text || '', context);

  const result = await slackService.sendDirectMessage({
    userId,
    text: message, workspaceId,
  });

  if (result.success) {
    console.log(`    📨 Sent Slack DM to user ${userId}`);
    return { sent: true, userId, channel: result.channel, ts: result.ts };
  } else {
    throw new Error(`Failed to send Slack DM: ${result.error}`);
  }
}

async function executeAddSlackReaction(action: WorkflowAction, context: ExecutionContext) {
  // Support both 'config' and 'settings' for backwards compatibility
  const config = action.config || (action as any).settings || {};

  const workspaceId = config.workspaceId || undefined;

  if (!slackService.isConfigured() && !workspaceId) {
    console.warn('    ⚠️  Slack not configured - skipping reaction');
    return { skipped: true, reason: 'Slack not configured' };
  }

  const channel = config.channel || config.channelId;
  const timestamp = config.timestamp || config.ts;
  const emoji = config.emoji || config.reaction;

  if (!channel || !timestamp || !emoji) {
    throw new Error('Channel, timestamp, and emoji are required for add_slack_reaction action');
  }

  const result = await slackService.addReaction({
    channel,
    timestamp,
    emoji,
  });

  if (result.success) {
    console.log(`    👍 Added reaction ${config.emoji} to message`);
    return { added: true, emoji: config.emoji };
  } else {
    throw new Error(`Failed to add Slack reaction: ${result.error}`);
  }
}

async function executeCreateSlackChannel(action: WorkflowAction, context: ExecutionContext) {
  // Support both 'config' and 'settings' for backwards compatibility
  const config = action.config || (action as any).settings || {};

  const workspaceId = config.workspaceId || undefined;

  if (!slackService.isConfigured() && !workspaceId) {
    console.warn('    ⚠️  Slack not configured - skipping channel creation');
    return { skipped: true, reason: 'Slack not configured' };
  }

  const channelName = interpolateString(config.name || config.channelName || '', context);
  const description = config.description ? interpolateString(config.description, context) : undefined;

  const result = await slackService.createChannel({
    name: channelName,
    isPrivate: config.isPrivate || false,
    description,
  });

  if (result.success) {
    console.log(`    📢 Created Slack channel: ${channelName} (${result.channelId})`);

    let inviteResult = null;
    if (config.inviteUsers && Array.isArray(config.inviteUsers) && config.inviteUsers.length > 0) {
      try {
        inviteResult = await slackService.inviteToChannel(result.channelId!, config.inviteUsers);
        if (inviteResult.success) {
          console.log(`    👥 Invited ${config.inviteUsers.length} users to channel`);
        } else {
          console.warn(`    ⚠️  Failed to invite users: ${inviteResult.error}`);
        }
      } catch (inviteError: any) {
        console.warn(`    ⚠️  Failed to invite users: ${inviteError.message}`);
      }
    }

    context.variables.slackChannelId = result.channelId;
    return { created: true, channelId: result.channelId, name: channelName, inviteResult };
  } else {
    throw new Error(`Failed to create Slack channel: ${result.error}`);
  }
}

async function executeSetSlackTopic(action: WorkflowAction, context: ExecutionContext) {
  // Support both 'config' and 'settings' for backwards compatibility
  const config = action.config || (action as any).settings || {};

  const workspaceId = config.workspaceId || undefined;

  if (!slackService.isConfigured() && !workspaceId) {
    console.warn('    ⚠️  Slack not configured - skipping topic update');
    return { skipped: true, reason: 'Slack not configured' };
  }

  const channel = config.channel || config.channelId;
  if (!channel) {
    throw new Error('Channel is required for set_slack_topic action');
  }

  const topic = interpolateString(config.topic || '', context);

  const result = await slackService.setChannelTopic(channel, topic);

  if (result.success) {
    console.log(`    📝 Set topic for channel ${channel}`);
    return { updated: true, channel, topic };
  } else {
    throw new Error(`Failed to set Slack topic: ${result.error}`);
  }
}

async function executeCreateSlackReminder(action: WorkflowAction, context: ExecutionContext) {
  // Support both 'config' and 'settings' for backwards compatibility
  const config = action.config || (action as any).settings || {};

  const workspaceId = config.workspaceId || undefined;

  if (!slackService.isConfigured() && !workspaceId) {
    console.warn('    ⚠️  Slack not configured - skipping reminder');
    return { skipped: true, reason: 'Slack not configured' };
  }

  const textValue = config.text || config.message || '';
  const timeValue = config.time || config.reminderTime || '';

  if (!textValue || !timeValue) {
    throw new Error('Text and time are required for create_slack_reminder action');
  }

  const text = interpolateString(textValue, context);

  const result = await slackService.createReminder({
    text,
    time: timeValue,
    user: config.user,
  });

  if (result.success) {
    console.log(`    ⏰ Created Slack reminder`);
    return { created: true, reminderId: result.reminderId };
  } else {
    throw new Error(`Failed to create Slack reminder: ${result.error}`);
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Evaluate workflow conditions
 */
function evaluateConditions(
  conditions: WorkflowCondition[],
  context: ExecutionContext
): boolean {
  // For now, we'll use AND logic (all conditions must pass)
  // TODO: Support OR logic via logicOperator
  
  for (const condition of conditions) {
    const actualValue = getNestedValue(context.triggerData, condition.field);
    const passed = evaluateSingleCondition(actualValue, condition.operator, condition.value);
    
    if (!passed) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a single condition
 */
function evaluateSingleCondition(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case "equals":
    case "is":
      return actual === expected;
    
    case "not_equals":
    case "is_not":
      return actual !== expected;
    
    case "contains":
      return String(actual).includes(String(expected));
    
    case "not_contains":
      return !String(actual).includes(String(expected));
    
    case "greater_than":
      return Number(actual) > Number(expected);
    
    case "less_than":
      return Number(actual) < Number(expected);
    
    case "starts_with":
      return String(actual).startsWith(String(expected));
    
    case "ends_with":
      return String(actual).endsWith(String(expected));
    
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Interpolate variables in strings (e.g., "Hello {{trigger.name}}")
 */
function interpolateString(template: string, context: ExecutionContext): string {
  if (!template) return "";

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context.variables, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Get nested value from object using dot notation (e.g., "user.email")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
