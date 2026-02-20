import { db } from "./db";
import { taskSettings, enhancedTasks, staff } from "@shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { NotificationService } from "./notification-service";
import { storage } from "./storage";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_THRESHOLD_HOURS = 8;
let checkIntervalId: NodeJS.Timeout | null = null;
let isRunning = false;
const alertedTimers = new Set<string>();

export function startLongRunningTimerCheck() {
  if (checkIntervalId) {
    console.log("[LongRunningTimerCheck] Already running");
    return;
  }

  console.log("[LongRunningTimerCheck] Starting long-running timer check service");

  setTimeout(() => {
    runLongRunningTimerCheck().catch((err) => {
      console.error("[LongRunningTimerCheck] Initial check error:", err);
    });
  }, 60000);

  checkIntervalId = setInterval(() => {
    runLongRunningTimerCheck().catch((err) => {
      console.error("[LongRunningTimerCheck] Check interval error:", err);
    });
  }, CHECK_INTERVAL_MS);

  console.log(`[LongRunningTimerCheck] Scheduled to run every ${CHECK_INTERVAL_MS / 1000 / 60} minutes`);
}

export function stopLongRunningTimerCheck() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log("[LongRunningTimerCheck] Stopped long-running timer check service");
  }
}

async function getThresholdHours(): Promise<number> {
  try {
    const [setting] = await db.select()
      .from(taskSettings)
      .where(eq(taskSettings.settingKey, "long_running_timer_threshold_hours"));

    if (setting && setting.settingValue) {
      const val = typeof setting.settingValue === 'object'
        ? (setting.settingValue as any).value
        : setting.settingValue;
      const parsed = parseFloat(String(val));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (err) {
    console.error("[LongRunningTimerCheck] Error fetching threshold:", err);
  }
  return DEFAULT_THRESHOLD_HOURS;
}

async function isAlertEnabled(): Promise<boolean> {
  try {
    const [setting] = await db.select()
      .from(taskSettings)
      .where(eq(taskSettings.settingKey, "long_running_timer_alerts_enabled"));

    if (setting && setting.settingValue !== null && setting.settingValue !== undefined) {
      const val = typeof setting.settingValue === 'object'
        ? (setting.settingValue as any).value
        : setting.settingValue;
      return val === true || val === "true";
    }
  } catch (err) {
    console.error("[LongRunningTimerCheck] Error fetching alert setting:", err);
  }
  return true;
}

async function getAdminUserIds(): Promise<string[]> {
  try {
    const admins = await db.select({ id: staff.id })
      .from(staff)
      .where(and(
        eq(staff.role, "Admin"),
        eq(staff.isActive, true)
      ));
    return admins.map(a => a.id);
  } catch (err) {
    console.error("[LongRunningTimerCheck] Error fetching admins:", err);
    return [];
  }
}

async function runLongRunningTimerCheck() {
  if (isRunning) {
    console.log("[LongRunningTimerCheck] Already running a check, skipping");
    return;
  }

  isRunning = true;

  try {
    const enabled = await isAlertEnabled();
    if (!enabled) {
      return;
    }

    const thresholdHours = await getThresholdHours();
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const now = Date.now();

    const allTasks = await db.select({
      id: enhancedTasks.id,
      title: enhancedTasks.title,
      timeEntries: enhancedTasks.timeEntries,
    }).from(enhancedTasks);

    const longRunningTimers: Array<{
      taskId: number;
      taskTitle: string;
      userId: string;
      startTime: string;
      durationMs: number;
      entryId: string;
    }> = [];

    for (const task of allTasks) {
      if (!task.timeEntries || !Array.isArray(task.timeEntries)) continue;

      for (const entry of task.timeEntries as any[]) {
        if (!entry.isRunning || !entry.startTime || !entry.userId) continue;

        const startMs = new Date(entry.startTime).getTime();
        const elapsed = now - startMs;

        if (elapsed >= thresholdMs) {
          const timerKey = `${task.id}-${entry.userId}-${entry.startTime}`;

          if (!alertedTimers.has(timerKey)) {
            longRunningTimers.push({
              taskId: task.id,
              taskTitle: task.title,
              userId: entry.userId,
              startTime: entry.startTime,
              durationMs: elapsed,
              entryId: entry.id || timerKey,
            });
          }
        }
      }
    }

    if (longRunningTimers.length === 0) {
      return;
    }

    console.log(`[LongRunningTimerCheck] Found ${longRunningTimers.length} long-running timer(s) exceeding ${thresholdHours}h`);

    const notificationService = new NotificationService(storage);
    const adminIds = await getAdminUserIds();

    const staffMembers = await db.select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
    }).from(staff);

    const staffMap = new Map(staffMembers.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

    for (const timer of longRunningTimers) {
      const timerKey = `${timer.taskId}-${timer.userId}-${timer.startTime}`;
      const staffName = staffMap.get(timer.userId) || "Unknown";
      const hours = Math.round(timer.durationMs / (1000 * 60 * 60) * 10) / 10;

      await notificationService.notify({
        userId: timer.userId,
        type: 'task_assigned',
        title: 'Long-Running Timer Alert',
        message: `Your timer on "${timer.taskTitle}" has been running for ${hours} hours. Please stop or review it if needed.`,
        entityType: 'task',
        entityId: String(timer.taskId),
        actionUrl: `/tasks?taskId=${timer.taskId}`,
        actionText: 'View Task',
        priority: 'high',
      });

      for (const adminId of adminIds) {
        if (adminId === timer.userId) continue;

        await notificationService.notify({
          userId: adminId,
          type: 'task_assigned',
          title: 'Long-Running Timer Alert',
          message: `${staffName}'s timer on "${timer.taskTitle}" has been running for ${hours} hours.`,
          entityType: 'task',
          entityId: String(timer.taskId),
          actionUrl: `/tasks?taskId=${timer.taskId}`,
          actionText: 'View Task',
          priority: 'high',
        });
      }

      alertedTimers.add(timerKey);
    }

    console.log(`[LongRunningTimerCheck] Sent alerts for ${longRunningTimers.length} timer(s)`);
  } catch (error) {
    console.error("[LongRunningTimerCheck] Error during check:", error);
  } finally {
    isRunning = false;
  }
}

export function clearAlertedTimers() {
  alertedTimers.clear();
}
