import { db } from "./db";
import { eq, and, isNotNull } from "drizzle-orm";
import {
  clientRecurringConfig,
  clientProducts,
  clientBundles,
  clientPackages,
  clientTaskGenerations,
  clients,
  taskSettings,
} from "@shared/schema";
import { generateTasksFromTemplates } from "./taskGenerationEngine";

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 2 * 60 * 1000;
let checkIntervalId: NodeJS.Timeout | null = null;
let isRunning = false;

export function startRecurringTaskService() {
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

  console.log(`[RecurringTasks] Scheduled to run every 24 hours (initial run in ${INITIAL_DELAY_MS / 1000}s)`);
}

export function stopRecurringTaskService() {
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
    const [killSwitchSetting] = await db.select().from(taskSettings)
      .where(eq(taskSettings.settingKey, 'task_mapping_enable_recurring_generation'));
    const recurringEnabled = (killSwitchSetting?.settingValue as any)?.value ?? true;
    if (!recurringEnabled) {
      console.log("[RecurringTasks] Recurring task generation is disabled via settings — skipping");
      return;
    }

    const configs = await db
      .select()
      .from(clientRecurringConfig)
      .where(eq(clientRecurringConfig.status, "active"));

    if (configs.length === 0) {
      console.log("[RecurringTasks] No active recurring configs found");
      return;
    }

    const today = new Date();
    let totalGenerated = 0;
    let clientsProcessed = 0;

    console.log(`[RecurringTasks] Evaluating ${configs.length} active configs...`);

    for (const config of configs) {
      try {
        if (!config.cycleStartDate) {
          console.log(`[RecurringTasks] Client ${config.clientId}: skipped — no cycleStartDate`);
          continue;
        }

        const cycleStartMs = new Date(config.cycleStartDate).getTime();
        const cycleLengthMs = (config.cycleLengthDays || 30) * 24 * 60 * 60 * 1000;
        const elapsedMs = today.getTime() - cycleStartMs;

        if (elapsedMs < 0) {
          console.log(`[RecurringTasks] Client ${config.clientId}: skipped — cycleStartDate is in the future`);
          continue;
        }

        const currentCycleNumber = Math.floor(elapsedMs / cycleLengthMs) + 1;
        const lastGenerated = config.lastGeneratedCycle || 0;

        if (lastGenerated >= currentCycleNumber) {
          console.log(`[RecurringTasks] Client ${config.clientId}: skipped — already generated cycle ${lastGenerated} (current cycle: ${currentCycleNumber})`);
          continue;
        }

        const nextCycleToGenerate = lastGenerated + 1;
        const nextCycleStartDate = new Date(cycleStartMs + (nextCycleToGenerate - 1) * cycleLengthMs);
        const advanceDays = config.advanceGenerationDays || 3;
        const generateByDate = new Date(nextCycleStartDate.getTime() - advanceDays * 24 * 60 * 60 * 1000);

        if (today < generateByDate) {
          console.log(`[RecurringTasks] Client ${config.clientId}: skipped — too early for advance window (generate by: ${generateByDate.toISOString().slice(0,10)}, next cycle: ${nextCycleStartDate.toISOString().slice(0,10)})`);
          continue;
        }

        const existingGenerations = await db
          .select({ id: clientTaskGenerations.id })
          .from(clientTaskGenerations)
          .where(
            and(
              eq(clientTaskGenerations.clientId, config.clientId),
              eq(clientTaskGenerations.generationType, "recurring"),
              eq(clientTaskGenerations.cycleNumber, nextCycleToGenerate)
            )
          )
          .limit(1);

        if (existingGenerations.length > 0) {
          console.log(`[RecurringTasks] Client ${config.clientId}: skipped — generation record already exists for cycle ${nextCycleToGenerate}, syncing lastGeneratedCycle`);
          await db
            .update(clientRecurringConfig)
            .set({ lastGeneratedCycle: nextCycleToGenerate, updatedAt: new Date() })
            .where(eq(clientRecurringConfig.id, config.id));
          continue;
        }

        const assignedProducts = await db
          .select({ productId: clientProducts.productId })
          .from(clientProducts)
          .where(eq(clientProducts.clientId, config.clientId));

        const assignedBundles = await db
          .select({ bundleId: clientBundles.bundleId })
          .from(clientBundles)
          .where(eq(clientBundles.clientId, config.clientId));

        const assignedPkgs = await db
          .select({ packageId: clientPackages.packageId })
          .from(clientPackages)
          .where(eq(clientPackages.clientId, config.clientId));

        const items: Array<{ productId?: string; bundleId?: string; packageId?: string; quantity: number }> = [];
        for (const cp of assignedProducts) items.push({ productId: cp.productId, quantity: 1 });
        for (const cb of assignedBundles) items.push({ bundleId: cb.bundleId, quantity: 1 });
        for (const cpkg of assignedPkgs) items.push({ packageId: cpkg.packageId, quantity: 1 });

        if (items.length === 0) {
          console.log(`[RecurringTasks] Client ${config.clientId}: skipped — no products/bundles/packages assigned`);
          continue;
        }

        const [clientRow] = await db
          .select({ name: clients.name, company: clients.company })
          .from(clients)
          .where(eq(clients.id, config.clientId));
        const clientName = clientRow?.company || clientRow?.name || config.clientId;

        const summary = await generateTasksFromTemplates({
          clientId: config.clientId,
          items,
          generationType: "recurring",
          cycleNumber: nextCycleToGenerate,
          cycleStartDate: nextCycleStartDate,
        });

        await db
          .update(clientRecurringConfig)
          .set({ lastGeneratedCycle: nextCycleToGenerate, updatedAt: new Date() })
          .where(eq(clientRecurringConfig.id, config.id));

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
      } catch (clientError: any) {
        const [clientRow] = await db
          .select({ name: clients.name, company: clients.company })
          .from(clients)
          .where(eq(clients.id, config.clientId))
          .catch(() => [{ name: config.clientId, company: null }] as any);
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

    await processOnboardingWeekReleases();
  } catch (error: any) {
    console.error("[RecurringTasks] Fatal error during check:", error.message);
  } finally {
    isRunning = false;
  }
}

async function processOnboardingWeekReleases() {
  console.log("[OnboardingWeeks] Starting onboarding week release check...");

  try {
    const onboardingClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        company: clients.company,
        onboardingStartDate: clients.onboardingStartDate,
        onboardingWeekReleased: clients.onboardingWeekReleased,
      })
      .from(clients)
      .where(isNotNull(clients.onboardingStartDate));

    if (onboardingClients.length === 0) {
      console.log("[OnboardingWeeks] No clients with onboarding start dates found");
      return;
    }

    let totalReleased = 0;
    let clientsAdvanced = 0;

    for (const client of onboardingClients) {
      try {
        const startDate = new Date(client.onboardingStartDate!);
        const daysSinceStart = Math.floor(
          (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentWeek = Math.floor(daysSinceStart / 7) + 1;
        const alreadyReleased = client.onboardingWeekReleased ?? 0;

        if (currentWeek <= alreadyReleased) continue;

        const clientName = client.company || client.name || client.id;

        const assignedProducts = await db
          .select({ productId: clientProducts.productId })
          .from(clientProducts)
          .where(eq(clientProducts.clientId, client.id));

        const assignedBundles = await db
          .select({ bundleId: clientBundles.bundleId })
          .from(clientBundles)
          .where(eq(clientBundles.clientId, client.id));

        const assignedPkgs = await db
          .select({ packageId: clientPackages.packageId })
          .from(clientPackages)
          .where(eq(clientPackages.clientId, client.id));

        const items: Array<{ productId?: string; bundleId?: string; packageId?: string; quantity: number }> = [];
        for (const cp of assignedProducts) items.push({ productId: cp.productId, quantity: 1 });
        for (const cb of assignedBundles) items.push({ bundleId: cb.bundleId, quantity: 1 });
        for (const cpkg of assignedPkgs) items.push({ packageId: cpkg.packageId, quantity: 1 });

        if (items.length === 0) continue;

        for (let week = alreadyReleased + 1; week <= currentWeek; week++) {
          const summary = await generateTasksFromTemplates({
            clientId: client.id,
            items,
            generationType: "onboarding",
            cycleStartDate: startDate,
            targetWeek: week,
          });

          totalReleased += summary.totalTasksCreated;

          if (summary.totalTasksCreated > 0) {
            console.log(
              `[OnboardingWeeks] Released ${summary.totalTasksCreated} week-${week} onboarding tasks for client ${clientName}`
            );
          }

          if (summary.errors.length > 0) {
            console.warn(
              `[OnboardingWeeks] Warnings for client ${clientName}, week ${week}:`,
              summary.errors
            );
          }
        }

        await db
          .update(clients)
          .set({ onboardingWeekReleased: currentWeek })
          .where(eq(clients.id, client.id));

        clientsAdvanced++;
      } catch (clientError: any) {
        const clientName = client.company || client.name || client.id;
        console.error(
          `[OnboardingWeeks] Failed to process onboarding weeks for client ${clientName}:`,
          clientError.message
        );
      }
    }

    console.log(
      `[OnboardingWeeks] Check complete. ${clientsAdvanced} clients advanced, ${totalReleased} onboarding tasks released.`
    );
  } catch (error: any) {
    console.error("[OnboardingWeeks] Fatal error during onboarding week check:", error.message);
  }
}
