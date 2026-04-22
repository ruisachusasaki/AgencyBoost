import { db } from "../db";
import { jobApplications, jobOffers, staff, emailTemplates, scheduledHiredEmails } from "@shared/schema";
import { eq, ilike, and, lte } from "drizzle-orm";
import { getNotificationService } from "../notification-service";
import { emitTrigger } from "../workflow-engine";

export interface HiredEmailOptions {
  sendOption: "now" | "scheduled";
  scheduledFor?: string;
  timezone?: string;
  customSubject?: string;
  customHtml?: string;
}

export async function getWelcomeEmailPreview(applicationId: string): Promise<{
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  candidateName: string;
  position: string;
  startDate: string;
  usedPersonalFallback: boolean;
}> {
  const [application] = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.id, applicationId))
    .limit(1);

  if (!application) {
    throw new Error("Application not found");
  }

  const candidateName = application.applicantName || "New Hire";
  const candidateEmail = application.applicantEmail || "";
  const position = application.positionTitle || "Team Member";

  const [offer] = await db
    .select()
    .from(jobOffers)
    .where(eq(jobOffers.applicationId, applicationId))
    .limit(1);

  const startDate = offer?.startDate
    ? new Date(offer.startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBD";

  let workEmail: string | null = null;
  let usedPersonalFallback = false;

  try {
    const nameParts = candidateName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const matchingStaff = await db
        .select({ email: staff.email })
        .from(staff)
        .where(
          and(
            ilike(staff.firstName, firstName),
            ilike(staff.lastName, lastName),
            ilike(staff.email, "%@themediaoptimizers.com")
          )
        )
        .limit(1);

      if (matchingStaff.length > 0) {
        workEmail = matchingStaff[0].email;
      }
    }
  } catch (err) {
    console.error("[HiredNotif] Error looking up staff record:", err);
  }

  const recipientEmail = workEmail || candidateEmail;
  if (!workEmail) {
    usedPersonalFallback = true;
  }

  let emailSubject = `Welcome to The Media Optimizers, ${candidateName}! 🎉`;
  let emailHtml = buildFallbackWelcomeEmail(candidateName, position, startDate);

  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(ilike(emailTemplates.name, "%welcome%"))
      .limit(5);

    const activeTemplate = templates.find((t: any) => t.content && t.subject);
    if (!activeTemplate) {
      const onboardingTemplates = await db
        .select()
        .from(emailTemplates)
        .where(ilike(emailTemplates.name, "%onboarding%"))
        .limit(5);
      const fallbackTemplate = onboardingTemplates.find((t: any) => t.content && t.subject);
      if (fallbackTemplate) {
        emailSubject = renderTemplate(fallbackTemplate.subject, candidateName, position, startDate);
        emailHtml = renderTemplate(fallbackTemplate.content, candidateName, position, startDate);
      }
    } else {
      emailSubject = renderTemplate(activeTemplate.subject, candidateName, position, startDate);
      emailHtml = renderTemplate(activeTemplate.content, candidateName, position, startDate);
    }
  } catch (err) {
    console.error("[HiredNotif] Error fetching email template:", err);
  }

  return {
    recipientEmail,
    subject: emailSubject,
    htmlContent: emailHtml,
    candidateName,
    position,
    startDate,
    usedPersonalFallback,
  };
}

export async function sendHiredNotifications(
  applicationId: string,
  changedBy: string,
  emailOptions?: HiredEmailOptions
): Promise<void> {
  try {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application) {
      console.error("[HiredNotif] Application not found:", applicationId);
      return;
    }

    const candidateName = application.applicantName || "New Hire";
    const position = application.positionTitle || "Team Member";

    const [offer] = await db
      .select()
      .from(jobOffers)
      .where(eq(jobOffers.applicationId, applicationId))
      .limit(1);

    const startDate = offer?.startDate
      ? new Date(offer.startDate).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        })
      : "TBD";

    // Notify the manager (in-app notification only — email is now handled by Workflows)
    const notificationService = getNotificationService();
    if (notificationService && changedBy) {
      void notificationService
        .notify({
          userId: changedBy,
          type: "applicant_hired",
          title: `${candidateName} has been marked as Hired`,
          message: `${candidateName} has been marked as hired for the ${position} role (start date: ${startDate}). Any welcome emails or onboarding actions are now handled by the "Applicant Hired" workflow trigger under Workflows.`,
          entityType: "job_application",
          entityId: applicationId,
          actionUrl: `/applicants/${applicationId}`,
          actionText: "View Application",
          priority: "normal",
          metadata: { position, startDate },
        })
        .catch((err) =>
          console.error("[HiredNotif] Failed to send manager notification:", err)
        );
    }

    // Fire the workflow trigger - workflows are now solely responsible for any emails
    void emitTrigger({
      type: "applicant_hired",
      data: {
        applicationId,
        candidateName,
        position,
        startDate,
        managerId: changedBy,
        candidateEmail: application.applicantEmail || null,
      },
      context: { userId: changedBy, timestamp: new Date() },
    }).catch((err) => console.error("[Trigger] applicant_hired failed:", err));
  } catch (error) {
    console.error("[HiredNotif] Unhandled error in sendHiredNotifications:", error);
  }
}

// Legacy code path kept for reference (no longer invoked - emails handled by Workflows)
async function _legacySendHiredEmail(
  applicationId: string,
  changedBy: string,
  emailOptions?: HiredEmailOptions
): Promise<void> {
  try {
    const preview = await getWelcomeEmailPreview(applicationId);
    const { recipientEmail, candidateName, position, startDate, usedPersonalFallback } = preview;

    const emailSubject = emailOptions?.customSubject || preview.subject;
    const emailHtml = emailOptions?.customHtml || preview.htmlContent;

    if (emailOptions?.sendOption === "scheduled" && emailOptions.scheduledFor) {
      if (!recipientEmail) {
        console.error("[HiredNotif] Cannot schedule email: no recipient email found");
        return;
      }
      const scheduledDate = new Date(emailOptions.scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        console.error("[HiredNotif] Cannot schedule email: invalid or past date");
        return;
      }
      await db.insert(scheduledHiredEmails).values({
        applicationId,
        toEmail: recipientEmail,
        subject: emailSubject,
        htmlContent: emailHtml,
        scheduledFor: new Date(emailOptions.scheduledFor),
        timezone: emailOptions.timezone || "America/New_York",
        status: "pending",
        createdBy: changedBy,
        candidateName,
        positionTitle: position,
      });
      console.log(`[HiredNotif] Welcome email scheduled for ${emailOptions.scheduledFor} to ${recipientEmail}`);

      const notificationService = getNotificationService();
      if (notificationService && changedBy) {
        const scheduledDate = new Date(emailOptions.scheduledFor).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
        });
        void notificationService
          .notify({
            userId: changedBy,
            type: "applicant_hired",
            title: `${candidateName} has been marked as Hired`,
            message: `You have successfully hired ${candidateName} for the ${position} role. A welcome email has been scheduled to send on ${scheduledDate} to ${recipientEmail}.`,
            entityType: "job_application",
            entityId: applicationId,
            actionUrl: `/applicants/${applicationId}`,
            actionText: "View Application",
            priority: "normal",
            metadata: { position, startDate },
          })
          .catch((err) =>
            console.error("[HiredNotif] Failed to send manager notification:", err)
          );
      }
    } else {
      const notificationService = getNotificationService();
      if (notificationService && recipientEmail) {
        try {
          await notificationService.sendDirectEmail({
            to: recipientEmail,
            subject: emailSubject,
            text: emailSubject,
            html: emailHtml,
          });
          console.log(`[HiredNotif] Welcome email sent to ${recipientEmail}`);
        } catch (err) {
          console.error("[HiredNotif] Failed to send welcome email:", err);
        }
      }

      if (notificationService && changedBy) {
        let managerMessage = `You have successfully hired ${candidateName} for the ${position} role. A welcome email has been sent to ${recipientEmail}. Their AgencyBoost onboarding checklist will be ready on their start date of ${startDate}.`;
        if (usedPersonalFallback && preview.recipientEmail) {
          managerMessage += ` Note: The welcome email was sent to their personal email (${preview.recipientEmail}) because no matching AgencyBoost staff account was found. Please ensure their staff account is created with their work email.`;
        }

        void notificationService
          .notify({
            userId: changedBy,
            type: "applicant_hired",
            title: `${candidateName} has been marked as Hired`,
            message: managerMessage,
            entityType: "job_application",
            entityId: applicationId,
            actionUrl: `/applicants/${applicationId}`,
            actionText: "View Application",
            priority: "normal",
            metadata: { position, startDate },
          })
          .catch((err) =>
            console.error("[HiredNotif] Failed to send manager notification:", err)
          );
      }
    }

    void emitTrigger({
      type: "applicant_hired",
      data: {
        applicationId,
        candidateName,
        position,
        startDate,
        managerId: changedBy,
      },
      context: { userId: changedBy, timestamp: new Date() },
    }).catch((err) => console.error("[Trigger] applicant_hired failed:", err));
  } catch (error) {
    console.error("[HiredNotif] Unhandled error in sendHiredNotifications:", error);
  }
}

export async function processScheduledHiredEmails(): Promise<void> {
  try {
    const now = new Date();
    const claimedEmails = await db
      .update(scheduledHiredEmails)
      .set({ status: "processing" })
      .where(
        and(
          eq(scheduledHiredEmails.status, "pending"),
          lte(scheduledHiredEmails.scheduledFor, now)
        )
      )
      .returning();

    if (claimedEmails.length === 0) return;

    const notificationService = getNotificationService();
    if (!notificationService) {
      console.warn("[ScheduledEmail] No notification service available, reverting to pending");
      for (const email of claimedEmails) {
        await db.update(scheduledHiredEmails).set({ status: "pending" }).where(eq(scheduledHiredEmails.id, email.id));
      }
      return;
    }

    for (const email of claimedEmails) {
      try {
        await notificationService.sendDirectEmail({
          to: email.toEmail,
          subject: email.subject,
          text: email.subject,
          html: email.htmlContent,
        });

        await db
          .update(scheduledHiredEmails)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(scheduledHiredEmails.id, email.id));

        console.log(`[ScheduledEmail] Sent scheduled welcome email to ${email.toEmail} (ID: ${email.id})`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await db
          .update(scheduledHiredEmails)
          .set({ status: "failed", failureReason: errorMsg })
          .where(eq(scheduledHiredEmails.id, email.id));

        console.error(`[ScheduledEmail] Failed to send email ${email.id}:`, err);
      }
    }
  } catch (error) {
    console.error("[ScheduledEmail] Error processing scheduled emails:", error);
  }
}

export function startScheduledEmailProcessor(): NodeJS.Timeout {
  console.log("[ScheduledEmail] Starting scheduled email processor (60s interval)");
  return setInterval(() => {
    processScheduledHiredEmails().catch((err) =>
      console.error("[ScheduledEmail] Processor error:", err)
    );
  }, 60_000);
}

function renderTemplate(
  template: string,
  name: string,
  position: string,
  startDate: string
): string {
  return template
    .replace(/\{\{candidate_name\}\}/gi, name)
    .replace(/\{\{name\}\}/gi, name)
    .replace(/\{\{position\}\}/gi, position)
    .replace(/\{\{start_date\}\}/gi, startDate)
    .replace(/\{\{onboarding_link\}\}/gi, "https://agencyboost.app/onboarding")
    .replace(/\{\{company_name\}\}/gi, "The Media Optimizers");
}

function buildFallbackWelcomeEmail(
  name: string,
  position: string,
  startDate: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <p>Hi ${name},</p>
      <p>We are thrilled to welcome you to The Media Optimizers as our new <strong>${position}</strong>!</p>
      <p>Your start date is <strong>${startDate}</strong>. Before your first day, please take a few minutes to complete your new hire onboarding form — it only takes a few minutes and helps us get everything set up for you.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://agencyboost.app/onboarding" style="background-color: hsl(179, 100%, 39%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Complete Your Onboarding Form</a>
      </div>
      <p>Once you log into AgencyBoost with your new work email, you will also find your personalized onboarding checklist ready and waiting for you under HR &gt; Onboarding Checklist.</p>
      <p>We cannot wait to have you on the team. If you have any questions before your start date, do not hesitate to reach out.</p>
      <p>Welcome aboard!<br/>The Media Optimizers Team</p>
    </div>
  `;
}
