import {
  generateTasksFromTemplates
} from "./chunk-VLPI6OSY.js";
import {
  db
} from "./chunk-KPQ6KEVY.js";
import {
  businessProfile,
  clientBundles,
  clientPackages,
  clientProducts,
  clientRecurringConfig,
  clients,
  deals,
  leadPipelineStages,
  leads,
  packageItems,
  productBundles,
  productPackages,
  products,
  proposalTerms,
  quoteItems,
  quotes,
  staff,
  taskSettings
} from "./chunk-VCTCMHMP.js";

// server/proposalRoutes.ts
import { eq, desc, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";

// server/stripe.ts
import Stripe from "stripe";
var stripeInstance = null;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia"
    });
  }
  return stripeInstance;
}
function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}
async function createACHPaymentIntent(amount, customerEmail, customerName, metadata = {}) {
  const stripe = getStripe();
  if (!stripe) return null;
  let customer;
  const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName
    });
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    customer: customer.id,
    payment_method_types: ["us_bank_account"],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ["payment_method"]
        }
      }
    },
    metadata
  });
  return {
    paymentIntent,
    clientSecret: paymentIntent.client_secret
  };
}
function constructWebhookEvent(body, signature, webhookSecret) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

// server/proposalRoutes.ts
function generatePublicToken() {
  return randomBytes(32).toString("hex");
}
async function loadBranding() {
  let branding = { logoUrl: "", companyName: "", primaryColor: "#00C9C6", footerText: "" };
  const [brandingSetting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, "proposal_branding"));
  if (brandingSetting?.settingValue) {
    branding = brandingSetting.settingValue;
  } else {
    const [profile] = await db.select().from(businessProfile).limit(1);
    if (profile) {
      branding.logoUrl = profile.logo || "";
      branding.companyName = profile.companyName || "";
    }
  }
  return branding;
}
function registerProposalRoutes(app, requireAuth, requirePermission, notificationService) {
  app.post("/api/quotes/:id/send-proposal", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { recipientEmail, recipientName, paymentAmountType, customPaymentAmount } = req.body;
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      if (!["draft", "approved", "sent"].includes(quote.status)) {
        return res.status(400).json({ message: "Quote must be in draft, approved, or sent status to send as proposal" });
      }
      let clientEmail = recipientEmail;
      let clientName = recipientName || "Client";
      if (!clientEmail && quote.leadId) {
        const [lead] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
        if (lead) {
          clientEmail = lead.email;
          clientName = lead.name || clientName;
        }
      }
      if (!clientEmail && quote.clientId) {
        const [client] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        if (client) {
          clientEmail = client.email;
          clientName = client.company || client.contactName || clientName;
        }
      }
      if (!clientEmail) {
        return res.status(400).json({ message: "No recipient email found. Please provide recipientEmail." });
      }
      const publicToken = quote.publicToken || generatePublicToken();
      const expiresAt = quote.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
      const updateData = {
        status: "sent",
        publicToken,
        expiresAt,
        sentAt: /* @__PURE__ */ new Date(),
        sentByUserId: req.user?.id,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (paymentAmountType) {
        updateData.paymentAmountType = paymentAmountType;
      }
      if (customPaymentAmount) {
        updateData.customPaymentAmount = customPaymentAmount;
      }
      if (!quote.paymentAmountType) {
        updateData.paymentAmountType = paymentAmountType || "full";
      }
      const [updated] = await db.update(quotes).set(updateData).where(eq(quotes.id, id)).returning();
      const appUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://agencyflow.app";
      const proposalUrl = `${appUrl}/proposal/${publicToken}`;
      const quoteName = quote.name || "Your Proposal";
      const branding = await loadBranding();
      const html = generateProposalEmailHtml(clientName, quoteName, proposalUrl, branding);
      const emailResult = await notificationService.sendDirectEmail({
        to: clientEmail,
        subject: `Your Proposal: ${quoteName}`,
        text: `Hi ${clientName},

A new proposal has been prepared for you. Please review, sign, and complete payment at the following link:

${proposalUrl}

Thank you!`,
        html
      });
      res.json({ quote: updated, emailSent: emailResult.sent, recipientEmail: clientEmail, proposalUrl });
    } catch (error) {
      console.error("Error sending quote as proposal:", error);
      res.status(500).json({ message: "Failed to send proposal" });
    }
  });
  app.post("/api/quotes/:id/resend-proposal", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { recipientEmail } = req.body;
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      if (!quote.publicToken) {
        return res.status(400).json({ message: "This quote has not been sent as a proposal yet" });
      }
      let clientEmail = recipientEmail;
      let clientName = "Client";
      if (!clientEmail && quote.leadId) {
        const [lead] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
        if (lead) {
          clientEmail = lead.email;
          clientName = lead.name || clientName;
        }
      }
      if (!clientEmail && quote.clientId) {
        const [client] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        if (client) {
          clientEmail = client.email;
          clientName = client.company || client.contactName || clientName;
        }
      }
      if (!clientEmail) {
        return res.status(400).json({ message: "No recipient email found" });
      }
      const appUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://agencyflow.app";
      const proposalUrl = `${appUrl}/proposal/${quote.publicToken}`;
      const branding = await loadBranding();
      const html = generateProposalEmailHtml(clientName, quote.name, proposalUrl, branding);
      const emailResult = await notificationService.sendDirectEmail({
        to: clientEmail,
        subject: `Your Proposal: ${quote.name}`,
        text: `Hi ${clientName},

A reminder about your proposal. Please review, sign, and complete payment at:

${proposalUrl}

Thank you!`,
        html
      });
      res.json({ emailSent: emailResult.sent, recipientEmail: clientEmail });
    } catch (error) {
      console.error("Error resending proposal:", error);
      res.status(500).json({ message: "Failed to resend proposal" });
    }
  });
  app.get("/api/quotes/public/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const [quote] = await db.select().from(quotes).where(eq(quotes.publicToken, token));
      if (!quote) return res.status(404).json({ message: "Proposal not found" });
      if (quote.expiresAt && new Date(quote.expiresAt) < /* @__PURE__ */ new Date()) {
        return res.status(410).json({ message: "This proposal has expired" });
      }
      if (!quote.viewedAt) {
        await db.update(quotes).set({ viewedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(quotes.id, quote.id));
      }
      const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
      const enrichedItems = await Promise.all(items.map(async (item) => {
        let itemName = "";
        let itemDescription = "";
        if (item.itemType === "product" && item.productId) {
          const [p] = await db.select().from(products).where(eq(products.id, item.productId));
          if (p) {
            itemName = p.name;
            itemDescription = p.description || "";
          }
        } else if (item.itemType === "bundle" && item.bundleId) {
          const [b] = await db.select().from(productBundles).where(eq(productBundles.id, item.bundleId));
          if (b) {
            itemName = b.name;
            itemDescription = b.description || "";
          }
        } else if (item.itemType === "package" && item.packageId) {
          const [pkg] = await db.select().from(productPackages).where(eq(productPackages.id, item.packageId));
          if (pkg) {
            itemName = pkg.name;
            itemDescription = pkg.description || "";
          }
        }
        return { ...item, itemName, itemDescription };
      }));
      let clientName = "";
      if (quote.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        if (c) clientName = c.company || c.contactName || "";
      } else if (quote.leadId) {
        const [l] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
        if (l) clientName = l.name || "";
      }
      const activeTerms = await db.select().from(proposalTerms).where(eq(proposalTerms.isActive, true)).orderBy(desc(proposalTerms.version)).limit(1);
      let paymentAmount = parseFloat(quote.clientBudget || quote.totalCost || "0");
      if (quote.paymentAmountType === "custom" && quote.customPaymentAmount) {
        paymentAmount = parseFloat(quote.customPaymentAmount);
      }
      const branding = await loadBranding();
      res.json({
        proposal: {
          id: quote.id,
          status: quote.status,
          signedAt: quote.signedAt,
          signedByName: quote.signedByName,
          signedByEmail: quote.signedByEmail,
          termsAccepted: quote.termsAccepted,
          paymentMethod: quote.paymentMethod,
          paymentStatus: quote.paymentStatus,
          paidAt: quote.paidAt,
          paidAmount: quote.paidAmount,
          paymentAmountType: quote.paymentAmountType,
          expiresAt: quote.expiresAt
        },
        quote: { name: quote.name, totalCost: quote.totalCost, clientBudget: quote.clientBudget, notes: quote.notes },
        items: enrichedItems,
        clientName,
        terms: activeTerms[0] || null,
        paymentAmount,
        stripeConfigured: isStripeConfigured(),
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        branding
      });
    } catch (error) {
      console.error("Error fetching public proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });
  app.post("/api/quotes/public/:token/sign", async (req, res) => {
    try {
      const { token } = req.params;
      const { signerName, signerEmail, signatureData, termsAccepted } = req.body;
      if (!signerName || !signerEmail || !signatureData) {
        return res.status(400).json({ message: "signerName, signerEmail, and signatureData are required" });
      }
      if (!termsAccepted) {
        return res.status(400).json({ message: "You must accept the Terms & Conditions" });
      }
      const [quote] = await db.select().from(quotes).where(eq(quotes.publicToken, token));
      if (!quote) return res.status(404).json({ message: "Proposal not found" });
      if (quote.signedAt) {
        return res.status(400).json({ message: "This proposal has already been signed" });
      }
      if (quote.expiresAt && new Date(quote.expiresAt) < /* @__PURE__ */ new Date()) {
        return res.status(410).json({ message: "This proposal has expired" });
      }
      const activeTerms = await db.select().from(proposalTerms).where(eq(proposalTerms.isActive, true)).orderBy(desc(proposalTerms.version)).limit(1);
      const [updated] = await db.update(quotes).set({
        status: "signed",
        signedAt: /* @__PURE__ */ new Date(),
        signedByName: signerName,
        signedByEmail: signerEmail,
        signatureData,
        termsAccepted: true,
        termsVersionId: activeTerms[0]?.id || null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(quotes.id, quote.id)).returning();
      if (quote.sentByUserId) {
        const [sender] = await db.select().from(staff).where(eq(staff.id, quote.sentByUserId));
        if (sender) {
          try {
            await notificationService.sendDirectEmail({
              to: sender.email,
              subject: `Proposal Signed: ${quote.name}`,
              text: `Great news! ${signerName} (${signerEmail}) has signed the proposal "${quote.name}". Awaiting payment.`
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
  app.post("/api/quotes/public/:token/pay", async (req, res) => {
    try {
      const { token } = req.params;
      const { paymentMethod } = req.body;
      if (!paymentMethod || !["card", "ach"].includes(paymentMethod)) {
        return res.status(400).json({ message: "paymentMethod must be 'card' or 'ach'" });
      }
      if (!isStripeConfigured()) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }
      const [quote] = await db.select().from(quotes).where(eq(quotes.publicToken, token));
      if (!quote) return res.status(404).json({ message: "Proposal not found" });
      if (!quote.signedAt) {
        return res.status(400).json({ message: "Proposal must be signed before payment" });
      }
      if (quote.paidAt) {
        return res.status(400).json({ message: "Payment has already been completed" });
      }
      let paymentAmount = parseFloat(quote.clientBudget || quote.totalCost || "0");
      if (quote.paymentAmountType === "custom" && quote.customPaymentAmount) {
        paymentAmount = parseFloat(quote.customPaymentAmount);
      }
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }
      const metadata = {
        quoteId: quote.id,
        clientId: quote.clientId || "",
        leadId: quote.leadId || ""
      };
      let result;
      if (paymentMethod === "ach") {
        result = await createACHPaymentIntent(
          paymentAmount,
          quote.signedByEmail || "",
          quote.signedByName || "",
          metadata
        );
      } else {
        const stripe = getStripe();
        if (!stripe) return res.status(503).json({ message: "Stripe not configured" });
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(paymentAmount * 100),
          currency: "usd",
          payment_method_types: ["card"],
          metadata
        });
        result = { paymentIntent, clientSecret: paymentIntent.client_secret };
      }
      if (!result) {
        return res.status(500).json({ message: "Failed to create payment" });
      }
      await db.update(quotes).set({
        paymentMethod,
        paymentIntentId: result.paymentIntent.id,
        paymentStatus: "pending",
        paidAmount: paymentAmount.toString(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(quotes.id, quote.id));
      res.json({ clientSecret: result.clientSecret });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  app.get("/api/proposal-terms", requireAuth(), async (req, res) => {
    try {
      const terms = await db.select().from(proposalTerms).orderBy(desc(proposalTerms.version));
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
        return res.status(400).json({ message: "Title and content are required" });
      }
      const existing = await db.select().from(proposalTerms).orderBy(desc(proposalTerms.version)).limit(1);
      const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;
      if (existing.length > 0) {
        await db.update(proposalTerms).set({ isActive: false }).where(eq(proposalTerms.isActive, true));
      }
      const [newTerms] = await db.insert(proposalTerms).values({
        title,
        content,
        version: nextVersion,
        isActive: true
      }).returning();
      res.json(newTerms);
    } catch (error) {
      console.error("Error updating proposal terms:", error);
      res.status(500).json({ message: "Failed to update proposal terms" });
    }
  });
  app.get("/api/settings/proposal-branding", requireAuth(), async (req, res) => {
    try {
      const branding = await loadBranding();
      res.json(branding);
    } catch (error) {
      console.error("Error fetching proposal branding:", error);
      res.status(500).json({ message: "Failed to fetch proposal branding" });
    }
  });
  app.put("/api/settings/proposal-branding", requireAuth(), async (req, res) => {
    try {
      const brandingSchema = z.object({
        logoUrl: z.string().max(2e3).default(""),
        companyName: z.string().max(200).default(""),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #00C9C6)").default("#00C9C6"),
        footerText: z.string().max(500).default("")
      });
      const parsed = brandingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid branding data", errors: parsed.error.flatten().fieldErrors });
      }
      const brandingData = parsed.data;
      const [existing] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, "proposal_branding"));
      if (existing) {
        await db.update(taskSettings).set({ settingValue: brandingData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(taskSettings.settingKey, "proposal_branding"));
      } else {
        await db.insert(taskSettings).values({
          settingKey: "proposal_branding",
          settingValue: brandingData
        });
      }
      res.json(brandingData);
    } catch (error) {
      console.error("Error saving proposal branding:", error);
      res.status(500).json({ message: "Failed to save proposal branding" });
    }
  });
  app.get("/api/stripe/config", async (req, res) => {
    res.json({
      configured: isStripeConfigured(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
    });
  });
}
function generateProposalEmailHtml(clientName, quoteName, proposalUrl, branding = {}) {
  const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const rawColor = branding.primaryColor || "#00C9C6";
  const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : "#00C9C6";
  const darkerColor = adjustColor(color, -15);
  const companyName = escHtml(branding.companyName || "");
  const logoHtml = branding.logoUrl ? `<img src="${escHtml(branding.logoUrl)}" alt="${companyName}" style="max-height: 48px; max-width: 200px; margin-bottom: 12px;" />` : "";
  const footerContent = branding.footerText ? `<p style="margin-bottom: 8px;">${escHtml(branding.footerText)}</p>` : "";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Proposal is Ready</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 16px; }
    .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
    .greeting { font-size: 18px; margin-bottom: 20px; }
    .details { background: #f8fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #eef1f3; }
    .details-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
    .details-value { font-size: 18px; font-weight: 600; color: #333; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; padding: 16px 40px; background: ${color}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: center; margin-bottom: 12px; }
    .step-number { width: 28px; height: 28px; border-radius: 50%; background: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
    .footer { background: #f5f5f5; padding: 24px; text-align: center; font-size: 13px; color: #888; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    ${companyName ? `<p style="font-size: 13px; opacity: 0.85; margin-bottom: 12px; letter-spacing: 0.5px;">${companyName}</p>` : ""}
    <h1>Your Proposal is Ready</h1>
    <p>Review, sign, and pay \u2014 all in one place</p>
  </div>
  <div class="content">
    <p class="greeting">Hi ${escHtml(clientName)},</p>
    <p>We've prepared a proposal for you. Please review the details, sign, and complete payment to get started.</p>
    <div class="details">
      <div class="details-label">Proposal</div>
      <div class="details-value">${escHtml(quoteName)}</div>
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
    ${footerContent}
    <p>This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>`;
}
function adjustColor(hex, amount) {
  let color = hex.replace("#", "");
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, (num >> 16 & 255) + amount));
  const g = Math.max(0, Math.min(255, (num >> 8 & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
async function handleStripeWebhook(req, res, notificationService) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return res.status(400).json({ message: "Missing signature or webhook secret" });
  }
  let event;
  try {
    event = constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const quoteId = paymentIntent.metadata?.quoteId;
    if (quoteId) {
      try {
        const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
        if (quote) {
          await db.update(quotes).set({
            status: "completed",
            paymentStatus: "paid",
            paidAt: /* @__PURE__ */ new Date(),
            paidAmount: (paymentIntent.amount / 100).toFixed(2),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(quotes.id, quoteId));
          await triggerQuoteFulfillment(quote, notificationService);
        }
      } catch (error) {
        console.error("Error processing payment success:", error);
      }
    }
  }
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const quoteId = paymentIntent.metadata?.quoteId;
    if (quoteId) {
      await db.update(quotes).set({
        paymentStatus: "failed",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(quotes.id, quoteId));
    }
  }
  res.json({ received: true });
}
async function triggerQuoteFulfillment(quote, notificationService) {
  try {
    console.log(`[Quote Fulfillment] Starting fulfillment for quote ${quote.id}`);
    if (quote.sentByUserId) {
      const [sender] = await db.select().from(staff).where(eq(staff.id, quote.sentByUserId));
      if (sender) {
        try {
          await notificationService.sendDirectEmail({
            to: sender.email,
            subject: `Payment Received: ${quote.name}`,
            text: `Payment has been received for proposal "${quote.name}" from ${quote.signedByName}. The proposal is now complete and fulfillment has been triggered.`
          });
        } catch (e) {
          console.error("[Quote Fulfillment] Error sending payment notification:", e);
        }
      }
    }
    let clientId = quote.clientId;
    if (quote.leadId && !clientId) {
      try {
        const [lead] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
        if (lead) {
          const existingClient = await db.select().from(clients).where(eq(clients.email, lead.email || "")).limit(1);
          if (existingClient.length > 0) {
            clientId = existingClient[0].id;
            console.log(`[Quote Fulfillment] Lead ${lead.id} already converted to client ${clientId}`);
          } else {
            const [newClient] = await db.insert(clients).values({
              name: lead.company || lead.name || quote.signedByName || "New Client",
              email: lead.email || quote.signedByEmail || "",
              phone: lead.phone || "",
              company: lead.company || "",
              status: "active"
            }).returning();
            clientId = newClient.id;
            console.log(`[Quote Fulfillment] Created client ${clientId} from lead ${lead.id}`);
            const dealValue = parseFloat(quote.totalCost || "0");
            await db.insert(deals).values({
              leadId: lead.id,
              clientId,
              name: `${newClient.name} - ${lead.company || "Deal"}`,
              assignedTo: lead.assignedTo,
              value: dealValue,
              mrr: quote.mrr ? parseFloat(quote.mrr.toString()) : 0,
              wonDate: /* @__PURE__ */ new Date(),
              notes: `Deal created from proposal payment. Quote: ${quote.name || quote.id}`
            });
            console.log(`[Quote Fulfillment] Created deal for client ${clientId}`);
            const closedWonStage = await db.select().from(leadPipelineStages).where(sql`LOWER(${leadPipelineStages.name}) = 'closed won'`).limit(1);
            const leadUpdate = { status: "Won" };
            if (closedWonStage.length > 0) {
              leadUpdate.stageId = closedWonStage[0].id;
            }
            await db.update(leads).set(leadUpdate).where(eq(leads.id, lead.id));
            console.log(`[Quote Fulfillment] Updated lead ${lead.id} to Won`);
          }
          await db.update(quotes).set({ clientId }).where(eq(quotes.id, quote.id));
        }
      } catch (e) {
        console.error("[Quote Fulfillment] Error converting lead:", e);
      }
    }
    if (clientId) {
      try {
        const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
        let transferredCount = 0;
        for (const item of items) {
          if (item.itemType === "product" && item.productId) {
            const existing = await db.select().from(clientProducts).where(and(eq(clientProducts.clientId, clientId), eq(clientProducts.productId, item.productId))).limit(1);
            if (existing.length === 0) {
              await db.insert(clientProducts).values({ clientId, productId: item.productId });
              transferredCount++;
            }
          } else if (item.itemType === "bundle" && item.bundleId) {
            const existing = await db.select().from(clientBundles).where(and(eq(clientBundles.clientId, clientId), eq(clientBundles.bundleId, item.bundleId))).limit(1);
            if (existing.length === 0) {
              await db.insert(clientBundles).values({ clientId, bundleId: item.bundleId, customQuantities: item.customQuantities });
              transferredCount++;
            }
          } else if (item.itemType === "package" && item.packageId) {
            const existingPkg = await db.select().from(clientPackages).where(and(eq(clientPackages.clientId, clientId), eq(clientPackages.packageId, item.packageId))).limit(1);
            if (existingPkg.length === 0) {
              await db.insert(clientPackages).values({
                clientId,
                packageId: item.packageId,
                price: item.unitCost?.toString() || "0",
                status: "active",
                customQuantities: item.customQuantities
              });
              transferredCount++;
            }
            const pkgItems = await db.select().from(packageItems).where(eq(packageItems.packageId, item.packageId));
            for (const pkgItem of pkgItems) {
              if (pkgItem.itemType === "bundle" && pkgItem.bundleId) {
                const ex = await db.select().from(clientBundles).where(and(eq(clientBundles.clientId, clientId), eq(clientBundles.bundleId, pkgItem.bundleId))).limit(1);
                if (ex.length === 0) {
                  await db.insert(clientBundles).values({ clientId, bundleId: pkgItem.bundleId });
                  transferredCount++;
                }
              } else if (pkgItem.itemType === "product" && pkgItem.productId) {
                const ex = await db.select().from(clientProducts).where(and(eq(clientProducts.clientId, clientId), eq(clientProducts.productId, pkgItem.productId))).limit(1);
                if (ex.length === 0) {
                  await db.insert(clientProducts).values({ clientId, productId: pkgItem.productId });
                  transferredCount++;
                }
              }
            }
          }
        }
        console.log(`[Quote Fulfillment] Transferred ${transferredCount} items from quote ${quote.id} to client ${clientId}`);
      } catch (e) {
        console.error("[Quote Fulfillment] Error transferring products:", e);
      }
      try {
        const [autoGenSetting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, "task_mapping_auto_generate_on_conversion"));
        const autoGenEnabled = autoGenSetting ? autoGenSetting.settingValue?.enabled !== false : true;
        if (autoGenEnabled) {
          const assignedProducts = await db.select().from(clientProducts).where(eq(clientProducts.clientId, clientId));
          const assignedBundles = await db.select().from(clientBundles).where(eq(clientBundles.clientId, clientId));
          const assignedPackages = await db.select().from(clientPackages).where(eq(clientPackages.clientId, clientId));
          const generationItems = [];
          for (const cp of assignedProducts) {
            let qty = 1;
            const [qi] = await db.select({ quantity: quoteItems.quantity }).from(quoteItems).where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.productId, cp.productId), eq(quoteItems.itemType, "product"))).limit(1);
            if (qi) qty = qi.quantity;
            generationItems.push({ productId: cp.productId, quantity: qty });
          }
          for (const cb of assignedBundles) {
            let qty = 1;
            const [qi] = await db.select({ quantity: quoteItems.quantity }).from(quoteItems).where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.bundleId, cb.bundleId), eq(quoteItems.itemType, "bundle"))).limit(1);
            if (qi) qty = qi.quantity;
            generationItems.push({ bundleId: cb.bundleId, quantity: qty });
          }
          for (const cpkg of assignedPackages) {
            let qty = 1;
            const [qi] = await db.select({ quantity: quoteItems.quantity }).from(quoteItems).where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.packageId, cpkg.packageId), eq(quoteItems.itemType, "package"))).limit(1);
            if (qi) qty = qi.quantity;
            generationItems.push({ packageId: cpkg.packageId, quantity: qty });
          }
          if (generationItems.length > 0) {
            const result = await generateTasksFromTemplates({
              clientId,
              items: generationItems,
              generationType: "onboarding",
              cycleStartDate: /* @__PURE__ */ new Date()
            });
            console.log(`[Quote Fulfillment] Generated ${result.totalTasksCreated} onboarding tasks for client ${clientId}`);
          }
          const [cycleLengthSetting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, "task_mapping_default_cycle_length"));
          const defaultCycleLength = cycleLengthSetting?.settingValue?.value ?? 30;
          const [advanceGenSetting] = await db.select().from(taskSettings).where(eq(taskSettings.settingKey, "task_mapping_default_advance_generation_days"));
          const defaultAdvanceDays = advanceGenSetting?.settingValue?.value ?? 3;
          const existingConfig = await db.select().from(clientRecurringConfig).where(eq(clientRecurringConfig.clientId, clientId)).limit(1);
          if (existingConfig.length === 0) {
            await db.insert(clientRecurringConfig).values({
              clientId,
              cycleStartDate: /* @__PURE__ */ new Date(),
              cycleLengthDays: defaultCycleLength,
              advanceGenerationDays: defaultAdvanceDays,
              status: "active"
            });
            console.log(`[Quote Fulfillment] Created recurring config for client ${clientId}`);
          }
        }
      } catch (e) {
        console.error("[Quote Fulfillment] Error generating tasks:", e);
      }
    }
    console.log(`[Quote Fulfillment] Fulfillment complete for quote ${quote.id}`);
  } catch (error) {
    console.error("[Quote Fulfillment] Error:", error);
  }
}

export {
  registerProposalRoutes,
  handleStripeWebhook
};
