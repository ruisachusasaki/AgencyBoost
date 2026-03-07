import { db } from "../db";
import { staff, departments, onboardingTemplates, onboardingTemplateItems, onboardingInstances, onboardingInstanceItems } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { getNotificationService } from "../notification-service";

export async function spawnOnboardingChecklist(staffId: string): Promise<{ success: boolean; message: string }> {
  try {
    const [staffMember] = await db.select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      department: staff.department,
      position: staff.position,
      startDate: staff.startDate,
    }).from(staff).where(eq(staff.id, staffId));

    if (!staffMember) {
      console.warn(`[OnboardingSpawn] Staff member not found: ${staffId}`);
      return { success: false, message: "Staff member not found" };
    }

    if (!staffMember.department || !staffMember.position) {
      const missing = !staffMember.department ? "department" : "position";
      console.warn(`[OnboardingSpawn] Staff ${staffMember.firstName} ${staffMember.lastName} has no ${missing} assigned`);
      return { success: false, message: `Staff member has no ${missing} assigned. Please set their ${missing} first.` };
    }

    const [dept] = await db.select({ id: departments.id })
      .from(departments)
      .where(eq(departments.name, staffMember.department));

    if (!dept) {
      console.warn(`[OnboardingSpawn] Department not found for name: ${staffMember.department}`);
      return { success: false, message: `Department "${staffMember.department}" not found` };
    }

    const [matchingTemplate] = await db.select()
      .from(onboardingTemplates)
      .where(and(
        eq(onboardingTemplates.teamId, dept.id),
        sql`LOWER(${onboardingTemplates.positionName}) = LOWER(${staffMember.position})`
      ));

    if (!matchingTemplate) {
      console.warn(`[OnboardingSpawn] No onboarding template found for dept=${staffMember.department}, position=${staffMember.position}`);

      const notificationService = getNotificationService();
      if (notificationService) {
        const managerResults = await db.select({ id: staff.id })
          .from(staff)
          .where(eq(staff.department, staffMember.department))
          .limit(5);

        for (const mgr of managerResults) {
          void notificationService.notify({
            userId: mgr.id,
            type: "onboarding_template_missing",
            title: "Onboarding template missing",
            message: `No onboarding template found for position "${staffMember.position}" in ${staffMember.department}. Please create one in Settings > HR Settings > Onboarding Templates.`,
            entityType: "staff",
            entityId: staffMember.id,
            priority: "normal",
          }).catch(err => console.error("[OnboardingSpawn] Failed to send missing template notification:", err));
        }
      }

      return { success: false, message: `No onboarding template found for position "${staffMember.position}" in department "${staffMember.department}". Please create one in Settings > HR Settings > Onboarding Templates.` };
    }

    const [existingInstance] = await db.select({ id: onboardingInstances.id })
      .from(onboardingInstances)
      .where(and(
        eq(onboardingInstances.staffId, staffId),
        eq(onboardingInstances.status, "active")
      ))
      .limit(1);

    if (existingInstance) {
      console.warn(`[OnboardingSpawn] Active onboarding instance already exists for staff ${staffId}`);
      return { success: false, message: "An active onboarding checklist already exists for this staff member" };
    }

    const templateItems = await db.select()
      .from(onboardingTemplateItems)
      .where(eq(onboardingTemplateItems.templateId, matchingTemplate.id))
      .orderBy(onboardingTemplateItems.dayNumber, onboardingTemplateItems.sortOrder);

    const templateSnapshot = {
      templateId: matchingTemplate.id,
      positionName: matchingTemplate.positionName,
      totalDays: matchingTemplate.totalDays,
      dayUnlockMode: matchingTemplate.dayUnlockMode,
      items: templateItems,
    };

    const startDate = staffMember.startDate || new Date().toISOString().split("T")[0];

    const result = await db.transaction(async (tx) => {
      const [instance] = await tx.insert(onboardingInstances).values({
        staffId,
        templateId: matchingTemplate.id,
        templateSnapshot,
        status: "active",
        startDate,
      }).returning();

      if (templateItems.length > 0) {
        await tx.insert(onboardingInstanceItems).values(
          templateItems.map((item) => ({
            instanceId: instance.id,
            templateItemId: item.id,
            dayNumber: item.dayNumber,
            sortOrder: item.sortOrder,
            title: item.title,
            description: item.description,
            itemType: item.itemType,
            referenceId: item.referenceId,
            isRequired: item.isRequired,
            isCompleted: false,
            autoCompleted: false,
          }))
        );
      }

      return instance;
    });

    const notificationService = getNotificationService();
    if (notificationService) {
      void notificationService.notify({
        userId: staffId,
        type: "onboarding_checklist_ready",
        title: "Your onboarding checklist is ready",
        message: `Your ${matchingTemplate.totalDays}-day onboarding checklist has been created. Head to HR > Onboarding Checklist to get started.`,
        entityType: "onboarding_instance",
        entityId: String(result.id),
        priority: "normal",
      }).catch(err => console.error("[OnboardingSpawn] Failed to send notification:", err));
    }

    console.log(`[OnboardingSpawn] Successfully created onboarding instance ${result.id} for staff ${staffId}`);
    return { success: true, message: "Onboarding checklist created successfully" };
  } catch (error) {
    console.error("[OnboardingSpawn] Error spawning onboarding checklist:", error);
    return { success: false, message: "Failed to create onboarding checklist" };
  }
}
