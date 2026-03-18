import { db } from "./db";
import { eq, and, asc, inArray } from "drizzle-orm";
import {
  tasks,
  taskDependencies,
  clients,
  products,
  productBundles,
  bundleProducts,
  productPackages,
  packageItems,
  productTaskTemplates,
  clientTaskGenerations,
  staff,
  customFields,
} from "@shared/schema";
import { format } from "date-fns";

interface GenerationItem {
  productId?: string;
  bundleId?: string;
  packageId?: string;
  quantity: number;
}

interface GenerationParams {
  clientId: string;
  items: GenerationItem[];
  generationType: "onboarding" | "recurring";
  cycleNumber?: number;
  cycleStartDate?: Date;
}

interface GenerationSummary {
  totalTasksCreated: number;
  onboardingTasks: number;
  recurringTasks: number;
  errors: string[];
  generationIds: string[];
}

export async function generateTasksFromTemplates(
  params: GenerationParams
): Promise<GenerationSummary> {
  const {
    clientId,
    items,
    generationType,
    cycleNumber,
    cycleStartDate = new Date(),
  } = params;

  const summary: GenerationSummary = {
    totalTasksCreated: 0,
    onboardingTasks: 0,
    recurringTasks: 0,
    errors: [],
    generationIds: [],
  };

  const [clientRow] = await db
    .select({ name: clients.name, company: clients.company, website: clients.website, email: clients.email, customFieldValues: clients.customFieldValues })
    .from(clients)
    .where(eq(clients.id, clientId));

  if (!clientRow) {
    summary.errors.push(`Client ${clientId} not found`);
    return summary;
  }

  const allCustomFields = await db.select({ id: customFields.id, name: customFields.name }).from(customFields);
  const customFieldMap: Record<string, string> = {};
  if (clientRow.customFieldValues && typeof clientRow.customFieldValues === 'object') {
    const cfValues = clientRow.customFieldValues as Record<string, any>;
    for (const field of allCustomFields) {
      const key = `custom.${field.name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase()}`;
      const value = cfValues[field.id];
      if (value !== undefined && value !== null) {
        customFieldMap[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
  }

  const validStaffIds = new Set<string>();
  const activeStaff = await db.select({ id: staff.id }).from(staff).where(eq(staff.isActive, true));
  activeStaff.forEach((s) => validStaffIds.add(s.id));

  const productNameCache: Record<string, string> = {};
  const lookupProductName = async (productId: string): Promise<string> => {
    if (productNameCache[productId]) return productNameCache[productId];
    const [row] = await db.select({ name: products.name }).from(products).where(eq(products.id, productId));
    const name = row?.name || "Unknown Product";
    productNameCache[productId] = name;
    return name;
  };

  const bundleNameCache: Record<string, string> = {};
  const lookupBundleName = async (bundleId: string): Promise<string> => {
    if (bundleNameCache[bundleId]) return bundleNameCache[bundleId];
    const [row] = await db.select({ name: productBundles.name }).from(productBundles).where(eq(productBundles.id, bundleId));
    const name = row?.name || "Unknown Bundle";
    bundleNameCache[bundleId] = name;
    return name;
  };

  const packageNameCache: Record<string, string> = {};
  const lookupPackageName = async (packageId: string): Promise<string> => {
    if (packageNameCache[packageId]) return packageNameCache[packageId];
    const [row] = await db.select({ name: productPackages.name }).from(productPackages).where(eq(productPackages.id, packageId));
    const name = row?.name || "Unknown Package";
    packageNameCache[packageId] = name;
    return name;
  };

  const resolveVariables = (
    text: string | null | undefined,
    vars: Record<string, string>
  ): string => {
    if (!text) return "";
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  };

  const expandedItems: GenerationItem[] = [];
  for (const item of items) {
    expandedItems.push(item);

    if (item.bundleId) {
      const bps = await db
        .select({ productId: bundleProducts.productId, quantity: bundleProducts.quantity })
        .from(bundleProducts)
        .where(eq(bundleProducts.bundleId, item.bundleId));
      for (const bp of bps) {
        expandedItems.push({ productId: bp.productId, quantity: bp.quantity || 1 });
      }
    }

    if (item.packageId) {
      const pkgItems = await db
        .select()
        .from(packageItems)
        .where(eq(packageItems.packageId, item.packageId));
      for (const pi of pkgItems) {
        if (pi.itemType === "product" && pi.productId) {
          expandedItems.push({ productId: pi.productId, quantity: pi.quantity || 1 });
        } else if (pi.itemType === "bundle" && pi.bundleId) {
          expandedItems.push({ bundleId: pi.bundleId, quantity: pi.quantity || 1 });
          const bps = await db
            .select({ productId: bundleProducts.productId, quantity: bundleProducts.quantity })
            .from(bundleProducts)
            .where(eq(bundleProducts.bundleId, pi.bundleId));
          for (const bp of bps) {
            expandedItems.push({ productId: bp.productId, quantity: bp.quantity || 1 });
          }
        }
      }
    }
  }

  const processedKeys = new Set<string>();

  for (const item of expandedItems) {
    const dedupeKey = `${item.productId || ''}_${item.bundleId || ''}_${item.packageId || ''}`;
    if (processedKeys.has(dedupeKey)) continue;
    processedKeys.add(dedupeKey);

    try {
      const conditions: any[] = [
        eq(productTaskTemplates.taskType, generationType),
        eq(productTaskTemplates.status, "active"),
      ];

      if (item.productId) {
        conditions.push(eq(productTaskTemplates.productId, item.productId));
      } else if (item.bundleId) {
        conditions.push(eq(productTaskTemplates.bundleId, item.bundleId));
      } else if (item.packageId) {
        conditions.push(eq(productTaskTemplates.packageId, item.packageId));
      } else {
        continue;
      }

      const itemIdConditions: any[] = [
        eq(clientTaskGenerations.clientId, clientId),
        eq(clientTaskGenerations.generationType, generationType),
      ];
      if (item.productId) itemIdConditions.push(eq(clientTaskGenerations.productId, item.productId));
      else if (item.bundleId) itemIdConditions.push(eq(clientTaskGenerations.bundleId, item.bundleId));
      else if (item.packageId) itemIdConditions.push(eq(clientTaskGenerations.packageId, item.packageId));

      if (cycleNumber !== undefined) {
        itemIdConditions.push(eq(clientTaskGenerations.cycleNumber, cycleNumber));
      }

      const existingGeneration = await db
        .select({ id: clientTaskGenerations.id })
        .from(clientTaskGenerations)
        .where(and(...itemIdConditions))
        .limit(1);

      if (existingGeneration.length > 0) {
        const itemDesc = item.productId || item.bundleId || item.packageId || "unknown";
        console.log(`[TaskGen] Skipping item ${itemDesc} — already generated for this ${generationType}${cycleNumber ? ` cycle ${cycleNumber}` : ''}`);
        continue;
      }

      const templates = await db
        .select()
        .from(productTaskTemplates)
        .where(and(...conditions))
        .orderBy(asc(productTaskTemplates.sortOrder));

      if (templates.length === 0) continue;

      let itemName = "Unknown";
      if (item.productId) itemName = await lookupProductName(item.productId);
      else if (item.bundleId) itemName = await lookupBundleName(item.bundleId);
      else if (item.packageId) itemName = await lookupPackageName(item.packageId);

      const templateToTaskIds: Record<string, string[]> = {};
      const templateToFirstTaskId: Record<string, string> = {};

      for (const template of templates) {
        try {
          const taskCount =
            template.quantityMode === "once" ? 1 : Math.max(1, item.quantity || 1);

          const createdTaskIds: string[] = [];

          for (let unitNum = 1; unitNum <= taskCount; unitNum++) {
            const dueDate = new Date();
            dueDate.setHours(0, 0, 0, 0);
            dueDate.setDate(dueDate.getDate() + (template.dueDateOffset ?? 7));

            let taskTitle = template.name;
            if (template.quantityMode === "per_unit_named") {
              taskTitle = `${template.name} ${unitNum} of ${item.quantity}`;
            }

            const vars: Record<string, string> = {
              "client.name": clientRow.company || clientRow.name,
              "client.email": clientRow.email || "",
              "client.domain": clientRow.website || "",
              "product.name": itemName,
              quantity: String(item.quantity),
              "cycle.number": String(cycleNumber || 1),
              "cycle.startDate": format(cycleStartDate, "yyyy-MM-dd"),
              "unit.number": String(unitNum),
              "unit.total": String(item.quantity),
              ...customFieldMap,
            };

            const resolvedTitle = resolveVariables(taskTitle, vars);
            const resolvedDescription = resolveVariables(
              template.description,
              vars
            );

            let assignedTo = template.assignedStaffId || null;
            if (assignedTo && !validStaffIds.has(assignedTo)) {
              console.warn(
                `[TaskGen] Template ${template.id} references inactive/deleted staff ${assignedTo}, creating unassigned`
              );
              summary.errors.push(`Template "${template.name}" references inactive staff — task created unassigned`);
              assignedTo = null;
            }

            const priorityMap: Record<string, string> = {
              low: "low",
              medium: "normal",
              high: "high",
              urgent: "urgent",
            };

            const [newTask] = await db
              .insert(tasks)
              .values({
                title: resolvedTitle,
                description: resolvedDescription || undefined,
                status: "todo",
                priority: priorityMap[template.priority || "medium"] || "normal",
                assignedTo: assignedTo as any,
                clientId,
                categoryId: template.categoryId || template.departmentId || undefined,
                workflowId: template.workflowId || undefined,
                dueDate: dueDate,
                timeEstimate: template.estimatedHours
                  ? Math.round(parseFloat(template.estimatedHours) * 60)
                  : undefined,
                sourceTemplateId: template.id,
              })
              .returning({ id: tasks.id });

            createdTaskIds.push(newTask.id);
            summary.totalTasksCreated++;

            if (generationType === "onboarding") {
              summary.onboardingTasks++;
            } else {
              summary.recurringTasks++;
            }
          }

          templateToTaskIds[template.id] = createdTaskIds;
          if (createdTaskIds.length > 0) {
            templateToFirstTaskId[template.id] = createdTaskIds[0];
          }
        } catch (taskError: any) {
          summary.errors.push(
            `Failed to create tasks for template "${template.name}": ${taskError.message}`
          );
        }
      }

      for (const template of templates) {
        if (
          template.dependsOnTemplateId &&
          templateToFirstTaskId[template.dependsOnTemplateId]
        ) {
          const dependsOnTaskId =
            templateToFirstTaskId[template.dependsOnTemplateId];
          const tasksForThisTemplate = templateToTaskIds[template.id] || [];

          for (const taskId of tasksForThisTemplate) {
            try {
              await db.insert(taskDependencies).values({
                taskId,
                dependsOnTaskId,
                dependencyType: "finish_to_start",
              });
            } catch (depError: any) {
              summary.errors.push(
                `Failed to set dependency for template "${template.name}": ${depError.message}`
              );
            }
          }
        }
      }

      for (const template of templates) {
        const taskIds = templateToTaskIds[template.id];
        if (!taskIds || taskIds.length === 0) continue;

        try {
          const [genRecord] = await db
            .insert(clientTaskGenerations)
            .values({
              clientId,
              productId: item.productId || null,
              bundleId: item.bundleId || null,
              packageId: item.packageId || null,
              templateId: template.id,
              generationType,
              cycleNumber: cycleNumber || null,
              cycleStartDate,
              taskIds: taskIds,
            })
            .returning({ id: clientTaskGenerations.id });

          summary.generationIds.push(genRecord.id);

          await db
            .update(tasks)
            .set({ generationId: genRecord.id })
            .where(inArray(tasks.id, taskIds));
        } catch (genError: any) {
          summary.errors.push(
            `Failed to create generation record for template "${template.name}": ${genError.message}`
          );
        }
      }
    } catch (itemError: any) {
      const itemDesc = item.productId || item.bundleId || item.packageId || "unknown";
      summary.errors.push(
        `Failed to process item ${itemDesc}: ${itemError.message}`
      );
    }
  }

  return summary;
}
