import {
  generateTasksFromTemplates
} from "./chunk-VLPI6OSY.js";
import {
  db
} from "./chunk-KPQ6KEVY.js";
import {
  clientBundles,
  clientPackages,
  clientProducts,
  clientRecurringConfig,
  clientTaskGenerations,
  clients,
  taskSettings
} from "./chunk-VCTCMHMP.js";
import "./chunk-R5U7XKVJ.js";

// server/recurringTaskService.ts
import { eq, and } from "drizzle-orm";
var CHECK_INTERVAL_MS = 24 * 60 * 60 * 1e3;
var INITIAL_DELAY_MS = 2 * 60 * 1e3;
var checkIntervalId = null;
var isRunning = false;
function startRecurringTaskService() {
  if (checkIntervalId) {
    console.log("[RecurringTasks] Already running");
    return;
  }
  console.log("[RecurringTasks] Starting recurring task generation service");
  setTimeout(() => {
    runRecurringTaskCheck().catch((err) => {
      console.error("[RecurringTasks] Initial check error:", err);
    });
  }, INITIAL_DELAY_MS);
  checkIntervalId = setInterval(() => {
    runRecurringTaskCheck().catch((err) => {
      console.error("[RecurringTasks] Check interval error:", err);
    });
  }, CHECK_INTERVAL_MS);
  console.log(`[RecurringTasks] Scheduled to run every 24 hours (initial run in ${INITIAL_DELAY_MS / 1e3}s)`);
}
function stopRecurringTaskService() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log("[RecurringTasks] Stopped recurring task generation service");
  }
}
async function runRecurringTaskCheck() {
  if (isRunning) {
    console.log("[RecurringTasks] Previous check still running, skipping");
    return;
  }
  isRunning = true;
  console.log("[RecurringTasks] Starting recurring task check...");
  try {
    const [killSwitchSetting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, "task_mapping_enable_recurring_generation"));
    const recurringEnabled = killSwitchSetting?.settingValue?.value ?? true;
    if (!recurringEnabled) {
      console.log("[RecurringTasks] Recurring task generation is disabled via settings \u2014 skipping");
      return;
    }
    const configs = await db.select().from(clientRecurringConfig).where(eq(clientRecurringConfig.status, "active"));
    if (configs.length === 0) {
      console.log("[RecurringTasks] No active recurring configs found");
      return;
    }
    const today = /* @__PURE__ */ new Date();
    let totalGenerated = 0;
    let clientsProcessed = 0;
    for (const config of configs) {
      try {
        if (!config.cycleStartDate) {
          continue;
        }
        const cycleStartMs = new Date(config.cycleStartDate).getTime();
        const cycleLengthMs = (config.cycleLengthDays || 30) * 24 * 60 * 60 * 1e3;
        const elapsedMs = today.getTime() - cycleStartMs;
        if (elapsedMs < 0) continue;
        const currentCycleNumber = Math.floor(elapsedMs / cycleLengthMs) + 1;
        const lastGenerated = config.lastGeneratedCycle || 0;
        if (lastGenerated >= currentCycleNumber) continue;
        const nextCycleToGenerate = lastGenerated + 1;
        const nextCycleStartDate = new Date(cycleStartMs + (nextCycleToGenerate - 1) * cycleLengthMs);
        const advanceDays = config.advanceGenerationDays || 3;
        const generateByDate = new Date(nextCycleStartDate.getTime() - advanceDays * 24 * 60 * 60 * 1e3);
        if (today < generateByDate) continue;
        const existingGenerations = await db.select({ id: clientTaskGenerations.id }).from(clientTaskGenerations).where(
          and(
            eq(clientTaskGenerations.clientId, config.clientId),
            eq(clientTaskGenerations.generationType, "recurring"),
            eq(clientTaskGenerations.cycleNumber, nextCycleToGenerate)
          )
        ).limit(1);
        if (existingGenerations.length > 0) {
          await db.update(clientRecurringConfig).set({ lastGeneratedCycle: nextCycleToGenerate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientRecurringConfig.id, config.id));
          continue;
        }
        const assignedProducts = await db.select({ productId: clientProducts.productId }).from(clientProducts).where(eq(clientProducts.clientId, config.clientId));
        const assignedBundles = await db.select({ bundleId: clientBundles.bundleId }).from(clientBundles).where(eq(clientBundles.clientId, config.clientId));
        const assignedPkgs = await db.select({ packageId: clientPackages.packageId }).from(clientPackages).where(eq(clientPackages.clientId, config.clientId));
        const items = [];
        for (const cp of assignedProducts) items.push({ productId: cp.productId, quantity: 1 });
        for (const cb of assignedBundles) items.push({ bundleId: cb.bundleId, quantity: 1 });
        for (const cpkg of assignedPkgs) items.push({ packageId: cpkg.packageId, quantity: 1 });
        if (items.length === 0) continue;
        const [clientRow] = await db.select({ name: clients.name, company: clients.company }).from(clients).where(eq(clients.id, config.clientId));
        const clientName = clientRow?.company || clientRow?.name || config.clientId;
        const summary = await generateTasksFromTemplates({
          clientId: config.clientId,
          items,
          generationType: "recurring",
          cycleNumber: nextCycleToGenerate,
          cycleStartDate: nextCycleStartDate
        });
        await db.update(clientRecurringConfig).set({ lastGeneratedCycle: nextCycleToGenerate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientRecurringConfig.id, config.id));
        totalGenerated += summary.totalTasksCreated;
        clientsProcessed++;
        if (summary.totalTasksCreated > 0) {
          console.log(
            `[RecurringTasks] Generated ${summary.totalTasksCreated} recurring tasks for client ${clientName}, cycle ${nextCycleToGenerate}`
          );
        }
        if (summary.errors.length > 0) {
          console.warn(
            `[RecurringTasks] Warnings for client ${clientName}, cycle ${nextCycleToGenerate}:`,
            summary.errors
          );
        }
      } catch (clientError) {
        const [clientRow] = await db.select({ name: clients.name, company: clients.company }).from(clients).where(eq(clients.id, config.clientId)).catch(() => [{ name: config.clientId, company: null }]);
        const clientName = clientRow?.company || clientRow?.name || config.clientId;
        console.error(
          `[RecurringTasks] Failed to generate recurring tasks for client ${clientName}:`,
          clientError.message
        );
      }
    }
    console.log(
      `[RecurringTasks] Check complete. ${clientsProcessed} clients processed, ${totalGenerated} tasks generated.`
    );
  } catch (error) {
    console.error("[RecurringTasks] Fatal error during check:", error.message);
  } finally {
    isRunning = false;
  }
}
export {
  startRecurringTaskService,
  stopRecurringTaskService
};
