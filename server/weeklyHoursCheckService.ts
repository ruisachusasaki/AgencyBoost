import { db } from "./db";
import { staff, enhancedTasks, eventTimeEntries, workflows } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { emitTrigger } from "./workflow-engine";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
let checkIntervalId: NodeJS.Timeout | null = null;
let isRunning = false;

export function startWeeklyHoursCheck() {
  if (checkIntervalId) {
    console.log("[WeeklyHoursCheck] Already running");
    return;
  }

  console.log("[WeeklyHoursCheck] Starting weekly hours check service");

  setTimeout(() => {
    runWeeklyHoursCheck().catch((err) => {
      console.error("[WeeklyHoursCheck] Initial check error:", err);
    });
  }, 30000);

  checkIntervalId = setInterval(() => {
    runWeeklyHoursCheck().catch((err) => {
      console.error("[WeeklyHoursCheck] Check interval error:", err);
    });
  }, CHECK_INTERVAL_MS);

  console.log(`[WeeklyHoursCheck] Scheduled to run every ${CHECK_INTERVAL_MS / 1000 / 60} minutes`);
}

export function stopWeeklyHoursCheck() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log("[WeeklyHoursCheck] Stopped weekly hours check service");
  }
}

interface WorkflowHoursConfig {
  hoursThreshold: number;
  checkDay: string;
  includeCalendarTime: boolean;
  staffFilter: string;
  department?: string;
}

function extractHoursConfigs(activeWorkflows: any[]): WorkflowHoursConfig[] {
  const configs: WorkflowHoursConfig[] = [];

  for (const w of activeWorkflows) {
    try {
      const triggers = (w.triggers as any[]) || [];
      for (const t of triggers) {
        if (t.type === "weekly_hours_below_threshold") {
          const config = t.config || {};
          configs.push({
            hoursThreshold: parseFloat(config.hours_threshold) || 40,
            checkDay: config.check_day || "Monday",
            includeCalendarTime: config.include_calendar_time !== false,
            staffFilter: config.staff_filter || "my_direct_reports",
            department: config.department || undefined,
          });
        }
      }
    } catch {
    }
  }

  return configs;
}

interface StaffMemberInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  department: string | null;
  position: string | null;
  managerId: string | null;
  isActive: boolean | null;
}

interface StaffHoursData {
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffDepartment: string;
  staffPosition: string;
  taskHoursLogged: number;
  calendarHoursLogged: number;
  totalHoursLogged: number;
}

async function runWeeklyHoursCheck() {
  if (isRunning) {
    console.log("[WeeklyHoursCheck] Already running a check, skipping");
    return;
  }

  isRunning = true;

  try {
    const activeWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.status, "active"));

    const configs = extractHoursConfigs(activeWorkflows);

    if (configs.length === 0) {
      return;
    }

    console.log(`[WeeklyHoursCheck] Found ${configs.length} active workflow trigger(s) for weekly hours`);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[dayOfWeek];
    const currentHour = now.getHours();

    const relevantConfigs = configs.filter((c) => c.checkDay === currentDay);
    if (relevantConfigs.length === 0) {
      console.log(`[WeeklyHoursCheck] No workflows configured to check on ${currentDay}, skipping`);
      return;
    }

    if (currentHour < 6 || currentHour > 10) {
      console.log(`[WeeklyHoursCheck] Outside check window (hour: ${currentHour}, need 6-10), skipping`);
      return;
    }

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
    weekEnd.setHours(0, 0, 0, 0);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    console.log(`[WeeklyHoursCheck] Checking hours for week: ${weekStartStr} to ${weekEndStr}`);

    const allStaff = await db
      .select({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        department: staff.department,
        position: staff.position,
        managerId: staff.managerId,
        isActive: staff.isActive,
      })
      .from(staff)
      .where(eq(staff.isActive, true));

    const staffHours: Map<string, { taskHours: number; calendarHours: number }> = new Map();

    const tasksWithTime = await db
      .select({
        id: enhancedTasks.id,
        title: enhancedTasks.title,
        timeEntries: enhancedTasks.timeEntries,
      })
      .from(enhancedTasks)
      .where(
        and(
          sql`${enhancedTasks.timeEntries} IS NOT NULL`,
          sql`${enhancedTasks.timeEntries}::text != 'null'`,
          sql`${enhancedTasks.timeEntries}::text != '[]'`
        )
      );

    for (const task of tasksWithTime) {
      const entries = (task.timeEntries as any[]) || [];
      for (const entry of entries) {
        if (!entry.startTime || !entry.userId) continue;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        if (entryDate >= weekStartStr && entryDate < weekEndStr) {
          const existing = staffHours.get(entry.userId) || { taskHours: 0, calendarHours: 0 };
          const durationMinutes =
            entry.duration ||
            (entry.endTime
              ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 60000
              : 0);
          existing.taskHours += durationMinutes / 60;
          staffHours.set(entry.userId, existing);
        }
      }
    }

    const calendarEntries = await db
      .select({
        userId: eventTimeEntries.userId,
        duration: eventTimeEntries.duration,
        startTime: eventTimeEntries.startTime,
      })
      .from(eventTimeEntries)
      .where(
        and(
          gte(eventTimeEntries.startTime, new Date(weekStartStr)),
          lte(eventTimeEntries.startTime, new Date(weekEndStr))
        )
      );

    for (const entry of calendarEntries) {
      const existing = staffHours.get(entry.userId) || { taskHours: 0, calendarHours: 0 };
      existing.calendarHours += (entry.duration || 0) / 60;
      staffHours.set(entry.userId, existing);
    }

    const highestThreshold = Math.max(...relevantConfigs.map((c) => c.hoursThreshold));

    const staffByManager: Map<string, {
      manager: StaffMemberInfo | null;
      subordinates: StaffHoursData[];
    }> = new Map();

    for (const staffMember of allStaff) {
      if (!staffMember.managerId) {
        continue;
      }

      const hours = staffHours.get(staffMember.id) || { taskHours: 0, calendarHours: 0 };
      const totalWithCalendar = hours.taskHours + hours.calendarHours;

      if (totalWithCalendar >= highestThreshold) {
        continue;
      }

      const managerId = staffMember.managerId;
      const managerInfo = allStaff.find((s) => s.id === managerId) || null;

      if (!staffByManager.has(managerId)) {
        staffByManager.set(managerId, {
          manager: managerInfo,
          subordinates: [],
        });
      }

      staffByManager.get(managerId)!.subordinates.push({
        staffId: staffMember.id,
        staffName: `${staffMember.firstName} ${staffMember.lastName}`,
        staffEmail: staffMember.email || "",
        staffDepartment: staffMember.department || "Unassigned",
        staffPosition: staffMember.position || "Unknown",
        taskHoursLogged: Math.round(hours.taskHours * 100) / 100,
        calendarHoursLogged: Math.round(hours.calendarHours * 100) / 100,
        totalHoursLogged: Math.round(totalWithCalendar * 100) / 100,
      });
    }

    let triggeredCount = 0;
    for (const [managerId, groupData] of staffByManager) {
      const { manager, subordinates } = groupData;

      await emitTrigger({
        type: "weekly_hours_below_threshold",
        data: {
          managerId,
          managerName: manager
            ? `${manager.firstName} ${manager.lastName}`
            : "Unknown Manager",
          managerEmail: manager?.email || "",
          subordinatesBelowThreshold: subordinates,
          subordinateCount: subordinates.length,
          weekStartDate: weekStartStr,
          weekEndDate: weekEndStr,
          checkDay: currentDay,
        },
        context: {
          timestamp: new Date(),
          metadata: {
            source: "weekly_hours_check_service",
            weekRange: `${weekStartStr} to ${weekEndStr}`,
          },
        },
      });
      triggeredCount++;
    }

    console.log(
      `[WeeklyHoursCheck] Completed check - ${triggeredCount} manager group(s) emitted`
    );
  } catch (error) {
    console.error("[WeeklyHoursCheck] Error during check:", error);
  } finally {
    isRunning = false;
  }
}
