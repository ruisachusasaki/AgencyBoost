import { db } from "./db";
import { taskSettings, tasks, staff, roles, taskTimeEntries, taskActivities } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { NotificationService } from "./notification-service";
import { storage } from "./storage";
import { randomUUID } from "crypto";

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
    // Resolve admins by joining staff -> roles via roleId and matching
    // roles.name = 'Admin'. Mirrors the pattern used in server/auth.ts and
    // server/replitAuth.ts. (staff has no `role` text column — only roleId.)
    const admins = await db.select({ id: staff.id })
      .from(staff)
      .innerJoin(roles, eq(staff.roleId, roles.id))
      .where(and(
        eq(roles.name, "Admin"),
        eq(staff.isActive, true)
      ));
    return admins.map(a => a.id);
  } catch (err) {
    console.error("[LongRunningTimerCheck] Error fetching admins:", err);
    return [];
  }
}

interface RunningTimerCandidate {
  entryId: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  startTime: Date;
  durationMs: number;
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

    // All running timers come from the normalized task_time_entries table now.
    // Single SQL query, joined to the parent task for the title.
    const rows = await db
      .select({ entry: taskTimeEntries, taskTitle: tasks.title })
      .from(taskTimeEntries)
      .innerJoin(tasks, eq(tasks.id, taskTimeEntries.taskId))
      .where(eq(taskTimeEntries.isRunning, true));

    const longRunningTimers: RunningTimerCandidate[] = [];
    const autoStopTimers: RunningTimerCandidate[] = [];

    for (const row of rows) {
      const e = row.entry;
      if (!e.startTime || !e.userId) continue;
      const startMs = (e.startTime instanceof Date ? e.startTime : new Date(e.startTime as any)).getTime();
      const elapsed = now - startMs;
      const candidate: RunningTimerCandidate = {
        entryId: e.id,
        taskId: e.taskId,
        taskTitle: row.taskTitle,
        userId: e.userId,
        startTime: e.startTime instanceof Date ? e.startTime : new Date(e.startTime as any),
        durationMs: elapsed,
      };
      if (autoStopEnabled && elapsed >= autoStopThresholdMs) {
        autoStopTimers.push(candidate);
      } else if (enabled && elapsed >= thresholdMs) {
        const timerKey = candidate.entryId;
        if (!alertedTimers.has(timerKey)) {
          longRunningTimers.push(candidate);
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
        const startMs = timer.startTime.getTime();
        const cappedEnd = new Date(startMs + autoStopThresholdMs);
        const durationMinutes = Math.floor(autoStopThresholdMs / 1000 / 60);

        // Single-row UPDATE on the normalized table — sets stop metadata and
        // marks the entry stopped. task.timeTracked is then recomputed from
        // the SUM of all entries belonging to that task.
        // Predicate is_running=true makes the UPDATE a no-op if the user
        // (or another writer) already stopped the timer between our SELECT
        // and UPDATE — preventing duplicate auto-stop overwrites.
        const updated = await db.update(taskTimeEntries)
          .set({
            isRunning: false,
            endTime: cappedEnd,
            duration: durationMinutes,
            stoppedBy: 'system',
            stopReason: 'auto-stopped',
            autoStoppedAt: new Date(now),
            autoStoppedThresholdHours: autoStopThresholdHours,
            updatedAt: new Date(),
          })
          .where(and(eq(taskTimeEntries.id, timer.entryId), eq(taskTimeEntries.isRunning, true)))
          .returning({ id: taskTimeEntries.id });
        if (updated.length === 0) {
          // Already stopped by someone else — skip recompute, activity log, and notification.
          continue;
        }

        const totalRow = await db.execute(sql`
          SELECT COALESCE(SUM(duration), 0) AS total
          FROM ${taskTimeEntries}
          WHERE task_id = ${timer.taskId}
        `);
        const totalTracked = Number((totalRow.rows[0] as any)?.total || 0);
        await db.update(tasks)
          .set({ timeTracked: totalTracked })
          .where(eq(tasks.id, timer.taskId));

        const staffName = staffMap.get(timer.userId) || "Unknown";

        // Activity feed mirror so users still see auto-stops in task history.
        try {
          await db.insert(taskActivities).values({
            id: randomUUID(),
            taskId: timer.taskId,
            actionType: 'time_tracking',
            fieldName: 'timeEntries',
            oldValue: 'Timer running',
            newValue: `Timer auto-stopped after ${autoStopThresholdHours}h (capped at ${durationMinutes}m)`,
            userId: timer.userId,
            userName: staffName,
            createdAt: new Date(),
          } as any);
        } catch (e) {
          console.warn('[LongRunningTimerCheck] failed to log auto-stop activity:', e);
        }

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

        alertedTimers.delete(timer.entryId);

        console.log(`[LongRunningTimerCheck] Auto-stopped timer for user ${timer.userId} on task ${timer.taskId} (${autoStopThresholdHours}h cap)`);
      } catch (err) {
        console.error(`[LongRunningTimerCheck] Failed to auto-stop timer on task ${timer.taskId}:`, err);
      }
    }

    if (longRunningTimers.length > 0) {
      console.log(`[LongRunningTimerCheck] Found ${longRunningTimers.length} long-running timer(s) exceeding ${thresholdHours}h`);

      for (const timer of longRunningTimers) {
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

        alertedTimers.add(timer.entryId);
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
