import { db } from "./db";
import { proposals, quotes, staff } from "@shared/schema";
import { eq, and, lt, isNull, lte } from "drizzle-orm";
import { getNotificationService } from "./notification-service";

const REMINDER_INTERVAL_HOURS = 24;
const DAYS_BEFORE_FIRST_REMINDER = 3;
const MAX_REMINDERS = 3;

export function startProposalReminderService() {
  console.log("[ProposalReminder] Service started - checking every hour");

  const check = async () => {
    try {
      const notificationService = getNotificationService();
      if (!notificationService) return;

      const threeDaysAgo = new Date(Date.now() - DAYS_BEFORE_FIRST_REMINDER * 24 * 60 * 60 * 1000);

      const unsignedProposals = await db
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.status, "sent"),
            isNull(proposals.signedAt),
            lte(proposals.sentAt, threeDaysAgo),
            lt(proposals.reminderCount, MAX_REMINDERS)
          )
        );

      for (const proposal of unsignedProposals) {
        if (proposal.reminderSentAt) {
          const hoursSinceLastReminder = (Date.now() - new Date(proposal.reminderSentAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastReminder < REMINDER_INTERVAL_HOURS) continue;
        }

        if (proposal.sentByUserId) {
          const [sender] = await db.select().from(staff).where(eq(staff.id, proposal.sentByUserId));
          const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));

          if (sender && sender.email) {
            const daysSinceSent = Math.floor((Date.now() - new Date(proposal.sentAt!).getTime()) / (1000 * 60 * 60 * 24));

            try {
              await notificationService.sendDirectEmail({
                to: sender.email,
                subject: `Reminder: Unsigned Proposal - ${quote?.name || 'Proposal'}`,
                text: `The proposal "${quote?.name || 'Proposal'}" was sent ${daysSinceSent} days ago and hasn't been signed yet. You may want to follow up with the client.`,
              });
              console.log(`[ProposalReminder] Reminder sent for proposal ${proposal.id} to ${sender.email}`);
            } catch (e) {
              console.error(`[ProposalReminder] Failed to send reminder:`, e);
            }
          }
        }

        await db
          .update(proposals)
          .set({
            reminderSentAt: new Date(),
            reminderCount: (proposal.reminderCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposal.id));
      }
    } catch (error) {
      console.error("[ProposalReminder] Error:", error);
    }
  };

  setInterval(check, 60 * 60 * 1000);
  setTimeout(check, 30 * 1000);
}
