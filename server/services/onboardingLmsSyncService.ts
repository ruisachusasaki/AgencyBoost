/**
 * Onboarding LMS Auto-Sync Service
 *
 * LMS Schema findings:
 * - trainingEnrollments: id (varchar uuid), courseId (varchar), userId (uuid/staff.id),
 *   status (text: enrolled/in_progress/completed/dropped), completedAt (timestamp)
 * - trainingProgress: per-lesson progress, status (not_started/in_progress/completed)
 * - trainingCourses: id (varchar uuid), title (text), isPublished (boolean)
 *
 * Completion flow:
 * - POST /api/training/lessons/:id/complete marks a lesson done
 * - When all lessons complete, enrollment.status → "completed", enrollment.completedAt set
 * - referenceId in onboarding_instance_items is integer, but courseId is varchar UUID
 *   → We cast referenceId to text for comparison
 *
 * Notification pattern: uses getNotificationService() from ../notification-service
 *   with notify({ userId, type, title, message, entityType, entityId, priority })
 */

import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { onboardingInstances, onboardingInstanceItems, staff, trainingCourses } from "@shared/schema";
import { getNotificationService } from "../notification-service";

export async function syncLmsCompletion(staffId: string, courseId: string): Promise<void> {
  try {
    const [instance] = await db.select()
      .from(onboardingInstances)
      .where(and(
        eq(onboardingInstances.staffId, staffId),
        eq(onboardingInstances.status, "active")
      ))
      .limit(1);

    if (!instance) return;

    const matchingItems = await db.select()
      .from(onboardingInstanceItems)
      .where(and(
        eq(onboardingInstanceItems.instanceId, instance.id),
        eq(onboardingInstanceItems.itemType, "training_course"),
        sql`CAST(${onboardingInstanceItems.referenceId} AS TEXT) = ${courseId}`,
        eq(onboardingInstanceItems.isCompleted, false)
      ));

    if (matchingItems.length === 0) return;

    await db.transaction(async (tx) => {
      for (const item of matchingItems) {
        await tx.update(onboardingInstanceItems)
          .set({
            isCompleted: true,
            completedAt: new Date(),
            completedBy: staffId,
            autoCompleted: true,
          })
          .where(eq(onboardingInstanceItems.id, item.id));
      }
    });

    console.log(`[OnboardingLmsSync] Auto-completed ${matchingItems.length} item(s) for staff ${staffId}, course ${courseId}`);

    const remainingRequired = await db.select({ count: sql<number>`count(*)` })
      .from(onboardingInstanceItems)
      .where(and(
        eq(onboardingInstanceItems.instanceId, instance.id),
        eq(onboardingInstanceItems.isRequired, true),
        eq(onboardingInstanceItems.isCompleted, false)
      ));

    const allRequiredDone = (remainingRequired[0]?.count || 0) === 0;

    if (allRequiredDone) {
      await db.update(onboardingInstances)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(onboardingInstances.id, instance.id));
      console.log(`[OnboardingLmsSync] Instance ${instance.id} marked as completed`);
    }

    let courseTitle = "a training course";
    try {
      const [course] = await db.select({ title: trainingCourses.title })
        .from(trainingCourses)
        .where(eq(trainingCourses.id, courseId));
      if (course) courseTitle = course.title;
    } catch {}

    const notificationService = getNotificationService();
    if (notificationService) {
      for (const item of matchingItems) {
        void notificationService.notify({
          userId: staffId,
          type: "onboarding_auto_complete",
          title: "Onboarding item auto-completed",
          message: `Your training completion was detected and '${courseTitle}' has been marked complete on your onboarding checklist.`,
          entityType: "onboarding",
          entityId: String(instance.id),
          priority: "normal",
        }).catch(err => console.error("[OnboardingLmsSync] Notification error:", err));
      }

      if (allRequiredDone) {
        void notificationService.notify({
          userId: staffId,
          type: "onboarding_complete",
          title: "🎉 Onboarding complete!",
          message: "You've completed all required items in your onboarding checklist. Great work!",
          entityType: "onboarding",
          entityId: String(instance.id),
          priority: "normal",
        }).catch(err => console.error("[OnboardingLmsSync] Completion notification error:", err));

        try {
          const [hire] = await db.select({
            firstName: staff.firstName,
            lastName: staff.lastName,
            managerId: staff.managerId,
          })
            .from(staff)
            .where(eq(staff.id, staffId));

          if (hire?.managerId) {
            void notificationService.notify({
              userId: hire.managerId,
              type: "onboarding_hire_complete",
              title: `${hire.firstName} ${hire.lastName} completed onboarding`,
              message: `${hire.firstName} ${hire.lastName} has completed all required items in their onboarding checklist.`,
              entityType: "onboarding",
              entityId: String(instance.id),
              priority: "normal",
            }).catch(err => console.error("[OnboardingLmsSync] Manager notification error:", err));
          }
        } catch (err) {
          console.error("[OnboardingLmsSync] Error fetching hire for manager notification:", err);
        }
      }
    }
  } catch (error) {
    console.error("[OnboardingLmsSync] Error in syncLmsCompletion:", error);
  }
}
