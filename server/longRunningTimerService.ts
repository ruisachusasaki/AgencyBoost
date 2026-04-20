import { db } from "./db";
import { taskSettings, tasks, staff } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { NotificationService } from "./notification-service";
import { storage } from "./storage";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_THRESHOLD_HOURS = 8;
const DEFAULT_AUTO_STOP_THRESHOLD_HOURS = 12;
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

async function getSettingValue(key: string): Promise<any> {
  try {
    const [setting] = await db.select()
      .from(taskSettings)
      .where(eq(taskSettings.settingKey, key));

    if (setting && setting.settingValue !== null && setting.settingValue !== undefined) {
      return typeof setting.settingValue === 'object'
        ? (setting.settingValue as any).value
        : setting.settingValue;
    }
  } catch (err) {
    console.error(`[LongRunningTimerCheck] Error fetching setting ${key}:`, err);
  }
  return undefined;
}

async function getThresholdHours(): Promise<number> {
  const val = await getSettingValue("long_running_timer_threshold_hours");
  const parsed = parseFloat(String(val));
  if (!isNaN(parsed) && parsed > 0) return parsed;
  return DEFAULT_THRESHOLD_HOURS;
}

async function isAlertEnabled(): Promise<boolean> {
  const val = await getSettingValue("long_running_timer_alerts_enabled");
  if (val === undefined) return true;
  return val === true || val === "true";
}

async function isAutoStopEnabled(): Promise<boolean> {
  const val = await getSettingValue("auto_stop_timer_enabled");
  if (val === undefined) return false;
  return val === true || val === "true";
}

async function getAutoStopThresholdHours(): Promise<number> {
  const val = await getSettingValue("auto_stop_timer_threshold_hours");
  const parsed = parseFloat(String(val));
  if (!isNaN(parsed) && parsed > 0) return parsed;
  return DEFAULT_AUTO_STOP_THRESHOLD_HOURS;
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

interface RunningTimerCandidate {
  taskId: string;
  taskTitle: string;
  userId: string;
  startTime: string;
  durationMs: number;
  entryId: string;
  entryIndex: number;
  allEntries: any[];
}

async function runLongRunningTimerCheck() {
  if (isRunning) {
    console.log("[LongRunningTimerCheck] Already running a check, skipping");
    return;
  }

  isRunning = true;

  try {
    const enabled = await isAlertEnabled();
    const autoStopEnabled = await isAutoStopEnabled();

    if (!enabled && !autoStopEnabled) {
      return;
    }

    const thresholdHours = await getThresholdHours();
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const autoStopThresholdHours = await getAutoStopThresholdHours();
    const autoStopThresholdMs = autoStopThresholdHours * 60 * 60 * 1000;
    const now = Date.now();

    // Only fetch tasks that have a running entry, using JSONB containment
    const matchPattern = JSON.stringify([{ isRunning: true }]);
    const candidateTasks = await db
      .select({ id: tasks.id, title: tasks.title, timeEntries: tasks.timeEntries })
      .from(tasks)
      .where(sql`${tasks.timeEntries} @> ${matchPattern}::jsonb`);

    const longRunningTimers: RunningTimerCandidate[] = [];
    const autoStopTimers: RunningTimerCandidate[] = [];

    for (const task of candidateTasks) {
      if (!task.timeEntries || !Array.isArray(task.timeEntries)) continue;

      const entries = task.timeEntries as any[];
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry.isRunning || !entry.startTime || !entry.userId) continue;

        const startMs = new Date(entry.startTime).getTime();
        const elapsed = now - startMs;

        const candidate: RunningTimerCandidate = {
          taskId: task.id,
          taskTitle: task.title,
          userId: entry.userId,
          startTime: entry.startTime,
          durationMs: elapsed,
          entryId: entry.id || `${task.id}-${entry.userId}-${entry.startTime}`,
          entryIndex: i,
          allEntries: entries,
        };

        if (autoStopEnabled && elapsed >= autoStopThresholdMs) {
          autoStopTimers.push(candidate);
        } else if (enabled && elapsed >= thresholdMs) {
          const timerKey = `${task.id}-${entry.userId}-${entry.startTime}`;
          if (!alertedTimers.has(timerKey)) {
            longRunningTimers.push(candidate);
          }
        }
      }
    }

    const notificationService = new NotificationService(storage);
    const adminIds = await getAdminUserIds();

    const staffMembers = await db.select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
    }).from(staff);

    const staffMap = new Map(staffMembers.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

    // Auto-stop timers first (so they don't also trigger reminder alerts)
    for (const timer of autoStopTimers) {
      try {
        // Cap recorded duration at the auto-stop threshold so we don't credit
        // unbounded time for an obviously abandoned timer.
        const startMs = new Date(timer.startTime).getTime();
        const cappedEndMs = startMs + autoStopThresholdMs;
        const endIso = new Date(cappedEndMs).toISOString();
        const durationMinutes = Math.floor(autoStopThresholdMs / 1000 / 60);

        const updatedEntries = [...timer.allEntries];
        const original = updatedEntries[timer.entryIndex];
        updatedEntries[timer.entryIndex] = {
          ...original,
          isRunning: false,
          endTime: endIso,
          duration: durationMinutes,
          stoppedBy: 'system',
          stopReason: 'auto-stopped',
          autoStoppedAt: new Date(now).toISOString(),
          autoStoppedThresholdHours: autoStopThresholdHours,
        };

        const totalTracked = updatedEntries.reduce(
          (total: number, e: any) => total + (e.duration || 0),
          0,
        );

        await db.update(tasks)
          .set({ timeEntries: updatedEntries, timeTracked: totalTracked })
          .where(eq(tasks.id, timer.taskId));

        const staffName = staffMap.get(timer.userId) || "Unknown";

        await notificationService.notify({
          userId: timer.userId,
          type: 'task_assigned',
          title: 'Timer Auto-Stopped',
          message: `Your timer on "${timer.taskTitle}" was auto-stopped after running for over ${autoStopThresholdHours} hours. The entry was capped at ${autoStopThresholdHours}h — please review and adjust if needed.`,
          entityType: 'task',
          entityId: String(timer.taskId),
          actionUrl: `/tasks?taskId=${timer.taskId}`,
          actionText: 'Review Time Entry',
          priority: 'high',
        });

        for (const adminId of adminIds) {
          if (adminId === timer.userId) continue;
          await notificationService.notify({
            userId: adminId,
            type: 'task_assigned',
            title: 'Timer Auto-Stopped',
            message: `${staffName}'s timer on "${timer.taskTitle}" was auto-stopped after running for over ${autoStopThresholdHours} hours.`,
            entityType: 'task',
            entityId: String(timer.taskId),
            actionUrl: `/tasks?taskId=${timer.taskId}`,
            actionText: 'Review Time Entry',
            priority: 'high',
          });
        }

        const timerKey = `${timer.taskId}-${timer.userId}-${timer.startTime}`;
        alertedTimers.delete(timerKey);

        console.log(`[LongRunningTimerCheck] Auto-stopped timer for user ${timer.userId} on task ${timer.taskId} (${autoStopThresholdHours}h cap)`);
      } catch (err) {
        console.error(`[LongRunningTimerCheck] Failed to auto-stop timer on task ${timer.taskId}:`, err);
      }
    }

    if (longRunningTimers.length > 0) {
      console.log(`[LongRunningTimerCheck] Found ${longRunningTimers.length} long-running timer(s) exceeding ${thresholdHours}h`);

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
    }
  } catch (error) {
    console.error("[LongRunningTimerCheck] Error during check:", error);
  } finally {
    isRunning = false;
  }
}

export function clearAlertedTimers() {
  alertedTimers.clear();
}
