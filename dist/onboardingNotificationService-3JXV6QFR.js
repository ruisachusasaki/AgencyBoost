import {
  getNotificationService
} from "./chunk-WPY5OZFU.js";
import {
  db
} from "./chunk-BUCOPU6G.js";
import {
  notifications,
  onboardingInstanceItems,
  onboardingInstances,
  staff,
  taskSettings
} from "./chunk-MYUTWN2E.js";
import "./chunk-R5U7XKVJ.js";

// server/services/onboardingNotificationService.ts
import { eq, and, sql, lte } from "drizzle-orm";
function getBusinessDaysElapsed(startDate, today) {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      count++;
    }
  }
  return count;
}
function isSameCalendarDate(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
async function readBooleanSetting(key, defaultVal) {
  try {
    const [setting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, key));
    if (setting && setting.settingValue !== null && setting.settingValue !== void 0) {
      const val = typeof setting.settingValue === "object" ? setting.settingValue.value : setting.settingValue;
      return val === true || val === "true";
    }
  } catch (err) {
    console.error(`[OnboardingNotif] Error reading setting ${key}:`, err);
  }
  return defaultVal;
}
async function readNumberSetting(key, defaultVal) {
  try {
    const [setting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, key));
    if (setting && setting.settingValue) {
      const val = typeof setting.settingValue === "object" ? setting.settingValue.value : setting.settingValue;
      const parsed = parseInt(String(val), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (err) {
    console.error(`[OnboardingNotif] Error reading setting ${key}:`, err);
  }
  return defaultVal;
}
async function runDayUnlockNotifications() {
  if (isDayUnlockRunning) {
    console.log("[OnboardingNotif] Day unlock check already running \u2014 skipping");
    return;
  }
  isDayUnlockRunning = true;
  try {
    await _runDayUnlockNotifications();
  } finally {
    isDayUnlockRunning = false;
  }
}
async function _runDayUnlockNotifications() {
  console.log("[OnboardingNotif] Running day unlock notifications...");
  const enabled = await readBooleanSetting("onboarding_day_unlock_notifications", true);
  if (!enabled) {
    console.log("[OnboardingNotif] Day unlock notifications disabled \u2014 skipping");
    return;
  }
  const activeInstances = await db.select().from(onboardingInstances).where(eq(onboardingInstances.status, "active"));
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  let notified = 0;
  for (const instance of activeInstances) {
    try {
      const snapshot = instance.templateSnapshot;
      if (!snapshot) continue;
      const dayUnlockMode = snapshot.dayUnlockMode || "calendar";
      if (dayUnlockMode !== "calendar") continue;
      const startDate = new Date(instance.startDate || instance.createdAt);
      startDate.setHours(0, 0, 0, 0);
      const businessDays = getBusinessDaysElapsed(startDate, today);
      const currentDay = Math.min(businessDays + 1, snapshot.totalDays || 999);
      if (currentDay === 1 && isSameCalendarDate(startDate, today)) continue;
      const expectedTitle = `Day ${currentDay} of your onboarding is ready`;
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const [existing] = await db.select({ id: notifications.id }).from(notifications).where(and(
        eq(notifications.userId, instance.staffId),
        eq(notifications.title, expectedTitle),
        sql`${notifications.createdAt} >= ${todayStart}`,
        sql`${notifications.createdAt} < ${todayEnd}`
      )).limit(1);
      if (existing) continue;
      const dayItems = await db.select({ id: onboardingInstanceItems.id }).from(onboardingInstanceItems).where(and(
        eq(onboardingInstanceItems.instanceId, instance.id),
        eq(onboardingInstanceItems.dayNumber, currentDay)
      )).limit(1);
      if (dayItems.length === 0) continue;
      const notificationService = getNotificationService();
      if (notificationService) {
        await notificationService.notify({
          userId: instance.staffId,
          type: "onboarding_day_unlock",
          title: expectedTitle,
          message: `Your Day ${currentDay} onboarding items are now unlocked. Head to HR > Onboarding Checklist to continue.`,
          entityType: "onboarding",
          entityId: String(instance.id),
          priority: "normal"
        });
        notified++;
      }
    } catch (err) {
      console.error(`[OnboardingNotif] Error processing day unlock for instance ${instance.id}:`, err);
    }
  }
  console.log(`[OnboardingNotif] Day unlock notifications sent: ${notified}`);
}
async function runBehindScheduleAlerts() {
  if (isBehindAlertRunning) {
    console.log("[OnboardingNotif] Behind schedule check already running \u2014 skipping");
    return;
  }
  isBehindAlertRunning = true;
  try {
    await _runBehindScheduleAlerts();
  } finally {
    isBehindAlertRunning = false;
  }
}
async function _runBehindScheduleAlerts() {
  console.log("[OnboardingNotif] Running behind schedule alerts...");
  const threshold = await readNumberSetting("onboarding_behind_schedule_threshold", 2);
  const activeInstances = await db.select().from(onboardingInstances).where(eq(onboardingInstances.status, "active"));
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  let alerted = 0;
  for (const instance of activeInstances) {
    try {
      const snapshot = instance.templateSnapshot;
      if (!snapshot) continue;
      const startDate = new Date(instance.startDate || instance.createdAt);
      startDate.setHours(0, 0, 0, 0);
      const businessDays = getBusinessDaysElapsed(startDate, today);
      const totalDays = snapshot.totalDays || 999;
      const currentDay = Math.min(businessDays + 1, totalDays);
      const cutoffDay = currentDay - threshold;
      if (cutoffDay < 1) continue;
      const overdueItems = await db.select({
        dayNumber: onboardingInstanceItems.dayNumber
      }).from(onboardingInstanceItems).where(and(
        eq(onboardingInstanceItems.instanceId, instance.id),
        eq(onboardingInstanceItems.isRequired, true),
        eq(onboardingInstanceItems.isCompleted, false),
        lte(onboardingInstanceItems.dayNumber, cutoffDay)
      ));
      if (overdueItems.length === 0) continue;
      const overdueDays = [...new Set(overdueItems.map((i) => i.dayNumber))].sort((a, b) => a - b);
      const earliestOverdueDay = overdueDays[0];
      const [hire] = await db.select({
        firstName: staff.firstName,
        lastName: staff.lastName,
        managerId: staff.managerId
      }).from(staff).where(eq(staff.id, instance.staffId));
      if (!hire) continue;
      const managerId = hire.managerId;
      if (!managerId) {
        console.warn(`[OnboardingNotif] No manager for staff ${instance.staffId} \u2014 skipping behind alert`);
        continue;
      }
      const hireName = `${hire.firstName} ${hire.lastName}`;
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const [existingAlert] = await db.select({ id: notifications.id }).from(notifications).where(and(
        eq(notifications.userId, managerId),
        sql`${notifications.title} LIKE ${"%" + hireName + "%"}`,
        eq(notifications.type, "onboarding_behind_schedule"),
        sql`${notifications.createdAt} >= ${todayStart}`,
        sql`${notifications.createdAt} < ${todayEnd}`
      )).limit(1);
      if (existingAlert) continue;
      const notificationService = getNotificationService();
      if (notificationService) {
        await notificationService.notify({
          userId: managerId,
          type: "onboarding_behind_schedule",
          title: `${hireName} is behind on onboarding`,
          message: `${hireName} has incomplete required items from Day ${earliestOverdueDay}. They are currently on Day ${currentDay} of ${totalDays}.`,
          entityType: "onboarding",
          entityId: String(instance.id),
          priority: "normal"
        });
        alerted++;
      }
    } catch (err) {
      console.error(`[OnboardingNotif] Error processing behind alert for instance ${instance.id}:`, err);
    }
  }
  console.log(`[OnboardingNotif] Behind schedule alerts sent: ${alerted}`);
}
var dayUnlockIntervalId = null;
var behindScheduleIntervalId = null;
var isDayUnlockRunning = false;
var isBehindAlertRunning = false;
function startOnboardingNotificationService() {
  if (dayUnlockIntervalId || behindScheduleIntervalId) {
    console.log("[OnboardingNotif] Already running");
    return;
  }
  console.log("[OnboardingNotif] Starting onboarding notification service");
  setTimeout(() => {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const dow = now.getDay();
    if (dow >= 1 && dow <= 5 && hour >= 7 && hour <= 9) {
      runDayUnlockNotifications().catch((err) => console.error("[OnboardingNotif] Initial day unlock error:", err));
    }
  }, 9e4);
  dayUnlockIntervalId = setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const dow = now.getDay();
    if (dow >= 1 && dow <= 5 && hour === 8 && now.getMinutes() < 15) {
      runDayUnlockNotifications().catch((err) => console.error("[OnboardingNotif] Day unlock interval error:", err));
    }
  }, 15 * 60 * 1e3);
  behindScheduleIntervalId = setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dow = now.getDay();
    if (dow >= 1 && dow <= 5 && hour === 8 && minute >= 25 && minute < 40) {
      runBehindScheduleAlerts().catch((err) => console.error("[OnboardingNotif] Behind schedule interval error:", err));
    }
  }, 15 * 60 * 1e3);
  console.log("[OnboardingNotif] Scheduled: day unlock ~8:00 AM, behind alerts ~8:30 AM (weekdays)");
}
function stopOnboardingNotificationService() {
  if (dayUnlockIntervalId) {
    clearInterval(dayUnlockIntervalId);
    dayUnlockIntervalId = null;
  }
  if (behindScheduleIntervalId) {
    clearInterval(behindScheduleIntervalId);
    behindScheduleIntervalId = null;
  }
  console.log("[OnboardingNotif] Stopped onboarding notification service");
}
export {
  runBehindScheduleAlerts,
  runDayUnlockNotifications,
  startOnboardingNotificationService,
  stopOnboardingNotificationService
};
