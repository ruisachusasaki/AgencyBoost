import { db } from "../db";
import {
  leads,
  clients,
  quotes,
  quoteItems,
  deals,
  clientProducts,
  clientBundles,
  clientPackages,
  packageItems,
  bundleProducts,
  leadPipelineStages,
  taskSettings,
  clientRecurringConfig,
  staff,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateTasksFromTemplates } from "../taskGenerationEngine";

type ConversionTrigger = "online_proposal" | "manual" | "ach_signing";

interface ConversionResult {
  success: true;
  clientId: string;
  alreadyConverted: boolean;
  quoteId?: string | null;
}

export async function convertLeadToClient(
  leadId: string,
  triggeredBy: ConversionTrigger,
  options?: { quoteId?: string }
): Promise<ConversionResult> {
  console.log(`[LeadConversion] Starting conversion for lead ${leadId} (trigger: ${triggeredBy})`);

  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  console.log(`[LeadConversion] Lead found: "${lead.name}" (email: ${lead.email}, assignedTo: ${lead.assignedTo}, isConverted: ${lead.isConverted}, clientId: ${lead.clientId})`);

  if (lead.isConverted && lead.clientId) {
    console.log(`[LeadConversion] Path 1: Lead already converted → clientId=${lead.clientId}`);
    return { success: true, clientId: lead.clientId, alreadyConverted: true };
  }

  const existingClient = await db
    .select()
    .from(clients)
    .where(eq(clients.email, lead.email))
    .limit(1);

  if (existingClient.length > 0) {
    console.log(`[LeadConversion] Path 2: Existing client found by email "${lead.email}" → clientId=${existingClient[0].id}, name="${existingClient[0].name}"`);
    await db
      .update(leads)
      .set({
        isConverted: true,
        convertedAt: new Date(),
        clientId: existingClient[0].id,
        convertedBy: triggeredBy,
        status: "Won",
      })
      .where(eq(leads.id, leadId));

    return { success: true, clientId: existingClient[0].id, alreadyConverted: true };
  }

  console.log(`[LeadConversion] Path 3: No existing client found, creating new client via transaction`);

  const result = await db.transaction(async (tx) => {
    const [client] = await tx
      .insert(clients)
      .values({
        id: randomUUID(),
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        company: lead.company || null,
        status: "active",
        contactType: "client",
        contactSource: lead.source || null,
        contactOwner: lead.assignedTo || null,
        notes: lead.notes || null,
        tags: lead.tags || [],
        createdAt: new Date(),
      })
      .returning();

    console.log(`[LeadConversion] Client created: ${client.id} ("${client.name}")`);

    let quote = null;
    if (options?.quoteId) {
      const [selected] = await tx
        .select()
        .from(quotes)
        .where(eq(quotes.id, options.quoteId))
        .limit(1);
      quote = selected || null;
    } else {
      const acceptedQuotes = await tx
        .select()
        .from(quotes)
        .where(
          and(
            eq(quotes.leadId, leadId),
            sql`${quotes.status} IN ('accepted', 'signed', 'completed')`
          )
        )
        .orderBy(desc(quotes.createdAt))
        .limit(1);
      quote = acceptedQuotes.length > 0 ? acceptedQuotes[0] : null;
    }

    console.log(`[LeadConversion] Quote lookup result: ${quote ? `found quote ${quote.id} (status: ${quote.status})` : 'no qualifying quote found'}`);

    if (quote) {
      if (quote.status !== "accepted") {
        await tx
          .update(quotes)
          .set({ status: "accepted" })
          .where(eq(quotes.id, quote.id));
      }

      await tx
        .update(quotes)
        .set({ clientId: client.id })
        .where(eq(quotes.id, quote.id));

      const existingDeal = await tx
        .select()
        .from(deals)
        .where(eq(deals.leadId, leadId))
        .limit(1);

      if (existingDeal.length === 0) {
        let dealAssignedTo = lead.assignedTo;
        if (!dealAssignedTo) {
          const [firstStaff] = await tx
            .select({ id: staff.id })
            .from(staff)
            .where(eq(staff.role, "admin"))
            .limit(1);
          dealAssignedTo = firstStaff?.id || null;
          console.log(`[LeadConversion] Lead has no assignedTo, using fallback staff: ${dealAssignedTo}`);
        }

        if (dealAssignedTo) {
          const dealValue = quote.totalCost || lead.value || "0";
          const dealData = {
            leadId: leadId,
            clientId: client.id,
            name: `${client.name || lead.name} - ${lead.company || "Deal"}`,
            assignedTo: dealAssignedTo,
            value: dealValue,
            mrr: "0",
            wonDate: new Date(),
            notes: `Deal created from quote #${quote.id}. Total value: $${dealValue}`,
          };

          await tx.insert(deals).values(dealData);
          console.log(
            `✅ [LeadConversion] Created deal for client ${client.id} from quote ${quote.id}`
          );
        } else {
          console.warn(`⚠️ [LeadConversion] Skipped deal creation: no assignedTo available for lead ${leadId}`);
        }
      }

      const items = await tx
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, quote.id));

      console.log(`[LeadConversion] Found ${items.length} quote items to transfer`);

      let transferredCount = 0;

      for (const item of items) {
        console.log(`[LeadConversion] Processing item: type=${item.itemType}, productId=${item.productId}, bundleId=${item.bundleId}, packageId=${item.packageId}, qty=${item.quantity}, customQuantities=${JSON.stringify(item.customQuantities)}`);

        if (item.itemType === "product" && item.productId) {
          const existing = await tx
            .select()
            .from(clientProducts)
            .where(
              and(
                eq(clientProducts.clientId, client.id),
                eq(clientProducts.productId, item.productId)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            await tx.insert(clientProducts).values({
              clientId: client.id,
              productId: item.productId,
            });
            transferredCount++;
          }
        } else if (item.itemType === "bundle" && item.bundleId) {
          const existing = await tx
            .select()
            .from(clientBundles)
            .where(
              and(
                eq(clientBundles.clientId, client.id),
                eq(clientBundles.bundleId, item.bundleId)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            let bundleCustomQtys = item.customQuantities as Record<string, number> | null;
            
            const bps = await tx
              .select({ productId: bundleProducts.productId, quantity: bundleProducts.quantity })
              .from(bundleProducts)
              .where(eq(bundleProducts.bundleId, item.bundleId));
            
            const normalizedQtys: Record<string, number> = {};
            for (const bp of bps) {
              normalizedQtys[bp.productId] = bundleCustomQtys?.[bp.productId] ?? bp.quantity ?? 1;
            }
            bundleCustomQtys = Object.keys(normalizedQtys).length > 0 ? normalizedQtys : null;
            console.log(`[LeadConversion] Inserting client bundle ${item.bundleId} with normalized customQuantities: ${JSON.stringify(bundleCustomQtys)}`);
            
            await tx.insert(clientBundles).values({
              clientId: client.id,
              bundleId: item.bundleId,
              customQuantities: bundleCustomQtys,
            });
            transferredCount++;
          }
        } else if (item.itemType === "package" && item.packageId) {
          console.log(`[LeadConversion] Expanding package ${item.packageId} into individual bundles/products (not adding as package to avoid double-counting)`);
          const pkgCustomQtys = (item.customQuantities || {}) as Record<string, any>;
          const pkgItems = await tx
            .select()
            .from(packageItems)
            .where(eq(packageItems.packageId, item.packageId));

          for (const pkgItem of pkgItems) {
            if (pkgItem.itemType === "bundle" && pkgItem.bundleId) {
              const existingBundle = await tx
                .select()
                .from(clientBundles)
                .where(
                  and(
                    eq(clientBundles.clientId, client.id),
                    eq(clientBundles.bundleId, pkgItem.bundleId)
                  )
                )
                .limit(1);

              if (existingBundle.length === 0) {
                const itemKey = pkgItem.id || `${pkgItem.itemType}-${pkgItem.bundleId}`;
                const bundleProductQtys: Record<string, number> = {};

                const bps = await tx
                  .select({ productId: bundleProducts.productId })
                  .from(bundleProducts)
                  .where(eq(bundleProducts.bundleId, pkgItem.bundleId));

                for (const bp of bps) {
                  const bpKey = `${itemKey}_bp_${bp.productId}`;
                  if (pkgCustomQtys[bpKey] !== undefined) {
                    bundleProductQtys[bp.productId] = Number(pkgCustomQtys[bpKey]);
                  }
                  if (pkgCustomQtys[bp.productId] !== undefined) {
                    bundleProductQtys[bp.productId] = Number(pkgCustomQtys[bp.productId]);
                  }
                }

                const bpsAll = await tx
                  .select({ productId: bundleProducts.productId, quantity: bundleProducts.quantity })
                  .from(bundleProducts)
                  .where(eq(bundleProducts.bundleId, pkgItem.bundleId));
                
                const normalizedBundleQtys: Record<string, number> = {};
                for (const bp of bpsAll) {
                  normalizedBundleQtys[bp.productId] = bundleProductQtys[bp.productId] ?? bp.quantity ?? 1;
                }
                const finalBundleQtys: Record<string, number> | null = Object.keys(normalizedBundleQtys).length > 0 ? normalizedBundleQtys : null;
                console.log(`[LeadConversion] Package bundle ${pkgItem.bundleId} normalized customQuantities: ${JSON.stringify(finalBundleQtys)}`);

                await tx.insert(clientBundles).values({
                  clientId: client.id,
                  bundleId: pkgItem.bundleId,
                  customQuantities: finalBundleQtys,
                });
                transferredCount++;
              }
            } else if (pkgItem.itemType === "product" && pkgItem.productId) {
              const existingProd = await tx
                .select()
                .from(clientProducts)
                .where(
                  and(
                    eq(clientProducts.clientId, client.id),
                    eq(clientProducts.productId, pkgItem.productId)
                  )
                )
                .limit(1);

              if (existingProd.length === 0) {
                await tx.insert(clientProducts).values({
                  clientId: client.id,
                  productId: pkgItem.productId,
                });
                transferredCount++;
              }
            }
          }
        }
      }

      console.log(
        `✅ [LeadConversion] Transferred ${transferredCount} items from quote ${quote.id} to client ${client.id}`
      );
    }

    const closedWonStage = await tx
      .select()
      .from(leadPipelineStages)
      .where(sql`LOWER(${leadPipelineStages.name}) = 'closed won'`)
      .limit(1);

    const leadUpdateData: Record<string, any> = {
      status: "Won",
      isConverted: true,
      convertedAt: new Date(),
      clientId: client.id,
      convertedBy: triggeredBy,
    };

    if (closedWonStage.length > 0) {
      leadUpdateData.stageId = closedWonStage[0].id;
      console.log(
        `✅ [LeadConversion] Moving lead ${leadId} to "Closed Won" stage`
      );
    }

    await tx
      .update(leads)
      .set(leadUpdateData)
      .where(eq(leads.id, leadId));

    console.log(
      `✅ [LeadConversion] Lead ${leadId} converted to client ${client.id} (triggered by: ${triggeredBy})`
    );

    const [cycleLengthSetting] = await tx
      .select()
      .from(taskSettings)
      .where(
        eq(taskSettings.settingKey, "task_mapping_default_cycle_length")
      );
    const defaultCycleLength =
      (cycleLengthSetting?.settingValue as any)?.value ?? 30;

    const [advanceGenSetting] = await tx
      .select()
      .from(taskSettings)
      .where(
        eq(
          taskSettings.settingKey,
          "task_mapping_default_advance_generation_days"
        )
      );
    const defaultAdvanceDays =
      (advanceGenSetting?.settingValue as any)?.value ?? 3;

    const existingConfig = await tx
      .select()
      .from(clientRecurringConfig)
      .where(eq(clientRecurringConfig.clientId, client.id))
      .limit(1);

    if (existingConfig.length === 0) {
      await tx.insert(clientRecurringConfig).values({
        clientId: client.id,
        cycleStartDate: new Date(),
        cycleLengthDays: defaultCycleLength,
        advanceGenerationDays: defaultAdvanceDays,
        status: "active",
      });
      console.log(
        `✅ [LeadConversion] Created recurring config for client ${client.id}`
      );
    }

    return {
      success: true as const,
      clientId: client.id,
      alreadyConverted: false,
      quoteId: quote?.id || null,
    };
  });

  console.log(`[LeadConversion] Transaction completed. clientId=${result.clientId}, alreadyConverted=${result.alreadyConverted}`);

  if (!result.alreadyConverted) {
    try {
      const [autoGenSetting] = await db
        .select()
        .from(taskSettings)
        .where(
          eq(taskSettings.settingKey, "task_mapping_auto_generate_on_conversion")
        );
      const autoGenerateEnabled =
        (autoGenSetting?.settingValue as any)?.value ?? true;

      if (autoGenerateEnabled) {
        const assignedProducts = await db
          .select({ productId: clientProducts.productId })
          .from(clientProducts)
          .where(eq(clientProducts.clientId, result.clientId));

        const assignedBundles = await db
          .select({ bundleId: clientBundles.bundleId })
          .from(clientBundles)
          .where(eq(clientBundles.clientId, result.clientId));

        const assignedPackages = await db
          .select({ packageId: clientPackages.packageId })
          .from(clientPackages)
          .where(eq(clientPackages.clientId, result.clientId));

        const generationItems: Array<{
          productId?: string;
          bundleId?: string;
          packageId?: string;
          quantity: number;
        }> = [];

        for (const cp of assignedProducts) {
          let qty = 1;
          if (result.quoteId) {
            const [qi] = await db
              .select({ quantity: quoteItems.quantity })
              .from(quoteItems)
              .where(
                and(
                  eq(quoteItems.quoteId, result.quoteId),
                  eq(quoteItems.productId, cp.productId),
                  eq(quoteItems.itemType, "product")
                )
              )
              .limit(1);
            if (qi) qty = qi.quantity;
          }
          generationItems.push({ productId: cp.productId, quantity: qty });
        }

        for (const cb of assignedBundles) {
          let qty = 1;
          if (result.quoteId) {
            const [qi] = await db
              .select({ quantity: quoteItems.quantity })
              .from(quoteItems)
              .where(
                and(
                  eq(quoteItems.quoteId, result.quoteId),
                  eq(quoteItems.bundleId, cb.bundleId),
                  eq(quoteItems.itemType, "bundle")
                )
              )
              .limit(1);
            if (qi) qty = qi.quantity;
          }
          generationItems.push({ bundleId: cb.bundleId, quantity: qty });
        }

        for (const cpkg of assignedPackages) {
          let qty = 1;
          if (result.quoteId) {
            const [qi] = await db
              .select({ quantity: quoteItems.quantity })
              .from(quoteItems)
              .where(
                and(
                  eq(quoteItems.quoteId, result.quoteId),
                  eq(quoteItems.packageId, cpkg.packageId),
                  eq(quoteItems.itemType, "package")
                )
              )
              .limit(1);
            if (qi) qty = qi.quantity;
          }
          generationItems.push({ packageId: cpkg.packageId, quantity: qty });
        }

        if (generationItems.length > 0) {
          const summary = await generateTasksFromTemplates({
            clientId: result.clientId,
            items: generationItems,
            generationType: "onboarding",
            cycleStartDate: new Date(),
          });

          console.log(
            `✅ [LeadConversion] Task generation for client ${result.clientId}: ${summary.totalTasksCreated} onboarding tasks created`
          );
          if (summary.errors.length > 0) {
            console.warn(
              `⚠️ [LeadConversion] Task generation warnings:`,
              summary.errors
            );
          }
        } else {
          console.log(`[LeadConversion] No products/bundles/packages to generate tasks for`);
        }
      } else {
        console.log(`[LeadConversion] Auto task generation is disabled`);
      }
    } catch (taskGenError) {
      console.error(
        "[LeadConversion] Error generating onboarding tasks (non-blocking):",
        taskGenError
      );
    }
  }

  console.log(`[LeadConversion] Conversion complete. Returning clientId=${result.clientId}`);
  return { success: result.success, clientId: result.clientId, alreadyConverted: result.alreadyConverted };
}
