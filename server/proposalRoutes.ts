import express, { type Express } from "express";
import { db } from "./db";
import { proposals, proposalTerms, quotes, quoteItems, clients, leads, staff, products, productBundles, productPackages } from "@shared/schema";
import { eq, desc, and, sql, lt, isNull, asc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createPaymentIntent, createACHPaymentIntent, isStripeConfigured, constructWebhookEvent, getStripe } from "./stripe";
import { NotificationService } from "./notification-service";

function generatePublicToken(): string {
  return randomBytes(32).toString("hex");
}

export function registerProposalRoutes(
  app: Express,
  requireAuth: () => any,
  requirePermission: (module: string, permission: string) => any,
  notificationService: NotificationService
) {
  app.get("/api/proposals", requireAuth(), async (req, res) => {
    try {
      const results = await db
        .select({
          id: proposals.id,
          quoteId: proposals.quoteId,
          clientId: proposals.clientId,
          leadId: proposals.leadId,
          status: proposals.status,
          signedAt: proposals.signedAt,
          signedByName: proposals.signedByName,
          signedByEmail: proposals.signedByEmail,
          termsAccepted: proposals.termsAccepted,
          paymentMethod: proposals.paymentMethod,
          paymentStatus: proposals.paymentStatus,
          paidAt: proposals.paidAt,
          paidAmount: proposals.paidAmount,
          paymentAmountType: proposals.paymentAmountType,
          customPaymentAmount: proposals.customPaymentAmount,
          publicToken: proposals.publicToken,
          reminderCount: proposals.reminderCount,
          expiresAt: proposals.expiresAt,
          sentAt: proposals.sentAt,
          viewedAt: proposals.viewedAt,
          createdAt: proposals.createdAt,
          updatedAt: proposals.updatedAt,
          quoteName: quotes.name,
          clientName: clients.company,
          leadName: leads.name,
          sentByFirstName: staff.firstName,
          sentByLastName: staff.lastName,
        })
        .from(proposals)
        .leftJoin(quotes, eq(proposals.quoteId, quotes.id))
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .leftJoin(leads, eq(proposals.leadId, leads.id))
        .leftJoin(staff, eq(proposals.sentByUserId, staff.id))
        .orderBy(desc(proposals.createdAt));

      res.json(results);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.get("/api/proposals/:id", requireAuth(), async (req, res) => {
    try {
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.id, req.params.id));

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));
      const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, proposal.quoteId));

      let client = null;
      if (proposal.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, proposal.clientId));
        client = c;
      }

      let lead = null;
      if (proposal.leadId) {
        const [l] = await db.select().from(leads).where(eq(leads.id, proposal.leadId));
        lead = l;
      }

      res.json({ proposal, quote, items, client, lead });
    } catch (error) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.post("/api/proposals", requireAuth(), async (req, res) => {
    try {
      const { quoteId, paymentAmountType, customPaymentAmount, expiresInDays } = req.body;

      if (!quoteId) {
        return res.status(400).json({ message: "quoteId is required" });
      }

      const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
      if (!quote) return res.status(404).json({ message: "Quote not found" });

      if (!["approved", "accepted", "sent"].includes(quote.status)) {
        return res.status(400).json({ message: "Quote must be approved, sent, or accepted to create a proposal" });
      }

      const existingProposal = await db
        .select()
        .from(proposals)
        .where(eq(proposals.quoteId, quoteId));

      if (existingProposal.length > 0) {
        return res.status(400).json({ message: "A proposal already exists for this quote" });
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const [proposal] = await db.insert(proposals).values({
        quoteId,
        clientId: quote.clientId,
        leadId: quote.leadId,
        status: "draft",
        publicToken: generatePublicToken(),
        paymentAmountType: paymentAmountType || "full",
        customPaymentAmount: customPaymentAmount || null,
        expiresAt,
        sentByUserId: (req as any).user?.id,
      }).returning();

      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  app.put("/api/proposals/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const [existing] = await db.select().from(proposals).where(eq(proposals.id, id));
      if (!existing) return res.status(404).json({ message: "Proposal not found" });

      const [updated] = await db
        .update(proposals)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(proposals.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  app.post("/api/proposals/:id/send", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { recipientEmail, recipientName } = req.body;

      const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));

      let clientEmail = recipientEmail;
      let clientName = recipientName || "Client";

      if (!clientEmail && proposal.leadId) {
        const [lead] = await db.select().from(leads).where(eq(leads.id, proposal.leadId));
        if (lead) {
          clientEmail = lead.email;
          clientName = lead.name || clientName;
        }
      }

      if (!clientEmail && proposal.clientId) {
        const [client] = await db.select().from(clients).where(eq(clients.id, proposal.clientId));
        if (client) {
          clientEmail = client.email;
          clientName = client.company || client.contactName || clientName;
        }
      }

      if (!clientEmail) {
        return res.status(400).json({ message: "No recipient email found. Please provide recipientEmail." });
      }

      const appUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "https://agencyflow.app";

      const proposalUrl = `${appUrl}/proposal/${proposal.publicToken}`;
      const quoteName = quote?.name || "Your Proposal";

      const html = generateProposalEmailHtml(clientName, quoteName, proposalUrl);

      const emailResult = await notificationService.sendDirectEmail({
        to: clientEmail,
        subject: `Your Proposal: ${quoteName}`,
        text: `Hi ${clientName},\n\nA new proposal has been prepared for you. Please review, sign, and complete payment at the following link:\n\n${proposalUrl}\n\nThank you!`,
        html,
      });

      const [updated] = await db
        .update(proposals)
        .set({
          status: "sent",
          sentAt: new Date(),
          sentByUserId: (req as any).user?.id,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, id))
        .returning();

      res.json({ proposal: updated, emailSent: emailResult.sent, recipientEmail: clientEmail });
    } catch (error) {
      console.error("Error sending proposal:", error);
      res.status(500).json({ message: "Failed to send proposal" });
    }
  });

  app.get("/api/proposals/public/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.publicToken, token));

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      if (proposal.expiresAt && new Date(proposal.expiresAt) < new Date()) {
        return res.status(410).json({ message: "This proposal has expired" });
      }

      if (!proposal.viewedAt) {
        await db
          .update(proposals)
          .set({ viewedAt: new Date(), status: proposal.status === "sent" ? "viewed" : proposal.status, updatedAt: new Date() })
          .where(eq(proposals.id, proposal.id));
      }

      const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));
      const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, proposal.quoteId));

      const enrichedItems = await Promise.all(items.map(async (item) => {
        let itemName = "";
        let itemDescription = "";
        if (item.itemType === "product" && item.productId) {
          const [p] = await db.select().from(products).where(eq(products.id, item.productId));
          if (p) { itemName = p.name; itemDescription = p.description || ""; }
        } else if (item.itemType === "bundle" && item.bundleId) {
          const [b] = await db.select().from(productBundles).where(eq(productBundles.id, item.bundleId));
          if (b) { itemName = b.name; itemDescription = b.description || ""; }
        } else if (item.itemType === "package" && item.packageId) {
          const [pkg] = await db.select().from(productPackages).where(eq(productPackages.id, item.packageId));
          if (pkg) { itemName = pkg.name; itemDescription = pkg.description || ""; }
        }
        return { ...item, itemName, itemDescription };
      }));

      let clientName = "";
      if (proposal.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, proposal.clientId));
        if (c) clientName = c.company || c.contactName || "";
      } else if (proposal.leadId) {
        const [l] = await db.select().from(leads).where(eq(leads.id, proposal.leadId));
        if (l) clientName = l.name || "";
      }

      const activeTerms = await db
        .select()
        .from(proposalTerms)
        .where(eq(proposalTerms.isActive, true))
        .orderBy(desc(proposalTerms.version))
        .limit(1);

      let paymentAmount = parseFloat(quote?.totalCost || "0");
      if (proposal.paymentAmountType === "custom" && proposal.customPaymentAmount) {
        paymentAmount = parseFloat(proposal.customPaymentAmount);
      }

      res.json({
        proposal: {
          id: proposal.id,
          status: proposal.status,
          signedAt: proposal.signedAt,
          signedByName: proposal.signedByName,
          termsAccepted: proposal.termsAccepted,
          paymentMethod: proposal.paymentMethod,
          paymentStatus: proposal.paymentStatus,
          paidAt: proposal.paidAt,
          paidAmount: proposal.paidAmount,
          paymentAmountType: proposal.paymentAmountType,
          expiresAt: proposal.expiresAt,
        },
        quote: quote ? { name: quote.name, totalCost: quote.totalCost, clientBudget: quote.clientBudget, notes: quote.notes } : null,
        items: enrichedItems,
        clientName,
        terms: activeTerms[0] || null,
        paymentAmount,
        stripeConfigured: isStripeConfigured(),
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      });
    } catch (error) {
      console.error("Error fetching public proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.post("/api/proposals/public/:token/sign", async (req, res) => {
    try {
      const { token } = req.params;
      const { signerName, signerEmail, signatureData, termsAccepted } = req.body;

      if (!signerName || !signerEmail || !signatureData) {
        return res.status(400).json({ message: "signerName, signerEmail, and signatureData are required" });
      }
      if (!termsAccepted) {
        return res.status(400).json({ message: "You must accept the Terms & Conditions" });
      }

      const [proposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.publicToken, token));

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      if (proposal.signedAt) {
        return res.status(400).json({ message: "This proposal has already been signed" });
      }

      if (proposal.expiresAt && new Date(proposal.expiresAt) < new Date()) {
        return res.status(410).json({ message: "This proposal has expired" });
      }

      const activeTerms = await db
        .select()
        .from(proposalTerms)
        .where(eq(proposalTerms.isActive, true))
        .orderBy(desc(proposalTerms.version))
        .limit(1);

      const [updated] = await db
        .update(proposals)
        .set({
          status: "signed",
          signedAt: new Date(),
          signedByName: signerName,
          signedByEmail: signerEmail,
          signatureData,
          termsAccepted: true,
          termsVersionId: activeTerms[0]?.id || null,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id))
        .returning();

      if (proposal.sentByUserId) {
        const [sender] = await db.select().from(staff).where(eq(staff.id, proposal.sentByUserId));
        if (sender) {
          const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));
          try {
            await notificationService.sendDirectEmail({
              to: sender.email,
              subject: `Proposal Signed: ${quote?.name || 'Proposal'}`,
              text: `Great news! ${signerName} (${signerEmail}) has signed the proposal "${quote?.name || 'Proposal'}". Awaiting payment.`,
            });
          } catch (e) {
            console.error("Error sending signature notification:", e);
          }
        }
      }

      res.json({ success: true, proposal: { status: updated.status, signedAt: updated.signedAt } });
    } catch (error) {
      console.error("Error signing proposal:", error);
      res.status(500).json({ message: "Failed to sign proposal" });
    }
  });

  app.post("/api/proposals/public/:token/pay", async (req, res) => {
    try {
      const { token } = req.params;
      const { paymentMethod } = req.body;

      if (!paymentMethod || !["card", "ach"].includes(paymentMethod)) {
        return res.status(400).json({ message: "paymentMethod must be 'card' or 'ach'" });
      }

      if (!isStripeConfigured()) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }

      const [proposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.publicToken, token));

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      if (!proposal.signedAt) {
        return res.status(400).json({ message: "Proposal must be signed before payment" });
      }

      if (proposal.paidAt) {
        return res.status(400).json({ message: "Payment has already been completed" });
      }

      const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));
      if (!quote) return res.status(404).json({ message: "Associated quote not found" });

      let paymentAmount = parseFloat(quote.totalCost || "0");
      if (proposal.paymentAmountType === "custom" && proposal.customPaymentAmount) {
        paymentAmount = parseFloat(proposal.customPaymentAmount);
      }

      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const metadata = {
        proposalId: proposal.id,
        quoteId: proposal.quoteId,
        clientId: proposal.clientId || "",
        leadId: proposal.leadId || "",
      };

      let result;
      if (paymentMethod === "ach") {
        result = await createACHPaymentIntent(
          paymentAmount,
          proposal.signedByEmail || "",
          proposal.signedByName || "",
          metadata
        );
      } else {
        const stripe = getStripe();
        if (!stripe) return res.status(503).json({ message: "Stripe not configured" });

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(paymentAmount * 100),
          currency: "usd",
          payment_method_types: ["card"],
          metadata,
        });

        result = { paymentIntent, clientSecret: paymentIntent.client_secret };
      }

      if (!result) {
        return res.status(500).json({ message: "Failed to create payment" });
      }

      await db
        .update(proposals)
        .set({
          paymentMethod,
          paymentIntentId: result.paymentIntent.id,
          paymentStatus: "pending",
          paidAmount: paymentAmount.toString(),
          status: "payment_pending",
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id));

      res.json({ clientSecret: result.clientSecret });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get("/api/proposal-terms", requireAuth(), async (req, res) => {
    try {
      const terms = await db
        .select()
        .from(proposalTerms)
        .orderBy(desc(proposalTerms.version));
      res.json(terms);
    } catch (error) {
      console.error("Error fetching proposal terms:", error);
      res.status(500).json({ message: "Failed to fetch proposal terms" });
    }
  });

  app.put("/api/proposal-terms", requireAuth(), async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "title and content are required" });
      }

      await db
        .update(proposalTerms)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(proposalTerms.isActive, true));

      const maxVersion = await db
        .select({ maxVer: sql<number>`COALESCE(MAX(${proposalTerms.version}), 0)` })
        .from(proposalTerms);

      const [newTerms] = await db.insert(proposalTerms).values({
        title,
        content,
        version: (maxVersion[0]?.maxVer || 0) + 1,
        isActive: true,
      }).returning();

      res.json(newTerms);
    } catch (error) {
      console.error("Error updating proposal terms:", error);
      res.status(500).json({ message: "Failed to update proposal terms" });
    }
  });

  app.get("/api/stripe/config", async (req, res) => {
    res.json({
      configured: isStripeConfigured(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    });
  });
}

function generateProposalEmailHtml(clientName: string, quoteName: string, proposalUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Proposal is Ready</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00C9C6 0%, #00A8A6 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 16px; }
    .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
    .greeting { font-size: 18px; margin-bottom: 20px; }
    .details { background: #f8fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #eef1f3; }
    .details-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
    .details-value { font-size: 18px; font-weight: 600; color: #333; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; padding: 16px 40px; background: #00C9C6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: center; margin-bottom: 12px; }
    .step-number { width: 28px; height: 28px; border-radius: 50%; background: #00C9C6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
    .footer { background: #f5f5f5; padding: 24px; text-align: center; font-size: 13px; color: #888; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Proposal is Ready</h1>
    <p>Review, sign, and pay — all in one place</p>
  </div>
  <div class="content">
    <p class="greeting">Hi ${clientName},</p>
    <p>We've prepared a proposal for you. Please review the details, sign, and complete payment to get started.</p>
    <div class="details">
      <div class="details-label">Proposal</div>
      <div class="details-value">${quoteName}</div>
    </div>
    <div class="steps">
      <div class="step"><span class="step-number">1</span><span>Review the proposal details and pricing</span></div>
      <div class="step"><span class="step-number">2</span><span>Accept terms and sign electronically</span></div>
      <div class="step"><span class="step-number">3</span><span>Complete payment via credit card or bank transfer</span></div>
    </div>
    <div class="cta">
      <a href="${proposalUrl}" class="button">View & Sign Proposal</a>
    </div>
    <p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to reach out.</p>
  </div>
  <div class="footer">
    <p>This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>`;
}

export async function handleStripeWebhook(req: any, res: any, notificationService: NotificationService) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ message: "Missing signature or webhook secret" });
  }

  let event;
  try {
    event = constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any;
    const proposalId = paymentIntent.metadata?.proposalId;

    if (proposalId) {
      try {
        const [proposal] = await db
          .select()
          .from(proposals)
          .where(eq(proposals.id, proposalId));

        if (proposal) {
          await db
            .update(proposals)
            .set({
              status: "completed",
              paymentStatus: "paid",
              paidAt: new Date(),
              paidAmount: (paymentIntent.amount / 100).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(proposals.id, proposalId));

          await triggerProposalFulfillment(proposal, notificationService);
        }
      } catch (error) {
        console.error("Error processing payment success:", error);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as any;
    const proposalId = paymentIntent.metadata?.proposalId;

    if (proposalId) {
      await db
        .update(proposals)
        .set({
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, proposalId));
    }
  }

  res.json({ received: true });
}

async function triggerProposalFulfillment(proposal: any, notificationService: NotificationService) {
  try {
    console.log(`[Proposal Fulfillment] Starting fulfillment for proposal ${proposal.id}`);

    if (proposal.sentByUserId) {
      const [sender] = await db.select().from(staff).where(eq(staff.id, proposal.sentByUserId));
      if (sender) {
        const [quote] = await db.select().from(quotes).where(eq(quotes.id, proposal.quoteId));
        try {
          await notificationService.sendDirectEmail({
            to: sender.email,
            subject: `Payment Received: ${quote?.name || 'Proposal'}`,
            text: `Payment has been received for proposal "${quote?.name || 'Proposal'}" from ${proposal.signedByName}. The proposal is now complete and fulfillment has been triggered.`,
          });
        } catch (e) {
          console.error("Error sending payment notification:", e);
        }
      }
    }

    console.log(`[Proposal Fulfillment] Fulfillment complete for proposal ${proposal.id}`);
  } catch (error) {
    console.error("[Proposal Fulfillment] Error:", error);
  }
}
