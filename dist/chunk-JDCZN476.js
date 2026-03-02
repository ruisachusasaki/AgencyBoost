import {
  getNotificationService
} from "./chunk-RKCHQFS5.js";
import {
  slackService
} from "./chunk-642RPZLH.js";
import {
  db
} from "./chunk-ZB5IQ3XV.js";
import {
  clients,
  enhancedTasks,
  notifications,
  workflowExecutions,
  workflows
} from "./chunk-AOJ6JAV4.js";

// server/workflow-engine.ts
import { eq, sql } from "drizzle-orm";
async function emitTrigger(event) {
  try {
    console.log(`\u{1F514} Trigger fired: ${event.type}`, { data: event.data });
    const matchingWorkflows = await findMatchingWorkflows(event.type);
    if (matchingWorkflows.length === 0) {
      console.log(`\u2139\uFE0F  No workflows listening to trigger: ${event.type}`);
      return;
    }
    console.log(`\u{1F4CB} Found ${matchingWorkflows.length} workflow(s) for trigger: ${event.type}`);
    for (const workflow of matchingWorkflows) {
      if (await evaluateTriggerConditions(workflow, event)) {
        executeWorkflow(workflow.id, event).catch((error) => {
          console.error(`\u274C Workflow execution failed: ${workflow.id}`, error);
        });
      } else {
        console.log(`\u23ED\uFE0F  Skipping workflow ${workflow.name} - trigger conditions not met`);
      }
    }
  } catch (error) {
    console.error("\u274C Error in emitTrigger:", error);
  }
}
async function findMatchingWorkflows(triggerType) {
  const activeWorkflows = await db.select().from(workflows).where(eq(workflows.status, "active"));
  return activeWorkflows.filter((workflow) => {
    const triggers = workflow.triggers || [];
    return triggers.some((t) => t.type === triggerType);
  });
}
async function evaluateTriggerConditions(workflow, event) {
  const triggers = workflow.triggers || [];
  const matchingTrigger = triggers.find((t) => t.type === event.type);
  if (!matchingTrigger || !matchingTrigger.config) {
    return true;
  }
  const config = matchingTrigger.config;
  if (event.type === "weekly_hours_below_threshold") {
    const threshold = parseFloat(config.hours_threshold) || 40;
    const includeCalendarTime = config.include_calendar_time !== false;
    const staffFilter = config.staff_filter || "my_direct_reports";
    const subordinates = event.data.subordinatesBelowThreshold || [];
    const qualifying = subordinates.filter((sub) => {
      const hours = includeCalendarTime ? sub.totalHoursLogged : sub.taskHoursLogged;
      return hours < threshold;
    });
    if (qualifying.length === 0) {
      return false;
    }
    if (staffFilter === "my_direct_reports") {
      const workflowCreatorId = workflow.createdBy;
      if (workflowCreatorId && event.data.managerId !== workflowCreatorId) {
        return false;
      }
    } else if (staffFilter === "specific_department") {
      const targetDepartment = config.department;
      if (targetDepartment) {
        const deptMatches = qualifying.filter((sub) => sub.staffDepartment === targetDepartment);
        if (deptMatches.length === 0) {
          return false;
        }
        event.data._filteredSubordinates = deptMatches;
        event.data._hoursThreshold = threshold;
        return true;
      }
    }
    event.data._filteredSubordinates = qualifying;
    event.data._hoursThreshold = threshold;
    return true;
  }
  for (const [key, expectedValue] of Object.entries(config)) {
    if (key === "trigger_id" || key === "trigger_name") continue;
    if (expectedValue !== void 0 && expectedValue !== null && expectedValue !== "") {
      const actualValue = getNestedValue(event.data, key);
      if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
        const hasOverlap = expectedValue.some((expected) => actualValue.includes(expected));
        if (!hasOverlap) {
          console.log(`\u274C Condition not met: ${key} has [${actualValue}], expected at least one of [${expectedValue}]`);
          return false;
        }
      } else if (Array.isArray(expectedValue) && !Array.isArray(actualValue)) {
        if (!expectedValue.includes(actualValue)) {
          console.log(`\u274C Condition not met: ${key} = ${actualValue}, expected one of [${expectedValue}]`);
          return false;
        }
      } else if (actualValue !== expectedValue) {
        console.log(`\u274C Condition not met: ${key} = ${actualValue}, expected ${expectedValue}`);
        return false;
      }
    }
  }
  return true;
}
async function executeWorkflow(workflowId, event) {
  let executionId = null;
  try {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    if (workflow.status !== "active") {
      console.log(`\u23ED\uFE0F  Workflow ${workflow.name} is ${workflow.status}, skipping execution`);
      return;
    }
    const actions = workflow.actions || [];
    if (actions.length === 0) {
      console.log(`\u26A0\uFE0F  Workflow ${workflow.name} has no actions configured`);
      return;
    }
    console.log(`\u25B6\uFE0F  Executing workflow: ${workflow.name} (${actions.length} actions)`);
    const [execution] = await db.insert(workflowExecutions).values({
      workflowId: workflow.id,
      contactId: event.data.id || event.data.clientId || null,
      triggerData: event.data,
      status: "running",
      currentStep: 0,
      totalSteps: actions.length,
      executionLog: [],
      startedAt: /* @__PURE__ */ new Date()
    }).returning();
    executionId = execution.id;
    const context = {
      workflowId: workflow.id,
      executionId: execution.id,
      triggerData: event.data,
      contactId: event.data.id || event.data.clientId,
      currentStep: 0,
      variables: {
        trigger: event.data
        // Make trigger data available to actions
      }
    };
    const executionLog = [];
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      context.currentStep = i;
      console.log(`  \u{1F4CC} Step ${i + 1}/${actions.length}: ${action.type}`);
      try {
        await db.update(workflowExecutions).set({ currentStep: i }).where(eq(workflowExecutions.id, executionId));
        const result = await executeAction(action, context);
        executionLog.push({
          step: i + 1,
          action: action.type,
          status: "success",
          result,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        console.log(`  \u2705 Step ${i + 1} completed successfully`);
      } catch (actionError) {
        executionLog.push({
          step: i + 1,
          action: action.type,
          status: "failed",
          error: actionError.message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        console.error(`  \u274C Step ${i + 1} failed:`, actionError.message);
        await db.update(workflowExecutions).set({
          status: "failed",
          errorMessage: `Action ${i + 1} (${action.type}) failed: ${actionError.message}`,
          executionLog,
          completedAt: /* @__PURE__ */ new Date()
        }).where(eq(workflowExecutions.id, executionId));
        await db.update(workflows).set({
          lastRun: /* @__PURE__ */ new Date(),
          totalRuns: sql`${workflows.totalRuns} + 1`,
          failedRuns: sql`${workflows.failedRuns} + 1`
        }).where(eq(workflows.id, workflowId));
        throw actionError;
      }
    }
    await db.update(workflowExecutions).set({
      status: "completed",
      executionLog,
      completedAt: /* @__PURE__ */ new Date()
    }).where(eq(workflowExecutions.id, executionId));
    await db.update(workflows).set({
      lastRun: /* @__PURE__ */ new Date(),
      totalRuns: sql`${workflows.totalRuns} + 1`,
      successfulRuns: sql`${workflows.successfulRuns} + 1`
    }).where(eq(workflows.id, workflowId));
    console.log(`\u2705 Workflow completed successfully: ${workflow.name}`);
  } catch (error) {
    console.error(`\u274C Workflow execution error:`, error);
    if (executionId) {
      await db.update(workflowExecutions).set({
        status: "failed",
        errorMessage: error.message,
        completedAt: /* @__PURE__ */ new Date()
      }).where(eq(workflowExecutions.id, executionId));
    }
  }
}
async function executeAction(action, context) {
  if (action.conditions && action.conditions.length > 0) {
    const conditionsMet = evaluateConditions(action.conditions, context);
    if (!conditionsMet) {
      console.log(`  \u23ED\uFE0F  Skipping action - conditions not met`);
      return { skipped: true, reason: "Conditions not met" };
    }
  }
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
    case "notify_manager_hours_report":
      return await executeNotifyManagerHoursReport(action, context);
    default:
      console.warn(`\u26A0\uFE0F  Unknown action type: ${action.type}`);
      return { skipped: true, reason: `Unknown action type: ${action.type}` };
  }
}
async function executeCreateTask(action, context) {
  const config = action.config;
  const taskData = {
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
      executionId: context.executionId
    }
  };
  const [newTask] = await db.insert(enhancedTasks).values(taskData).returning();
  console.log(`    \u2705 Created task: ${newTask.title} (${newTask.id})`);
  return { taskId: newTask.id, title: newTask.title };
}
async function executeUpdateContact(action, context) {
  const config = action.config;
  const clientId = context.contactId;
  if (!clientId) {
    throw new Error("No client ID available for update_contact action");
  }
  const updateData = {};
  if (config.status) updateData.status = config.status;
  if (config.tags) updateData.tags = config.tags;
  if (config.assignedTo) updateData.assignedTo = config.assignedTo;
  if (Object.keys(updateData).length === 0) {
    console.log(`    \u2139\uFE0F  No fields to update`);
    return { updated: false };
  }
  await db.update(clients).set(updateData).where(eq(clients.id, clientId));
  console.log(`    \u2705 Updated client: ${clientId}`, updateData);
  return { updated: true, clientId, fields: Object.keys(updateData) };
}
async function executeSendEmail(action, context) {
  const config = action.config;
  const emailData = {
    to: config.to || context.triggerData.email,
    subject: interpolateString(config.subject, context),
    body: interpolateString(config.body, context),
    from: config.from || "noreply@agencyflow.com"
  };
  console.log(`    \u{1F4E7} Email queued:`, emailData);
  return { sent: true, to: emailData.to, subject: emailData.subject };
}
async function executeSendNotification(action, context) {
  const config = action.config;
  console.log(`    \u{1F514} Notification sent:`, {
    userId: config.userId,
    title: config.title,
    message: config.message
  });
  return { sent: true, userId: config.userId };
}
async function executeWait(action, context) {
  const config = action.config;
  const delayMs = (config.delay || 0) * 1e3;
  if (delayMs > 0) {
    console.log(`    \u23F3 Waiting ${config.delay} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return { waited: config.delay };
}
async function executeAddTag(action, context) {
  const config = action.config;
  const clientId = context.contactId;
  if (!clientId) {
    throw new Error("No client ID available for add_tag action");
  }
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }
  const currentTags = client.tags || [];
  const newTag = config.tag;
  if (!currentTags.includes(newTag)) {
    const updatedTags = [...currentTags, newTag];
    await db.update(clients).set({ tags: updatedTags }).where(eq(clients.id, clientId));
    console.log(`    \u{1F3F7}\uFE0F  Added tag "${newTag}" to client ${clientId}`);
    return { added: true, tag: newTag };
  }
  console.log(`    \u2139\uFE0F  Tag "${newTag}" already exists on client`);
  return { added: false, reason: "Tag already exists" };
}
async function executeAssignStaff(action, context) {
  const config = action.config;
  const clientId = context.contactId;
  if (!clientId) {
    throw new Error("No client ID available for assign_staff action");
  }
  await db.update(clients).set({ assignedTo: config.staffId }).where(eq(clients.id, clientId));
  console.log(`    \u{1F464} Assigned staff ${config.staffId} to client ${clientId}`);
  return { assigned: true, staffId: config.staffId, clientId };
}
async function executeSendSlackMessage(action, context) {
  const config = action.config || action.settings || {};
  const workspaceId = config.workspaceId || void 0;
  if (!slackService.isConfigured() && !workspaceId) {
    console.warn("    \u26A0\uFE0F  Slack not configured - skipping message");
    return { skipped: true, reason: "Slack not configured" };
  }
  const message = interpolateString(config.message || config.text || "", context);
  const channel = config.channel || config.channelId || void 0;
  console.log(`    \u{1F50D} Slack action config:`, JSON.stringify(config, null, 2));
  console.log(`    \u{1F4E2} Sending to channel: ${channel}, message: ${message}, workspace: ${workspaceId || "default"}`);
  if (!message) {
    throw new Error("No message text provided for send_slack_message action");
  }
  const result = await slackService.sendMessage({
    channel,
    text: message,
    workspaceId
  });
  if (result.success) {
    console.log(`    \u{1F4AC} Sent Slack message to ${result.channel}`);
    return { sent: true, channel: result.channel, ts: result.ts };
  } else {
    throw new Error(`Failed to send Slack message: ${result.error}`);
  }
}
async function executeSendSlackDM(action, context) {
  const config = action.config || action.settings || {};
  const workspaceId = config.workspaceId || void 0;
  if (!slackService.isConfigured() && !workspaceId) {
    console.warn("    \u26A0\uFE0F  Slack not configured - skipping DM");
    return { skipped: true, reason: "Slack not configured" };
  }
  let userId = config.userId ? interpolateString(config.userId, context) : null;
  const email = config.email ? interpolateString(config.email, context) : null;
  if (!userId && email) {
    console.log(`    \u{1F50D} Looking up Slack user by email: ${email}`);
    const lookupResult = await slackService.lookupUserByEmail(email);
    if (lookupResult.success && lookupResult.userId) {
      userId = lookupResult.userId;
      console.log(`    \u2713 Found user: ${userId}`);
    } else {
      throw new Error(`Could not find Slack user by email "${email}": ${lookupResult.error || "User not found"}`);
    }
  }
  if (!userId) {
    throw new Error("No userId or email provided for send_slack_dm action. Configure either userId or email in the action settings.");
  }
  const message = interpolateString(config.message || config.text || "", context);
  const result = await slackService.sendDirectMessage({
    userId,
    text: message,
    workspaceId
  });
  if (result.success) {
    console.log(`    \u{1F4E8} Sent Slack DM to user ${userId}`);
    return { sent: true, userId, channel: result.channel, ts: result.ts };
  } else {
    throw new Error(`Failed to send Slack DM: ${result.error}`);
  }
}
async function executeAddSlackReaction(action, context) {
  const config = action.config || action.settings || {};
  const workspaceId = config.workspaceId || void 0;
  if (!slackService.isConfigured() && !workspaceId) {
    console.warn("    \u26A0\uFE0F  Slack not configured - skipping reaction");
    return { skipped: true, reason: "Slack not configured" };
  }
  const channel = config.channel || config.channelId;
  const timestamp = config.timestamp || config.ts;
  const emoji = config.emoji || config.reaction;
  if (!channel || !timestamp || !emoji) {
    throw new Error("Channel, timestamp, and emoji are required for add_slack_reaction action");
  }
  const result = await slackService.addReaction({
    channel,
    timestamp,
    emoji
  });
  if (result.success) {
    console.log(`    \u{1F44D} Added reaction ${config.emoji} to message`);
    return { added: true, emoji: config.emoji };
  } else {
    throw new Error(`Failed to add Slack reaction: ${result.error}`);
  }
}
async function executeCreateSlackChannel(action, context) {
  const config = action.config || action.settings || {};
  const workspaceId = config.workspaceId || void 0;
  if (!slackService.isConfigured() && !workspaceId) {
    console.warn("    \u26A0\uFE0F  Slack not configured - skipping channel creation");
    return { skipped: true, reason: "Slack not configured" };
  }
  const channelName = interpolateString(config.name || config.channelName || "", context);
  const description = config.description ? interpolateString(config.description, context) : void 0;
  const result = await slackService.createChannel({
    name: channelName,
    isPrivate: config.isPrivate || false,
    description
  });
  if (result.success) {
    console.log(`    \u{1F4E2} Created Slack channel: ${channelName} (${result.channelId})`);
    let inviteResult = null;
    if (config.inviteUsers && Array.isArray(config.inviteUsers) && config.inviteUsers.length > 0) {
      try {
        inviteResult = await slackService.inviteToChannel(result.channelId, config.inviteUsers);
        if (inviteResult.success) {
          console.log(`    \u{1F465} Invited ${config.inviteUsers.length} users to channel`);
        } else {
          console.warn(`    \u26A0\uFE0F  Failed to invite users: ${inviteResult.error}`);
        }
      } catch (inviteError) {
        console.warn(`    \u26A0\uFE0F  Failed to invite users: ${inviteError.message}`);
      }
    }
    context.variables.slackChannelId = result.channelId;
    return { created: true, channelId: result.channelId, name: channelName, inviteResult };
  } else {
    throw new Error(`Failed to create Slack channel: ${result.error}`);
  }
}
async function executeSetSlackTopic(action, context) {
  const config = action.config || action.settings || {};
  const workspaceId = config.workspaceId || void 0;
  if (!slackService.isConfigured() && !workspaceId) {
    console.warn("    \u26A0\uFE0F  Slack not configured - skipping topic update");
    return { skipped: true, reason: "Slack not configured" };
  }
  const channel = config.channel || config.channelId;
  if (!channel) {
    throw new Error("Channel is required for set_slack_topic action");
  }
  const topic = interpolateString(config.topic || "", context);
  const result = await slackService.setChannelTopic(channel, topic);
  if (result.success) {
    console.log(`    \u{1F4DD} Set topic for channel ${channel}`);
    return { updated: true, channel, topic };
  } else {
    throw new Error(`Failed to set Slack topic: ${result.error}`);
  }
}
async function executeCreateSlackReminder(action, context) {
  const config = action.config || action.settings || {};
  const workspaceId = config.workspaceId || void 0;
  if (!slackService.isConfigured() && !workspaceId) {
    console.warn("    \u26A0\uFE0F  Slack not configured - skipping reminder");
    return { skipped: true, reason: "Slack not configured" };
  }
  const textValue = config.text || config.message || "";
  const timeValue = config.time || config.reminderTime || "";
  if (!textValue || !timeValue) {
    throw new Error("Text and time are required for create_slack_reminder action");
  }
  const text = interpolateString(textValue, context);
  const result = await slackService.createReminder({
    text,
    time: timeValue,
    user: config.user
  });
  if (result.success) {
    console.log(`    \u23F0 Created Slack reminder`);
    return { created: true, reminderId: result.reminderId };
  } else {
    throw new Error(`Failed to create Slack reminder: ${result.error}`);
  }
}
async function executeNotifyManagerHoursReport(action, context) {
  const triggerData = context.triggerData;
  const config = action.config || {};
  const managerId = triggerData.managerId;
  const managerName = triggerData.managerName || "Manager";
  const managerEmail = triggerData.managerEmail || "";
  const weekStart = triggerData.weekStartDate || "";
  const weekEnd = triggerData.weekEndDate || "";
  const subordinates = triggerData._filteredSubordinates || triggerData.subordinatesBelowThreshold || [];
  if (subordinates.length === 0) {
    console.log(`    \u2139\uFE0F  No subordinates below threshold for ${managerName}, skipping`);
    return { sent: false, reason: "No subordinates below threshold" };
  }
  const staffLines = subordinates.map((sub) => {
    return `- ${sub.staffName} (${sub.staffDepartment}/${sub.staffPosition}): ${sub.totalHoursLogged}h logged (${sub.taskHoursLogged}h tasks, ${sub.calendarHoursLogged}h calendar)`;
  });
  const reportTitle = `Weekly Hours Report: ${subordinates.length} team member(s) below threshold`;
  const reportMessage = [
    `The following team members logged fewer hours than the threshold for the week of ${weekStart} to ${weekEnd}:`,
    "",
    ...staffLines,
    "",
    `Total staff below threshold: ${subordinates.length}`
  ].join("\n");
  const results = [];
  const sendNotification = config.send_notification !== false;
  const sendEmail = config.send_email === true;
  const sendSlack = config.send_slack === true;
  const slackChannel = config.slack_channel || "";
  if (sendNotification && managerId) {
    try {
      await db.insert(notifications).values({
        userId: managerId,
        type: "system",
        title: reportTitle,
        message: reportMessage,
        priority: "high",
        entityType: "workflow",
        entityId: context.workflowId,
        metadata: {
          source: "weekly_hours_report",
          weekStart,
          weekEnd,
          subordinateCount: subordinates.length,
          subordinates: subordinates.map((s) => ({
            name: s.staffName,
            department: s.staffDepartment,
            hoursLogged: s.totalHoursLogged
          }))
        }
      });
      console.log(`    \u{1F514} In-app notification sent to manager: ${managerName} (${managerId})`);
      results.push({ type: "notification", sent: true, managerId });
    } catch (err) {
      console.error(`    \u274C Failed to create notification for ${managerName}:`, err.message);
      results.push({ type: "notification", sent: false, error: err.message });
    }
  }
  if (sendEmail && managerEmail) {
    const threshold = triggerData._hoursThreshold || 40;
    const staffListText = subordinates.map((sub) => {
      return `\u2022 ${sub.staffName} (${sub.staffDepartment}/${sub.staffPosition}): ${sub.totalHoursLogged}h total \u2014 ${sub.taskHoursLogged}h tasks, ${sub.calendarHoursLogged}h calendar`;
    }).join("\n");
    const replaceMergeTags = (template) => {
      return template.replace(/\{\{manager_name\}\}/g, managerName).replace(/\{\{staff_count\}\}/g, String(subordinates.length)).replace(/\{\{week_start\}\}/g, weekStart).replace(/\{\{week_end\}\}/g, weekEnd).replace(/\{\{threshold\}\}/g, String(threshold)).replace(/\{\{staff_list\}\}/g, staffListText);
    };
    const customSubject = config.email_subject ? replaceMergeTags(config.email_subject) : null;
    const customBody = config.email_body ? replaceMergeTags(config.email_body) : null;
    const emailSubject = customSubject || `Weekly Hours Report: ${subordinates.length} team member(s) below threshold (${weekStart} - ${weekEnd})`;
    const emailTextBody = customBody || [
      `Hi ${managerName},`,
      "",
      `The following team members logged fewer hours than the ${threshold}h threshold for the week of ${weekStart} to ${weekEnd}:`,
      "",
      staffListText,
      "",
      `Total staff below threshold: ${subordinates.length}`,
      "",
      "\u2014 AgencyBoost Automation"
    ].join("\n");
    const notifService = getNotificationService();
    if (notifService && notifService.isEmailConfigured()) {
      try {
        let bodyHtml;
        if (customBody) {
          bodyHtml = `<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${customBody.replace(/\n/g, "<br/>")}</div>`;
        } else {
          const staffRowsHtml = subordinates.map((sub) => {
            return `<div class="staff-row">
              <span class="staff-name">${sub.staffName}</span>
              <span class="staff-detail"> (${sub.staffDepartment}/${sub.staffPosition})</span><br/>
              <span class="staff-hours">${sub.totalHoursLogged}h total</span>
              <span class="staff-detail"> \u2014 ${sub.taskHoursLogged}h tasks, ${sub.calendarHoursLogged}h calendar</span>
            </div>`;
          }).join("");
          bodyHtml = `
            <p>Hi ${managerName},</p>
            <p>The following team members logged fewer hours than the <strong>${threshold}h</strong> threshold for the week of <strong>${weekStart}</strong> to <strong>${weekEnd}</strong>:</p>
            ${staffRowsHtml}
            <div class="summary">Total staff below threshold: <strong>${subordinates.length}</strong></div>
          `;
        }
        const html = notifService.generateReportEmailHtml({
          title: `Weekly Hours Report`,
          bodyHtml
        });
        const emailResult = await notifService.sendDirectEmail({
          to: managerEmail,
          subject: emailSubject,
          text: emailTextBody,
          html
        });
        if (emailResult.sent) {
          console.log(`    \u{1F4E7} Email sent to ${managerEmail}: ${emailSubject}`);
          results.push({ type: "email", sent: true, to: managerEmail, subject: emailSubject });
        } else {
          console.error(`    \u274C Email failed to ${managerEmail}: ${emailResult.error}`);
          results.push({ type: "email", sent: false, to: managerEmail, error: emailResult.error });
        }
      } catch (err) {
        console.error(`    \u274C Email error to ${managerEmail}:`, err.message);
        results.push({ type: "email", sent: false, to: managerEmail, error: err.message });
      }
    } else {
      console.warn(`    \u26A0\uFE0F  Mailgun not configured, email skipped for ${managerEmail}`);
      results.push({ type: "email", sent: false, to: managerEmail, error: "Mailgun not configured" });
    }
  }
  if (sendSlack && slackService.isConfigured()) {
    if (!slackChannel) {
      console.warn(`    \u26A0\uFE0F  Slack report enabled but no channel configured, skipping`);
      results.push({ type: "slack", sent: false, error: "No Slack channel configured" });
    } else {
      try {
        const slackMessage = `\u{1F4CA} *${reportTitle}*

${reportMessage}`;
        const result = await slackService.sendMessage({
          channel: slackChannel,
          text: slackMessage
        });
        if (result.success) {
          console.log(`    \u{1F4AC} Slack report sent to ${slackChannel}`);
          results.push({ type: "slack", sent: true, channel: slackChannel });
        } else {
          results.push({ type: "slack", sent: false, error: result.error });
        }
      } catch (err) {
        console.error(`    \u274C Failed to send Slack report:`, err.message);
        results.push({ type: "slack", sent: false, error: err.message });
      }
    }
  }
  return {
    managerName,
    managerId,
    subordinateCount: subordinates.length,
    results
  };
}
function evaluateConditions(conditions, context) {
  for (const condition of conditions) {
    const actualValue = getNestedValue(context.triggerData, condition.field);
    const passed = evaluateSingleCondition(actualValue, condition.operator, condition.value);
    if (!passed) {
      return false;
    }
  }
  return true;
}
function evaluateSingleCondition(actual, operator, expected) {
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
function interpolateString(template, context) {
  if (!template) return "";
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context.variables, path.trim());
    return value !== void 0 ? String(value) : match;
  });
}
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

export {
  emitTrigger,
  executeWorkflow
};
