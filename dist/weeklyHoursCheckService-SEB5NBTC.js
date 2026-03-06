import {
  emitTrigger
} from "./chunk-VL3QEDZT.js";
import "./chunk-WPY5OZFU.js";
import "./chunk-P6BLHQLQ.js";
import {
  db
} from "./chunk-7KRGJ7UC.js";
import {
  enhancedTasks,
  eventTimeEntries,
  notifications,
  staff,
  taskSettings,
  workflows
} from "./chunk-6A7ORSIC.js";
import "./chunk-R5U7XKVJ.js";

// server/weeklyHoursCheckService.ts
import { eq, and, gte, sql } from "drizzle-orm";
var CHECK_INTERVAL_MS = 60 * 60 * 1e3;
var checkIntervalId = null;
var isRunning = false;
function startWeeklyHoursCheck() {
  if (checkIntervalId) {
    console.log("[WeeklyHoursCheck] Already running");
    return;
  }
  console.log("[WeeklyHoursCheck] Starting weekly hours check service (system alert + workflow triggers)");
  setTimeout(() => {
    runWeeklyHoursCheck().catch((err) => {
      console.error("[WeeklyHoursCheck] Initial check error:", err);
    });
  }, 3e4);
  checkIntervalId = setInterval(() => {
    runWeeklyHoursCheck().catch((err) => {
      console.error("[WeeklyHoursCheck] Check interval error:", err);
    });
  }, CHECK_INTERVAL_MS);
  console.log(`[WeeklyHoursCheck] Scheduled to run every ${CHECK_INTERVAL_MS / 1e3 / 60} minutes`);
}
function stopWeeklyHoursCheck() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log("[WeeklyHoursCheck] Stopped weekly hours check service");
  }
}
async function getSystemAlertSettings() {
  try {
    const settings = await db.select().from(taskSettings).where(
      sql`${taskSettings.settingKey} IN ('weekly_hours_alert_enabled', 'weekly_hours_alert_threshold', 'weekly_hours_alert_check_day', 'weekly_hours_alert_include_calendar')`
    );
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.settingKey] = typeof s.settingValue === "object" ? s.settingValue.value : s.settingValue;
    }
    return {
      enabled: settingsMap["weekly_hours_alert_enabled"] !== false,
      threshold: parseFloat(String(settingsMap["weekly_hours_alert_threshold"])) || 40,
      checkDay: settingsMap["weekly_hours_alert_check_day"] || "Monday",
      includeCalendarTime: settingsMap["weekly_hours_alert_include_calendar"] !== false
    };
  } catch (err) {
    console.error("[WeeklyHoursCheck] Error fetching system alert settings:", err);
    return { enabled: true, threshold: 40, checkDay: "Monday", includeCalendarTime: true };
  }
}
function extractHoursConfigs(activeWorkflows) {
  const configs = [];
  for (const w of activeWorkflows) {
    try {
      const triggers = w.triggers || [];
      for (const t of triggers) {
        if (t.type === "weekly_hours_below_threshold") {
          const config = t.config || {};
          configs.push({
            hoursThreshold: parseFloat(config.hours_threshold) || 40,
            checkDay: config.check_day || "Monday",
            includeCalendarTime: config.include_calendar_time !== false,
            staffFilter: config.staff_filter || "my_direct_reports",
            department: config.department || void 0
          });
        }
      }
    } catch {
    }
  }
  return configs;
}
function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getPreviousWeekRange(now) {
  const dayOfWeek = now.getDay();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
  weekEnd.setHours(0, 0, 0, 0);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 7);
  return {
    weekStartStr: toLocalDateStr(weekStart),
    weekEndStr: toLocalDateStr(weekEnd)
  };
}
async function getStaffHoursForWeek(allStaff, weekStartStr, weekEndStr, includeCalendar) {
  const staffHours = /* @__PURE__ */ new Map();
  const tasksWithTime = await db.select({
    id: enhancedTasks.id,
    title: enhancedTasks.title,
    timeEntries: enhancedTasks.timeEntries
  }).from(enhancedTasks).where(
    and(
      sql`${enhancedTasks.timeEntries} IS NOT NULL`,
      sql`${enhancedTasks.timeEntries}::text != 'null'`,
      sql`${enhancedTasks.timeEntries}::text != '[]'`
    )
  );
  for (const task of tasksWithTime) {
    const entries = task.timeEntries || [];
    for (const entry of entries) {
      if (!entry.startTime || !entry.userId) continue;
      const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
      if (entryDate >= weekStartStr && entryDate < weekEndStr) {
        const existing = staffHours.get(entry.userId) || { taskHours: 0, calendarHours: 0 };
        const durationMinutes = entry.duration || (entry.endTime ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 6e4 : 0);
        existing.taskHours += durationMinutes / 60;
        staffHours.set(entry.userId, existing);
      }
    }
  }
  if (includeCalendar) {
    const calendarEntries = await db.select({
      userId: eventTimeEntries.userId,
      duration: eventTimeEntries.duration,
      startTime: eventTimeEntries.startTime
    }).from(eventTimeEntries).where(
      and(
        gte(eventTimeEntries.startTime, /* @__PURE__ */ new Date(weekStartStr + "T00:00:00")),
        sql`${eventTimeEntries.startTime} < ${/* @__PURE__ */ new Date(weekEndStr + "T00:00:00")}`
      )
    );
    for (const entry of calendarEntries) {
      const existing = staffHours.get(entry.userId) || { taskHours: 0, calendarHours: 0 };
      existing.calendarHours += (entry.duration || 0) / 60;
      staffHours.set(entry.userId, existing);
    }
  }
  return staffHours;
}
async function runWeeklyHoursCheck() {
  if (isRunning) {
    console.log("[WeeklyHoursCheck] Already running a check, skipping");
    return;
  }
  isRunning = true;
  try {
    const now = /* @__PURE__ */ new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[dayOfWeek];
    const currentHour = now.getHours();
    const systemSettings = await getSystemAlertSettings();
    let activeWorkflows = [];
    try {
      activeWorkflows = await db.select().from(workflows).where(eq(workflows.status, "active"));
    } catch {
    }
    const workflowConfigs = extractHoursConfigs(activeWorkflows);
    const systemCheckNeeded = systemSettings.enabled && systemSettings.checkDay === currentDay;
    const workflowCheckNeeded = workflowConfigs.some((c) => c.checkDay === currentDay);
    if (!systemCheckNeeded && !workflowCheckNeeded) {
      return;
    }
    if (currentHour < 6 || currentHour > 10) {
      return;
    }
    const { weekStartStr, weekEndStr } = getPreviousWeekRange(now);
    const systemAlreadyAlerted = await hasAlreadySentWeeklyAlert(weekStartStr);
    if (systemCheckNeeded && systemAlreadyAlerted && !workflowCheckNeeded) {
      return;
    }
    console.log(`[WeeklyHoursCheck] Checking hours for week: ${weekStartStr} to ${weekEndStr}`);
    const allStaff = await db.select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      department: staff.department,
      position: staff.position,
      managerId: staff.managerId,
      isActive: staff.isActive,
      role: staff.role
    }).from(staff).where(eq(staff.isActive, true));
    const includeCalendar = systemSettings.includeCalendarTime || workflowConfigs.some((c) => c.includeCalendarTime);
    const staffHours = await getStaffHoursForWeek(allStaff, weekStartStr, weekEndStr, includeCalendar);
    if (systemCheckNeeded && !systemAlreadyAlerted) {
      await runSystemAlert(allStaff, staffHours, systemSettings, weekStartStr, weekEndStr);
    }
    if (workflowCheckNeeded) {
      await runWorkflowTriggers(allStaff, staffHours, workflowConfigs, currentDay, weekStartStr, weekEndStr);
    }
  } catch (error) {
    console.error("[WeeklyHoursCheck] Error during check:", error);
  } finally {
    isRunning = false;
  }
}
async function runSystemAlert(allStaff, staffHours, settings, weekStartStr, weekEndStr) {
  const threshold = settings.threshold;
  const staffBelowThreshold = [];
  for (const member of allStaff) {
    const hours = staffHours.get(member.id) || { taskHours: 0, calendarHours: 0 };
    const total = settings.includeCalendarTime ? hours.taskHours + hours.calendarHours : hours.taskHours;
    if (total < threshold) {
      staffBelowThreshold.push({
        staffId: member.id,
        staffName: `${member.firstName} ${member.lastName}`,
        staffEmail: member.email || "",
        staffDepartment: member.department || "Unassigned",
        staffPosition: member.position || "Unknown",
        taskHoursLogged: Math.round(hours.taskHours * 100) / 100,
        calendarHoursLogged: Math.round(hours.calendarHours * 100) / 100,
        totalHoursLogged: Math.round(total * 100) / 100,
        managerId: member.managerId
      });
    }
  }
  if (staffBelowThreshold.length === 0) {
    console.log("[WeeklyHoursCheck] System alert: No staff below threshold");
    return;
  }
  const admins = allStaff.filter((s) => s.role === "Admin");
  const managers = allStaff.filter((s) => s.role === "Manager");
  const managerSubordinates = /* @__PURE__ */ new Map();
  for (const entry of staffBelowThreshold) {
    if (entry.managerId) {
      const existing = managerSubordinates.get(entry.managerId) || [];
      existing.push(entry);
      managerSubordinates.set(entry.managerId, existing);
    }
  }
  const weekLabel = `${formatDate(weekStartStr)} - ${formatDate(weekEndStr)}`;
  for (const [managerId, subordinates] of managerSubordinates) {
    const isAdmin = admins.some((a) => a.id === managerId);
    const isManager = managers.some((m) => m.id === managerId);
    if (!isAdmin && !isManager) continue;
    const lines = subordinates.map(
      (s) => `${s.staffName}: ${s.totalHoursLogged}h logged (${threshold}h expected)`
    );
    const message = subordinates.length === 1 ? `${subordinates[0].staffName} logged only ${subordinates[0].totalHoursLogged} hours last week (${weekLabel}). Expected: ${threshold}h.` : `${subordinates.length} team members logged under ${threshold} hours last week (${weekLabel}):
${lines.join("\n")}`;
    try {
      await db.insert(notifications).values({
        userId: managerId,
        type: "system",
        title: "Weekly Hours Alert",
        message,
        entityType: "report",
        entityId: "weekly-hours",
        priority: "high",
        actionUrl: "/reports/tasks/timesheets",
        actionText: "View Timesheets",
        metadata: {
          alertType: "weekly_hours_below_threshold",
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          threshold,
          subordinates: subordinates.map((s) => ({
            id: s.staffId,
            name: s.staffName,
            hours: s.totalHoursLogged
          }))
        }
      });
    } catch (err) {
      console.error(`[WeeklyHoursCheck] Failed to notify manager ${managerId}:`, err);
    }
  }
  for (const admin of admins) {
    const alreadyNotifiedAsManager = managerSubordinates.has(admin.id);
    const otherStaffBelowThreshold = alreadyNotifiedAsManager ? staffBelowThreshold.filter((s) => s.managerId !== admin.id) : staffBelowThreshold;
    if (otherStaffBelowThreshold.length === 0) continue;
    const lines = otherStaffBelowThreshold.map(
      (s) => `${s.staffName} (${s.staffDepartment}): ${s.totalHoursLogged}h`
    );
    const headerNote = alreadyNotifiedAsManager ? " (outside your direct reports)" : "";
    const message = `${otherStaffBelowThreshold.length} staff member(s)${headerNote} logged under ${threshold} hours last week (${weekLabel}):
${lines.slice(0, 10).join("\n")}${otherStaffBelowThreshold.length > 10 ? `
...and ${otherStaffBelowThreshold.length - 10} more` : ""}`;
    try {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "system",
        title: "Weekly Hours Alert",
        message,
        entityType: "report",
        entityId: "weekly-hours",
        priority: "high",
        actionUrl: "/reports/tasks/timesheets",
        actionText: "View Timesheets",
        metadata: {
          alertType: "weekly_hours_below_threshold",
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          threshold,
          totalBelowThreshold: staffBelowThreshold.length
        }
      });
    } catch (err) {
      console.error(`[WeeklyHoursCheck] Failed to notify admin ${admin.id}:`, err);
    }
  }
  console.log(`[WeeklyHoursCheck] System alert: Notified managers/admins about ${staffBelowThreshold.length} staff below ${threshold}h`);
}
async function runWorkflowTriggers(allStaff, staffHours, configs, currentDay, weekStartStr, weekEndStr) {
  const relevantConfigs = configs.filter((c) => c.checkDay === currentDay);
  if (relevantConfigs.length === 0) return;
  const highestThreshold = Math.max(...relevantConfigs.map((c) => c.hoursThreshold));
  const staffByManager = /* @__PURE__ */ new Map();
  for (const member of allStaff) {
    if (!member.managerId) continue;
    const hours = staffHours.get(member.id) || { taskHours: 0, calendarHours: 0 };
    const totalWithCalendar = hours.taskHours + hours.calendarHours;
    if (totalWithCalendar >= highestThreshold) continue;
    const managerId = member.managerId;
    const managerInfo = allStaff.find((s) => s.id === managerId) || null;
    if (!staffByManager.has(managerId)) {
      staffByManager.set(managerId, { manager: managerInfo, subordinates: [] });
    }
    staffByManager.get(managerId).subordinates.push({
      staffId: member.id,
      staffName: `${member.firstName} ${member.lastName}`,
      staffEmail: member.email || "",
      staffDepartment: member.department || "Unassigned",
      staffPosition: member.position || "Unknown",
      taskHoursLogged: Math.round(hours.taskHours * 100) / 100,
      calendarHoursLogged: Math.round(hours.calendarHours * 100) / 100,
      totalHoursLogged: Math.round(totalWithCalendar * 100) / 100
    });
  }
  let triggeredCount = 0;
  for (const [managerId, groupData] of staffByManager) {
    const { manager, subordinates } = groupData;
    await emitTrigger({
      type: "weekly_hours_below_threshold",
      data: {
        managerId,
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : "Unknown Manager",
        managerEmail: manager?.email || "",
        subordinatesBelowThreshold: subordinates,
        subordinateCount: subordinates.length,
        weekStartDate: weekStartStr,
        weekEndDate: weekEndStr,
        checkDay: currentDay
      },
      context: {
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          source: "weekly_hours_check_service",
          weekRange: `${weekStartStr} to ${weekEndStr}`
        }
      }
    });
    triggeredCount++;
  }
  if (triggeredCount > 0) {
    console.log(`[WeeklyHoursCheck] Workflow triggers: ${triggeredCount} manager group(s) emitted`);
  }
}
async function hasAlreadySentWeeklyAlert(weekStartStr) {
  try {
    const existing = await db.select({ id: notifications.id }).from(notifications).where(
      and(
        eq(notifications.type, "system"),
        eq(notifications.title, "Weekly Hours Alert"),
        sql`${notifications.metadata}->>'weekStart' = ${weekStartStr}`
      )
    ).limit(1);
    return existing.length > 0;
  } catch (err) {
    console.error("[WeeklyHoursCheck] Error checking existing alerts:", err);
    return false;
  }
}
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
}
export {
  startWeeklyHoursCheck,
  stopWeeklyHoursCheck
};
