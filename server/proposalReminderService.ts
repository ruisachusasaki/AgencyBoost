import { db } from "./db";
import { quotes, staff } from "@shared/schema";
import { eq, and, lt, isNull, lte, isNotNull } from "drizzle-orm";
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

      const unsignedQuotes = await db
        .select()
        .from(quotes)
        .where(
          and(
            eq(quotes.status, "sent"),
            isNull(quotes.signedAt),
            isNotNull(quotes.publicToken),
            lte(quotes.sentAt, threeDaysAgo),
            lt(quotes.reminderCount, MAX_REMINDERS)
          )
        );

      for (const quote of unsignedQuotes) {
        if (quote.reminderSentAt) {
          const hoursSinceLastReminder = (Date.now() - new Date(quote.reminderSentAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastReminder < REMINDER_INTERVAL_HOURS) continue;
        }

        if (quote.sentByUserId) {
          const [sender] = await db.select().from(staff).where(eq(staff.id, quote.sentByUserId));

          if (sender && sender.email) {
            const daysSinceSent = Math.floor((Date.now() - new Date(quote.sentAt!).getTime()) / (1000 * 60 * 60 * 24));

            try {
              await notificationService.sendDirectEmail({
                to: sender.email,
                subject: `Reminder: Unsigned Proposal - ${quote.name || 'Proposal'}`,
                text: `The proposal "${quote.name || 'Proposal'}" was sent ${daysSinceSent} days ago and hasn't been signed yet. You may want to follow up with the client.`,
              });
              console.log(`[ProposalReminder] Reminder sent for quote ${quote.id} to ${sender.email}`);
            } catch (e) {
              console.error(`[ProposalReminder] Failed to send reminder:`, e);
            }
          }
        }

        await db
          .update(quotes)
          .set({
            reminderSentAt: new Date(),
            reminderCount: (quote.reminderCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, quote.id));
      }
    } catch (error) {
      console.error("[ProposalReminder] Error:", error);
    }
  };

  setInterval(check, 60 * 60 * 1000);
  setTimeout(check, 30 * 1000);
}
