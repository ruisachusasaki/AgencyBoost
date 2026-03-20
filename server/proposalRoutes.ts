import express, { type Express } from "express";
import { db } from "./db";
import { proposalTerms, quotes, quoteItems, clients, leads, staff, products, productBundles, productPackages, clientProducts, clientBundles, clientPackages, packageItems, bundleProducts, deals, leadPipelineStages, taskSettings, clientRecurringConfig, businessProfile, clientOnboardingFormConfig, documents } from "@shared/schema";
import { eq, desc, and, sql, lt, isNull, asc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createPaymentIntent, createACHPaymentIntent, isStripeConfigured, isStripeConfiguredAsync, constructWebhookEvent, getStripe, getStripeAsync, getOrCreateCustomer, createSubscription, getStripePublishableKey, getStripeWebhookSecret } from "./stripe";
import { NotificationService } from "./notification-service";
import { generateTasksFromTemplates } from "./taskGenerationEngine";
import { convertLeadToClient } from "./services/leadConversionService";
import PDFDocument from "pdfkit";
import { ObjectStorageService } from "./objectStorage";

function generatePublicToken(): string {
  return randomBytes(32).toString("hex");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function generateSignedAgreementPdf(params: {
  quote: any;
  quoteItemsList: any[];
  termsContent: string;
  termsTitle: string;
  signerName: string;
  signerEmail: string;
  signerIpAddress: string;
  signedAt: Date;
  signatureData: string;
  companyName: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).font('Helvetica-Bold').text('Signed Service Agreement', { align: 'center' });
    doc.moveDown(0.5);

    if (params.companyName) {
      doc.fontSize(14).font('Helvetica').fillColor('#666666').text(params.companyName, { align: 'center' });
      doc.moveDown(0.3);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    doc.fillColor('#000000');
    doc.fontSize(12).font('Helvetica-Bold').text('Proposal Details');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Proposal: ${params.quote.name}`);
    if (params.quote.buildFee && Number(params.quote.buildFee) > 0) {
      doc.text(`Build Investment: $${Number(params.quote.buildFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    }
    if (params.quote.monthlyCost && Number(params.quote.monthlyCost) > 0) {
      doc.text(`Monthly Investment: $${Number(params.quote.monthlyCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    }
    doc.moveDown(0.5);

    if (params.quoteItemsList.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Services Included');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      for (const item of params.quoteItemsList) {
        doc.text(`• ${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`, { indent: 10 });
      }
      doc.moveDown(0.5);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text(params.termsTitle || 'Service Agreement');
    doc.moveDown(0.3);
    const plainTerms = stripHtml(params.termsContent);
    doc.fontSize(9).font('Helvetica').text(plainTerms, { lineGap: 2 });
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Electronic Signature');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Signed By: ${params.signerName}`);
    doc.text(`Email: ${params.signerEmail}`);
    doc.text(`Date Signed: ${params.signedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`);
    doc.text(`IP Address: ${params.signerIpAddress}`);
    doc.moveDown(0.5);

    if (params.signatureData.startsWith('data:image')) {
      try {
        const base64Data = params.signatureData.split(',')[1];
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.text('Signature:');
        doc.image(imgBuffer, { width: 200, height: 60 });
      } catch (e) {
        doc.text(`Signature: ${params.signerName}`, { font: 'Helvetica-Oblique' });
      }
    } else {
      const displaySig = params.signatureData.startsWith('typed:')
        ? params.signatureData.slice(6)
        : params.signatureData;
      doc.text('Signature:');
      doc.font('Helvetica-Oblique').fontSize(18).text(displaySig);
      doc.font('Helvetica').fontSize(10);
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor('#999999').text(
      `This document was electronically signed on ${params.signedAt.toISOString()} from IP address ${params.signerIpAddress}. ` +
      `The signer confirmed: "I have read and agree to the terms. I authorize this electronic signature as my binding signature."`,
      { align: 'center' }
    );

    doc.end();
  });
}

async function loadEmailTemplate() {
  const defaults = {
    subjectLine: "Your Proposal: {{proposalName}}",
    headerTitle: "Your Proposal is Ready",
    headerSubtitle: "Review, sign, and pay — all in one place",
    greeting: "Hi {{clientName}},",
    introText: "We've prepared a proposal for you. Please review the details, sign, and complete payment to get started.",
    step1: "Review the proposal details and pricing",
    step2: "Accept terms and sign electronically",
    step3: "Complete payment via credit card or bank transfer",
    buttonText: "View & Sign Proposal",
    closingText: "If you have any questions, please don't hesitate to reach out.",
  };
  try {
    const [setting] = await db.select().from(taskSettings)
      .where(eq(taskSettings.settingKey, 'proposal_email_template'));
    if (setting?.settingValue) {
      return { ...defaults, ...(setting.settingValue as any) };
    }
  } catch (e) {}
  return defaults;
}

async function loadBranding() {
  let branding: any = { logoUrl: "", companyName: "", primaryColor: "#00C9C6", footerText: "" };
  const [brandingSetting] = await db.select().from(taskSettings)
    .where(eq(taskSettings.settingKey, 'proposal_branding'));
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

export function registerProposalRoutes(
  app: Express,
  requireAuth: () => any,
  requirePermission: (module: string, permission: string) => any,
  notificationService: NotificationService
) {

  app.post("/api/quotes/:id/send-proposal", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { recipientEmail, recipientName, paymentAmountType, customPaymentAmount, billingMode } = req.body;

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
      const expiresAt = quote.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const updateData: any = {
        status: "sent",
        publicToken,
        expiresAt,
        sentAt: new Date(),
        sentByUserId: (req as any).user?.id,
        updatedAt: new Date(),
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
      if (billingMode && ["trial", "immediate"].includes(billingMode)) {
        updateData.billingMode = billingMode;
      }

      const [updated] = await db
        .update(quotes)
        .set(updateData)
        .where(eq(quotes.id, id))
        .returning();

      const appUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "https://agencyflow.app";

      const proposalUrl = `${appUrl}/proposal/${publicToken}`;
      const quoteName = quote.name || "Your Proposal";

      const branding = await loadBranding();
      const emailTpl = await loadEmailTemplate();
      const html = generateProposalEmailHtml(clientName, quoteName, proposalUrl, branding, emailTpl, appUrl);

      const subject = applyMergeTags(emailTpl.subjectLine, clientName, quoteName);
      const emailResult = await notificationService.sendDirectEmail({
        to: clientEmail,
        subject,
        text: `${applyMergeTags(emailTpl.greeting, clientName, quoteName)}\n\n${applyMergeTags(emailTpl.introText, clientName, quoteName)}\n\n${proposalUrl}\n\nThank you!`,
        html,
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
        if (lead) { clientEmail = lead.email; clientName = lead.name || clientName; }
      }
      if (!clientEmail && quote.clientId) {
        const [client] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        if (client) { clientEmail = client.email; clientName = client.company || client.contactName || clientName; }
      }

      if (!clientEmail) {
        return res.status(400).json({ message: "No recipient email found" });
      }

      const appUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "https://agencyflow.app";

      const proposalUrl = `${appUrl}/proposal/${quote.publicToken}`;
      const branding = await loadBranding();
      const emailTpl = await loadEmailTemplate();
      const html = generateProposalEmailHtml(clientName, quote.name, proposalUrl, branding, emailTpl, appUrl);

      const subject = applyMergeTags(emailTpl.subjectLine, clientName, quote.name);
      const emailResult = await notificationService.sendDirectEmail({
        to: clientEmail,
        subject,
        text: `${applyMergeTags(emailTpl.greeting, clientName, quote.name)}\n\n${applyMergeTags(emailTpl.introText, clientName, quote.name)}\n\n${proposalUrl}\n\nThank you!`,
        html,
      });

      res.json({ emailSent: emailResult.sent, recipientEmail: clientEmail });
    } catch (error) {
      console.error("Error resending proposal:", error);
      res.status(500).json({ message: "Failed to resend proposal" });
    }
  });

  app.post("/api/quotes/:id/generate-token", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
      if (!quote) return res.status(404).json({ message: "Quote not found" });

      if (quote.publicToken) {
        return res.json({ publicToken: quote.publicToken });
      }

      const publicToken = generatePublicToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.update(quotes)
        .set({ publicToken, expiresAt })
        .where(eq(quotes.id, id));

      res.json({ publicToken });
    } catch (error) {
      console.error("Error generating proposal token:", error);
      res.status(500).json({ message: "Failed to generate proposal link" });
    }
  });

  app.get("/api/quotes/public/:token/onboarding-url", async (req, res) => {
    try {
      const { token } = req.params;
      const [quote] = await db.select().from(quotes).where(eq(quotes.publicToken, token));
      if (!quote) return res.status(404).json({ error: "Quote not found" });
      
      const clientId = quote.clientId;
      if (!clientId) return res.json({ onboardingUrl: null });
      
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
      if (!client || !client.onboardingToken || client.onboardingCompleted) {
        return res.json({ onboardingUrl: null });
      }
      
      res.json({ onboardingUrl: `/client-onboarding/${client.onboardingToken}` });
    } catch (error) {
      console.error("Error fetching onboarding URL:", error);
      res.json({ onboardingUrl: null });
    }
  });

  app.get("/api/quotes/public/:token", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      const { token } = req.params;
      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.publicToken, token));

      if (!quote) return res.status(404).json({ message: "Proposal not found" });

      if (quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
        return res.status(410).json({ message: "This proposal has expired" });
      }

      if (!quote.viewedAt) {
        await db
          .update(quotes)
          .set({ viewedAt: new Date(), updatedAt: new Date() })
          .where(eq(quotes.id, quote.id));
      }

      const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));

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
          if (pkg) {
            itemName = pkg.name;
            itemDescription = pkg.description || "";
            const pkgItemsList = await db.select().from(packageItems).where(eq(packageItems.packageId, item.packageId));
            const packageContents: Array<{ name: string; type: string; items?: string[] }> = [];
            for (const pi of pkgItemsList) {
              if (pi.itemType === 'bundle' && pi.bundleId) {
                const [b] = await db.select({ name: productBundles.name }).from(productBundles).where(eq(productBundles.id, pi.bundleId));
                if (b) {
                  const customQtys = item.customQuantities || {};
                  const bps = await db.select({ name: products.name, productId: bundleProducts.productId, quantity: bundleProducts.quantity }).from(bundleProducts).leftJoin(products, eq(bundleProducts.productId, products.id)).where(eq(bundleProducts.bundleId, pi.bundleId));
                  const bundleItems = bps.filter(bp => bp.name).map(bp => ({
                    name: bp.name!,
                    quantity: customQtys[bp.productId!] !== undefined ? customQtys[bp.productId!] : (bp.quantity || 1)
                  }));
                  packageContents.push({ name: b.name, type: 'bundle', items: bundleItems });
                }
              } else if (pi.itemType === 'product' && pi.productId) {
                const [p] = await db.select({ name: products.name }).from(products).where(eq(products.id, pi.productId));
                if (p) packageContents.push({ name: p.name, type: 'product' });
              }
            }
            return { ...item, itemName, itemDescription, packageContents };
          }
        }
        return { ...item, itemName, itemDescription };
      }));

      let clientName = "";
      let clientEmail = "";
      if (quote.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        if (c) {
          clientName = c.company || c.contactName || "";
          clientEmail = c.email || "";
        }
      } else if (quote.leadId) {
        const [l] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
        if (l) {
          clientName = l.name || "";
          clientEmail = l.email || "";
        }
      }

      const activeTerms = await db
        .select()
        .from(proposalTerms)
        .where(eq(proposalTerms.isActive, true))
        .orderBy(desc(proposalTerms.version))
        .limit(1);

      const buildFee = parseFloat(quote.oneTimeCost || "0");
      const monthlyFee = parseFloat(quote.clientBudget || "0");
      const billingMode = quote.billingMode || "trial";

      let payNowAmount = buildFee;
      if (billingMode === "immediate") {
        payNowAmount = buildFee + monthlyFee;
      }

      let paymentAmount = payNowAmount;
      if (quote.paymentAmountType === "custom" && quote.customPaymentAmount) {
        paymentAmount = parseFloat(quote.customPaymentAmount);
      }

      const branding = await loadBranding();

      let clientData: any = null;
      if (quote.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        if (c) clientData = c;
      } else if (quote.leadId) {
        const [l] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
        if (l) clientData = { company: l.company, name: l.name, email: l.email, phone: l.phone };
      }

      let businessData: any = null;
      const [bp] = await db.select().from(businessProfile).limit(1);
      if (bp) businessData = bp;

      const servicesList = enrichedItems.map((item: any) => item.itemName).filter(Boolean).join(", ");

      const formatCurrency = (val: number) => val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const effectiveDate = quote.sentAt ? new Date(quote.sentAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      const resolvedTerms = quote.customAgreement
        ? { id: 'custom', title: activeTerms[0]?.title || 'Service Agreement', content: quote.customAgreement, version: activeTerms[0]?.version || 1, isActive: true }
        : activeTerms[0] ? { ...activeTerms[0] } : null;
      if (resolvedTerms?.content) {
        const mergeMap: Record<string, string> = {
          "{{clientCompany}}": clientData?.company || clientData?.name || clientName || "",
          "{{clientContactName}}": clientData?.contactName || clientData?.name || clientName || "",
          "{{clientEmail}}": clientData?.email || "",
          "{{clientPhone}}": clientData?.phone || "",
          "{{clientAddress}}": clientData?.address || "",
          "{{clientAddress2}}": clientData?.address2 || "",
          "{{clientCity}}": clientData?.city || "",
          "{{clientState}}": clientData?.state || "",
          "{{clientZipCode}}": clientData?.zipCode || "",
          "{{clientCityStateZip}}": [clientData?.city, clientData?.state, clientData?.zipCode].filter(Boolean).join(", ") || "",
          "{{clientWebsite}}": clientData?.website || "",
          "{{proposalName}}": quote.name || "",
          "{{effectiveDate}}": effectiveDate,
          "{{buildInvestment}}": `$${formatCurrency(buildFee)}`,
          "{{monthlyInvestment}}": `$${formatCurrency(monthlyFee)}`,
          "{{servicesList}}": servicesList,
          "{{billingFrequency}}": monthlyFee > 0 ? "monthly" : "one-time",
          "{{businessName}}": businessData?.companyName || "",
          "{{businessEmail}}": businessData?.email || "",
          "{{businessPhone}}": businessData?.phone || "",
          "{{businessAddress}}": businessData?.address || "",
          "{{businessCity}}": businessData?.city || "",
          "{{businessState}}": businessData?.state || "",
          "{{businessZipCode}}": businessData?.zipCode || "",
          "{{signerName}}": quote.signedByName || "",
          "{{signerEmail}}": quote.signedByEmail || "",
          "{{signerIpAddress}}": quote.signerIpAddress || "",
          "{{SIGNER_IP_ADDRESS}}": quote.signerIpAddress || "",
          "{{signatureDate}}": quote.signedAt ? new Date(quote.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
        };

        let content = resolvedTerms.content;
        for (const [tag, value] of Object.entries(mergeMap)) {
          content = content.split(tag).join(value);
        }
        resolvedTerms.content = content;
      }

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
          expiresAt: quote.expiresAt,
          subscriptionStatus: quote.subscriptionStatus,
        },
        quote: { name: quote.name, totalCost: quote.totalCost, clientBudget: quote.clientBudget, notes: quote.notes, oneTimeCost: quote.oneTimeCost, monthlyCost: quote.monthlyCost },
        items: enrichedItems,
        clientName,
        clientEmail,
        terms: resolvedTerms,
        paymentAmount,
        buildFee,
        monthlyFee,
        billingMode,
        payNowAmount,
        stripeConfigured: await isStripeConfiguredAsync(),
        stripePublishableKey: await getStripePublishableKey() || null,
        branding,
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

      const signerIpAddress = req.headers["x-forwarded-for"]
        ? (Array.isArray(req.headers["x-forwarded-for"]) ? req.headers["x-forwarded-for"][0] : req.headers["x-forwarded-for"].split(",")[0].trim())
        : req.socket?.remoteAddress || "Unknown";

      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.publicToken, token));

      if (!quote) return res.status(404).json({ message: "Proposal not found" });

      if (quote.signedAt) {
        return res.status(400).json({ message: "This proposal has already been signed" });
      }

      if (quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
        return res.status(410).json({ message: "This proposal has expired" });
      }

      const activeTerms = await db
        .select()
        .from(proposalTerms)
        .where(eq(proposalTerms.isActive, true))
        .orderBy(desc(proposalTerms.version))
        .limit(1);

      const [updated] = await db
        .update(quotes)
        .set({
          status: "signed",
          signedAt: new Date(),
          signedByName: signerName,
          signedByEmail: signerEmail,
          signerIpAddress,
          signatureData,
          termsAccepted: true,
          termsVersionId: activeTerms[0]?.id || null,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quote.id))
        .returning();

      if (quote.sentByUserId) {
        const [sender] = await db.select().from(staff).where(eq(staff.id, quote.sentByUserId));
        if (sender) {
          try {
            await notificationService.sendDirectEmail({
              to: sender.email,
              subject: `Proposal Signed: ${quote.name}`,
              text: `Great news! ${signerName} (${signerEmail}) has signed the proposal "${quote.name}". Awaiting payment.`,
            });
          } catch (e) {
            console.error("Error sending signature notification:", e);
          }
        }
      }

      (async () => {
        try {
          const qItems = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));

          const enrichedItems: { name: string; quantity: number }[] = [];
          for (const item of qItems) {
            let itemName = "";
            if (item.itemType === "product" && item.productId) {
              const [p] = await db.select().from(products).where(eq(products.id, item.productId));
              itemName = p?.name || "Product";
            } else if (item.itemType === "bundle" && item.bundleId) {
              const [b] = await db.select().from(productBundles).where(eq(productBundles.id, item.bundleId));
              itemName = b?.name || "Bundle";
            } else if (item.itemType === "package" && item.packageId) {
              const [pkg] = await db.select().from(productPackages).where(eq(productPackages.id, item.packageId));
              itemName = pkg?.name || "Package";
            }
            enrichedItems.push({ name: itemName || item.itemType, quantity: item.quantity });
          }

          let companyName = "";
          let businessData: any = null;
          try {
            const [bp] = await db.select().from(businessProfile).limit(1);
            companyName = bp?.companyName || "";
            businessData = bp;
          } catch (e) {}

          let clientData: any = null;
          if (quote.clientId) {
            const [c] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
            if (c) clientData = c;
          }
          if (!clientData && quote.leadId) {
            const [l] = await db.select().from(leads).where(eq(leads.id, quote.leadId));
            if (l) clientData = l;
          }

          let termsContent = activeTerms[0]?.content || "";
          if (quote.customAgreement) {
            termsContent = quote.customAgreement;
          }

          const buildFee = Number(quote.buildFee) || 0;
          const monthlyFee = Number(quote.monthlyCost) || 0;
          const servicesList = enrichedItems.map(i => i.name).filter(Boolean).join(", ");
          const formatCurrencyFn = (val: number) => val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const effectiveDateStr = quote.sentAt ? new Date(quote.sentAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

          const mergeMap: Record<string, string> = {
            "{{clientCompany}}": clientData?.company || clientData?.name || signerName || "",
            "{{clientContactName}}": clientData?.contactName || clientData?.name || signerName || "",
            "{{clientEmail}}": clientData?.email || signerEmail || "",
            "{{clientPhone}}": clientData?.phone || "",
            "{{clientAddress}}": clientData?.address || "",
            "{{clientAddress2}}": clientData?.address2 || "",
            "{{clientCity}}": clientData?.city || "",
            "{{clientState}}": clientData?.state || "",
            "{{clientZipCode}}": clientData?.zipCode || "",
            "{{clientCityStateZip}}": [clientData?.city, clientData?.state, clientData?.zipCode].filter(Boolean).join(", ") || "",
            "{{clientWebsite}}": clientData?.website || "",
            "{{proposalName}}": quote.name || "",
            "{{effectiveDate}}": effectiveDateStr,
            "{{buildInvestment}}": `$${formatCurrencyFn(buildFee)}`,
            "{{monthlyInvestment}}": `$${formatCurrencyFn(monthlyFee)}`,
            "{{servicesList}}": servicesList,
            "{{billingFrequency}}": monthlyFee > 0 ? "monthly" : "one-time",
            "{{businessName}}": businessData?.companyName || "",
            "{{businessEmail}}": businessData?.email || "",
            "{{businessPhone}}": businessData?.phone || "",
            "{{businessAddress}}": businessData?.address || "",
            "{{businessCity}}": businessData?.city || "",
            "{{businessState}}": businessData?.state || "",
            "{{businessZipCode}}": businessData?.zipCode || "",
            "{{signerName}}": signerName || "",
            "{{signerEmail}}": signerEmail || "",
            "{{signerIpAddress}}": signerIpAddress || "",
            "{{SIGNER_IP_ADDRESS}}": signerIpAddress || "",
            "{{signatureDate}}": updated.signedAt ? new Date(updated.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
          };
          for (const [tag, value] of Object.entries(mergeMap)) {
            termsContent = termsContent.split(tag).join(value);
          }

          const signedAt = updated.signedAt || new Date();
          const pdfBuffer = await generateSignedAgreementPdf({
            quote,
            quoteItemsList: enrichedItems,
            termsContent,
            termsTitle: activeTerms[0]?.title || "Service Agreement",
            signerName,
            signerEmail,
            signerIpAddress,
            signedAt: new Date(signedAt),
            signatureData,
            companyName,
          });

          const sanitizedName = quote.name.replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `Signed_Agreement_${sanitizedName}_${new Date(signedAt).toISOString().split('T')[0]}.pdf`;

          const clientId = quote.clientId;
          if (clientId) {
            const objectStorage = new ObjectStorageService();
            const fileUrl = await objectStorage.uploadBuffer(pdfBuffer, fileName, 'application/pdf');

            const uploadedBy = quote.sentByUserId || quote.createdBy;
            await db.insert(documents).values({
              name: fileName,
              fileName,
              fileType: 'pdf',
              fileSize: pdfBuffer.length,
              fileUrl,
              clientId,
              uploadedBy,
            });

            console.log(`[PDF] Signed agreement PDF generated and stored for client ${clientId}: ${fileName}`);
          }

          const branding = await loadBranding();
          const brandColor = branding.primaryColor || "#00C9C6";
          const brandName = branding.companyName || companyName || "";
          try {
            await notificationService.sendDirectEmail({
              to: signerEmail,
              subject: `Your Signed Agreement — ${quote.name}`,
              text: `Hi ${signerName},\n\nThank you for signing the proposal "${quote.name}". Please find your signed agreement attached for your records.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\n${brandName}`,
              html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
<div style="background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
${brandName ? `<p style="font-size: 13px; opacity: 0.85; margin-bottom: 8px; letter-spacing: 0.5px;">${brandName}</p>` : ""}
<h1 style="margin: 0 0 8px; font-size: 24px;">Agreement Signed</h1>
<p style="margin: 0; opacity: 0.9;">Your signed copy is attached below</p>
</div>
<div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
<p style="font-size: 16px;">Hi ${signerName},</p>
<p>Thank you for signing the proposal <strong>"${quote.name}"</strong>. A copy of your signed agreement is attached to this email for your records.</p>
<div style="background: #f8fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #eef1f3;">
<p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #888;">Signed By</p>
<p style="margin: 0; font-weight: 600;">${signerName} (${signerEmail})</p>
<p style="margin: 8px 0 0; font-size: 12px; color: #888;">Signed on ${new Date(signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
</div>
<p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to reach out.</p>
</div>
<div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none;">
<p style="margin: 0;">This is an automated confirmation. Please keep this email for your records.</p>
</div></body></html>`,
              attachment: {
                data: pdfBuffer,
                filename: fileName,
                contentType: 'application/pdf',
              },
            });
            console.log(`[PDF] Signed agreement emailed to ${signerEmail}`);
          } catch (emailErr) {
            console.error("[PDF] Error emailing signed agreement to client:", emailErr);
          }
        } catch (pdfError) {
          console.error("[PDF] Error generating signed agreement PDF:", pdfError);
        }
      })();

      let conversionClientId: string | null = null;
      if (quote.leadId) {
        try {
          const conversionResult = await convertLeadToClient(quote.leadId, "online_proposal", { quoteId: quote.id });
          conversionClientId = conversionResult.clientId;
          console.log(`✅ [ProposalSign] Auto-converted lead ${quote.leadId} → client ${conversionClientId} (alreadyConverted: ${conversionResult.alreadyConverted})`);
        } catch (conversionError) {
          console.error(`❌ [ProposalSign] Auto-conversion failed for lead ${quote.leadId}:`, conversionError);
        }
      }

      res.json({ success: true, clientId: conversionClientId, proposal: { status: updated.status, signedAt: updated.signedAt } });
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

      if (!(await isStripeConfiguredAsync())) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }

      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.publicToken, token));

      if (!quote) return res.status(404).json({ message: "Proposal not found" });

      if (!quote.signedAt) {
        return res.status(400).json({ message: "Proposal must be signed before payment" });
      }

      if (quote.paidAt) {
        return res.status(400).json({ message: "Payment has already been completed" });
      }

      const buildFee = parseFloat(quote.oneTimeCost || "0");
      const monthlyFee = parseFloat(quote.clientBudget || "0");
      const billingMode = quote.billingMode || "trial";

      let payNowAmount = buildFee;
      if (billingMode === "immediate") {
        payNowAmount = buildFee + monthlyFee;
      }

      if (quote.paymentAmountType === "custom" && quote.customPaymentAmount) {
        payNowAmount = parseFloat(quote.customPaymentAmount);
      }

      if (payNowAmount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const CC_SURCHARGE_RATE = 0.03;
      let ccFee = 0;
      let chargeAmount = payNowAmount;

      if (paymentMethod === "card") {
        ccFee = payNowAmount * CC_SURCHARGE_RATE;
        chargeAmount = payNowAmount + ccFee;
      }

      const stripe = await getStripeAsync();
      if (!stripe) return res.status(503).json({ message: "Stripe not configured" });

      const customerEmail = quote.signedByEmail || "";
      const customerName = quote.signedByName || "";
      const customer = await getOrCreateCustomer(customerEmail, customerName);
      if (!customer) return res.status(500).json({ message: "Failed to create customer" });

      const metadata = {
        quoteId: quote.id,
        clientId: quote.clientId || "",
        leadId: quote.leadId || "",
        billingMode,
        monthlyFee: monthlyFee.toString(),
        buildFee: buildFee.toString(),
        paymentMethod,
        ccSurchargeRate: paymentMethod === "card" ? CC_SURCHARGE_RATE.toString() : "0",
      };

      let result;
      if (paymentMethod === "ach") {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(payNowAmount * 100),
          currency: "usd",
          customer: customer.id,
          payment_method_types: ["us_bank_account"],
          payment_method_options: {
            us_bank_account: {
              financial_connections: { permissions: ["payment_method" as any] },
            },
          },
          metadata,
        });
        result = { paymentIntent, clientSecret: paymentIntent.client_secret! };
      } else {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(chargeAmount * 100),
          currency: "usd",
          customer: customer.id,
          payment_method_types: ["card"],
          metadata,
        });
        result = { paymentIntent, clientSecret: paymentIntent.client_secret! };
      }

      await db
        .update(quotes)
        .set({
          paymentMethod,
          paymentIntentId: result.paymentIntent.id,
          paymentStatus: "pending",
          paidAmount: chargeAmount.toFixed(2),
          stripeCustomerId: customer.id,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quote.id));

      res.json({
        clientSecret: result.clientSecret,
        payNowAmount: chargeAmount,
        buildFee,
        monthlyFee,
        billingMode,
      });
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
        return res.status(400).json({ message: "Title and content are required" });
      }

      const existing = await db
        .select()
        .from(proposalTerms)
        .orderBy(desc(proposalTerms.version))
        .limit(1);

      const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

      if (existing.length > 0) {
        await db
          .update(proposalTerms)
          .set({ isActive: false })
          .where(eq(proposalTerms.isActive, true));
      }

      const [newTerms] = await db.insert(proposalTerms).values({
        title,
        content,
        version: nextVersion,
        isActive: true,
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
        logoUrl: z.string().max(2000).default(""),
        companyName: z.string().max(200).default(""),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #00C9C6)").default("#00C9C6"),
        footerText: z.string().max(500).default(""),
      });

      const parsed = brandingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid branding data", errors: parsed.error.flatten().fieldErrors });
      }

      const brandingData = parsed.data;

      const [existing] = await db.select().from(taskSettings)
        .where(eq(taskSettings.settingKey, 'proposal_branding'));

      if (existing) {
        await db.update(taskSettings)
          .set({ settingValue: brandingData, updatedAt: new Date() })
          .where(eq(taskSettings.settingKey, 'proposal_branding'));
      } else {
        await db.insert(taskSettings).values({
          settingKey: 'proposal_branding',
          settingValue: brandingData,
        });
      }

      res.json(brandingData);
    } catch (error) {
      console.error("Error saving proposal branding:", error);
      res.status(500).json({ message: "Failed to save proposal branding" });
    }
  });

  app.get("/api/settings/proposal-email-template", requireAuth(), async (req, res) => {
    try {
      const [setting] = await db.select().from(taskSettings)
        .where(eq(taskSettings.settingKey, 'proposal_email_template'));

      const defaults = {
        subjectLine: "Your Proposal: {{proposalName}}",
        headerTitle: "Your Proposal is Ready",
        headerSubtitle: "Review, sign, and pay — all in one place",
        greeting: "Hi {{clientName}},",
        introText: "We've prepared a proposal for you. Please review the details, sign, and complete payment to get started.",
        step1: "Review the proposal details and pricing",
        step2: "Accept terms and sign electronically",
        step3: "Complete payment via credit card or bank transfer",
        buttonText: "View & Sign Proposal",
        closingText: "If you have any questions, please don't hesitate to reach out.",
      };

      if (setting?.settingValue) {
        res.json({ ...defaults, ...(setting.settingValue as any) });
      } else {
        res.json(defaults);
      }
    } catch (error) {
      console.error("Error fetching proposal email template:", error);
      res.status(500).json({ message: "Failed to fetch proposal email template" });
    }
  });

  app.put("/api/settings/proposal-email-template", requireAuth(), async (req, res) => {
    try {
      const templateSchema = z.object({
        subjectLine: z.string().max(200).default("Your Proposal: {{proposalName}}"),
        headerTitle: z.string().max(200).default("Your Proposal is Ready"),
        headerSubtitle: z.string().max(300).default("Review, sign, and pay — all in one place"),
        greeting: z.string().max(200).default("Hi {{clientName}},"),
        introText: z.string().max(1000).default("We've prepared a proposal for you. Please review the details, sign, and complete payment to get started."),
        step1: z.string().max(300).default("Review the proposal details and pricing"),
        step2: z.string().max(300).default("Accept terms and sign electronically"),
        step3: z.string().max(300).default("Complete payment via credit card or bank transfer"),
        buttonText: z.string().max(100).default("View & Sign Proposal"),
        closingText: z.string().max(500).default("If you have any questions, please don't hesitate to reach out."),
      });

      const parsed = templateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid template data", errors: parsed.error.flatten().fieldErrors });
      }

      const templateData = parsed.data;

      const [existing] = await db.select().from(taskSettings)
        .where(eq(taskSettings.settingKey, 'proposal_email_template'));

      if (existing) {
        await db.update(taskSettings)
          .set({ settingValue: templateData, updatedAt: new Date() })
          .where(eq(taskSettings.settingKey, 'proposal_email_template'));
      } else {
        await db.insert(taskSettings).values({
          settingKey: 'proposal_email_template',
          settingValue: templateData,
        });
      }

      res.json(templateData);
    } catch (error) {
      console.error("Error saving proposal email template:", error);
      res.status(500).json({ message: "Failed to save proposal email template" });
    }
  });

  app.get("/api/stripe/config", async (req, res) => {
    res.json({
      configured: await isStripeConfiguredAsync(),
      publishableKey: await getStripePublishableKey() || null,
    });
  });
}

function applyMergeTags(text: string, clientName: string, quoteName: string): string {
  return text
    .replace(/\{\{clientName\}\}/g, clientName)
    .replace(/\{\{proposalName\}\}/g, quoteName);
}

function generateProposalEmailHtml(
  clientName: string,
  quoteName: string,
  proposalUrl: string,
  branding: { logoUrl?: string; companyName?: string; primaryColor?: string; footerText?: string } = {},
  emailTpl?: { headerTitle?: string; headerSubtitle?: string; greeting?: string; introText?: string; step1?: string; step2?: string; step3?: string; buttonText?: string; closingText?: string },
  appUrl?: string
): string {
  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rawColor = branding.primaryColor || "#00C9C6";
  const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : "#00C9C6";
  const darkerColor = adjustColor(color, -15);
  const companyName = escHtml(branding.companyName || "");
  const publicLogoUrl = branding.logoUrl && appUrl ? `${appUrl}/api/public/proposal-logo` : "";
  const logoHtml = publicLogoUrl
    ? `<img src="${escHtml(publicLogoUrl)}" alt="${companyName}" style="max-height: 48px; max-width: 200px; margin-bottom: 12px;" />`
    : "";
  const footerContent = branding.footerText
    ? `<p style="margin-bottom: 8px;">${escHtml(branding.footerText)}</p>`
    : "";

  const tpl = {
    headerTitle: emailTpl?.headerTitle || "Your Proposal is Ready",
    headerSubtitle: emailTpl?.headerSubtitle || "Review, sign, and pay — all in one place",
    greeting: emailTpl?.greeting || "Hi {{clientName}},",
    introText: emailTpl?.introText || "We've prepared a proposal for you. Please review the details, sign, and complete payment to get started.",
    step1: emailTpl?.step1 || "Review the proposal details and pricing",
    step2: emailTpl?.step2 || "Accept terms and sign electronically",
    step3: emailTpl?.step3 || "Complete payment via credit card or bank transfer",
    buttonText: emailTpl?.buttonText || "View & Sign Proposal",
    closingText: emailTpl?.closingText || "If you have any questions, please don't hesitate to reach out.",
  };

  const mt = (text: string) => escHtml(applyMergeTags(text, clientName, quoteName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mt(tpl.headerTitle)}</title>
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
    <h1>${mt(tpl.headerTitle)}</h1>
    <p>${mt(tpl.headerSubtitle)}</p>
  </div>
  <div class="content">
    <p class="greeting">${mt(tpl.greeting)}</p>
    <p>${mt(tpl.introText)}</p>
    <div class="details">
      <div class="details-label">Proposal</div>
      <div class="details-value">${escHtml(quoteName)}</div>
    </div>
    <div class="steps">
      <div class="step"><span class="step-number">1</span><span>${mt(tpl.step1)}</span></div>
      <div class="step"><span class="step-number">2</span><span>${mt(tpl.step2)}</span></div>
      <div class="step"><span class="step-number">3</span><span>${mt(tpl.step3)}</span></div>
    </div>
    <div class="cta">
      <a href="${proposalUrl}" class="button">${mt(tpl.buttonText)}</a>
    </div>
    <p style="font-size: 14px; color: #666;">${mt(tpl.closingText)}</p>
  </div>
  <div class="footer">
    ${footerContent}
    <p>This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>`;
}

function adjustColor(hex: string, amount: number): string {
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export async function handleStripeWebhook(req: any, res: any, notificationService: NotificationService) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = await getStripeWebhookSecret();

  if (!sig || !webhookSecret) {
    console.error("[Stripe Webhook] Missing signature or webhook secret", { hasSig: !!sig, hasSecret: !!webhookSecret });
    return res.status(400).json({ message: "Missing signature or webhook secret" });
  }

  let event;
  try {
    event = await constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any;
    const quoteId = paymentIntent.metadata?.quoteId;

    if (quoteId) {
      try {
        const [quote] = await db
          .select()
          .from(quotes)
          .where(eq(quotes.id, quoteId));

        if (quote) {
          await db
            .update(quotes)
            .set({
              status: "completed",
              paymentStatus: "paid",
              paidAt: new Date(),
              paidAmount: (paymentIntent.amount / 100).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(quotes.id, quoteId));

          await triggerQuoteFulfillment(quote, notificationService);

          const monthlyFee = parseFloat(paymentIntent.metadata?.monthlyFee || quote.clientBudget || "0");
          const billingMode = paymentIntent.metadata?.billingMode || quote.billingMode || "trial";
          const customerId = paymentIntent.customer || quote.stripeCustomerId;
          console.log(`[Quote Fulfillment] Subscription check: monthlyFee=${monthlyFee}, customerId=${customerId}, hasExistingSub=${!!quote.stripeSubscriptionId}, billingMode=${billingMode}`);
          const pmMethod = paymentIntent.metadata?.paymentMethod || quote.paymentMethod || "";
          const ccSurchargeRate = parseFloat(paymentIntent.metadata?.ccSurchargeRate || "0");

          if (monthlyFee > 0 && customerId && !quote.stripeSubscriptionId) {
            try {
              const trialDays = billingMode === "trial" ? 30 : 0;
              const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                ? paymentIntent.payment_method
                : paymentIntent.payment_method?.id;

              let subscriptionMonthly = monthlyFee;
              if (pmMethod === "card" && ccSurchargeRate > 0) {
                subscriptionMonthly = monthlyFee + (monthlyFee * ccSurchargeRate);
              }

              const sub = await createSubscription(
                customerId,
                subscriptionMonthly,
                { quoteId: quote.id, quoteName: quote.name || "Monthly Service" },
                trialDays,
                paymentMethodId || undefined
              );

              if (sub) {
                await db.update(quotes).set({
                  stripeSubscriptionId: sub.id,
                  subscriptionStatus: sub.status,
                  updatedAt: new Date(),
                }).where(eq(quotes.id, quoteId));

                console.log(`[Quote Fulfillment] Created subscription ${sub.id} (${sub.status}) for quote ${quoteId}, $${monthlyFee}/mo, trial: ${trialDays}d`);
              }
            } catch (subError) {
              console.error(`[Quote Fulfillment] Error creating subscription for quote ${quoteId}:`, subError);
            }
          }
        }
      } catch (error) {
        console.error("Error processing payment success:", error);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;
    const quoteId = subscription.metadata?.quoteId;
    if (quoteId) {
      await db.update(quotes).set({
        subscriptionStatus: subscription.status,
        updatedAt: new Date(),
      }).where(eq(quotes.id, quoteId));
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    const quoteId = subscription.metadata?.quoteId;
    if (quoteId) {
      await db.update(quotes).set({
        subscriptionStatus: "canceled",
        updatedAt: new Date(),
      }).where(eq(quotes.id, quoteId));
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as any;
    const quoteId = paymentIntent.metadata?.quoteId;

    if (quoteId) {
      await db
        .update(quotes)
        .set({
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId));
    }
  }

  res.json({ received: true });
}

async function triggerQuoteFulfillment(quote: any, notificationService: NotificationService) {
  try {
    console.log(`[Quote Fulfillment] Starting fulfillment for quote ${quote.id}`);

    if (quote.sentByUserId) {
      const [sender] = await db.select().from(staff).where(eq(staff.id, quote.sentByUserId));
      if (sender) {
        try {
          await notificationService.sendDirectEmail({
            to: sender.email,
            subject: `Payment Received: ${quote.name}`,
            text: `Payment has been received for proposal "${quote.name}" from ${quote.signedByName}. The proposal is now complete and fulfillment has been triggered.`,
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
          const existingClient = await db.select().from(clients)
            .where(eq(clients.email, lead.email || ""))
            .limit(1);

          if (existingClient.length > 0) {
            clientId = existingClient[0].id;
            console.log(`[Quote Fulfillment] Lead ${lead.id} already converted to client ${clientId}`);
          } else {
            const [newClient] = await db.insert(clients).values({
              name: lead.company || lead.name || quote.signedByName || "New Client",
              email: lead.email || quote.signedByEmail || "",
              phone: lead.phone || "",
              company: lead.company || "",
              status: "active",
            }).returning();

            clientId = newClient.id;
            console.log(`[Quote Fulfillment] Created client ${clientId} from lead ${lead.id}`);

            const dealValue = parseFloat(quote.totalCost || "0");
            await db.insert(deals).values({
              leadId: lead.id,
              clientId: clientId,
              name: `${newClient.name} - ${lead.company || 'Deal'}`,
              assignedTo: lead.assignedTo,
              value: dealValue,
              mrr: quote.mrr ? parseFloat(quote.mrr.toString()) : 0,
              wonDate: new Date(),
              notes: `Deal created from proposal payment. Quote: ${quote.name || quote.id}`,
            });
            console.log(`[Quote Fulfillment] Created deal for client ${clientId}`);

            const closedWonStage = await db.select().from(leadPipelineStages)
              .where(sql`LOWER(${leadPipelineStages.name}) = 'closed won'`)
              .limit(1);

            const leadUpdate: any = { status: 'Won' };
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
        const [onboardingConfig] = await db.select()
          .from(clientOnboardingFormConfig)
          .orderBy(desc(clientOnboardingFormConfig.updatedAt))
          .limit(1);
        if (onboardingConfig && Array.isArray(onboardingConfig.steps) && (onboardingConfig.steps as any[]).length > 0) {
          const [existingClient] = await db.select().from(clients).where(eq(clients.id, clientId));
          if (existingClient && !existingClient.onboardingToken) {
            const token = randomBytes(32).toString("hex");
            await db.update(clients)
              .set({ onboardingToken: token, onboardingCompleted: false })
              .where(eq(clients.id, clientId));
            console.log(`[Quote Fulfillment] Generated onboarding token for client ${clientId}`);
          }
        }
      } catch (e) {
        console.error("[Quote Fulfillment] Error generating onboarding token:", e);
      }

      try {
        const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
        let transferredCount = 0;

        for (const item of items) {
          if (item.itemType === 'product' && item.productId) {
            const existing = await db.select().from(clientProducts)
              .where(and(eq(clientProducts.clientId, clientId), eq(clientProducts.productId, item.productId)))
              .limit(1);
            if (existing.length === 0) {
              await db.insert(clientProducts).values({ clientId, productId: item.productId });
              transferredCount++;
            }
          } else if (item.itemType === 'bundle' && item.bundleId) {
            const existing = await db.select().from(clientBundles)
              .where(and(eq(clientBundles.clientId, clientId), eq(clientBundles.bundleId, item.bundleId)))
              .limit(1);
            if (existing.length === 0) {
              await db.insert(clientBundles).values({ clientId, bundleId: item.bundleId, customQuantities: item.customQuantities });
              transferredCount++;
            }
          } else if (item.itemType === 'package' && item.packageId) {
            const existingPkg = await db.select().from(clientPackages)
              .where(and(eq(clientPackages.clientId, clientId), eq(clientPackages.packageId, item.packageId)))
              .limit(1);
            if (existingPkg.length === 0) {
              await db.insert(clientPackages).values({
                clientId, packageId: item.packageId,
                price: item.unitCost?.toString() || '0', status: 'active',
                customQuantities: item.customQuantities,
              });
              transferredCount++;
            }

            const pkgItems = await db.select().from(packageItems).where(eq(packageItems.packageId, item.packageId));
            for (const pkgItem of pkgItems) {
              if (pkgItem.itemType === 'bundle' && pkgItem.bundleId) {
                const ex = await db.select().from(clientBundles)
                  .where(and(eq(clientBundles.clientId, clientId), eq(clientBundles.bundleId, pkgItem.bundleId)))
                  .limit(1);
                if (ex.length === 0) {
                  await db.insert(clientBundles).values({ clientId, bundleId: pkgItem.bundleId });
                  transferredCount++;
                }
              } else if (pkgItem.itemType === 'product' && pkgItem.productId) {
                const ex = await db.select().from(clientProducts)
                  .where(and(eq(clientProducts.clientId, clientId), eq(clientProducts.productId, pkgItem.productId)))
                  .limit(1);
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
        const [autoGenSetting] = await db.select().from(taskSettings)
          .where(eq(taskSettings.settingKey, 'task_mapping_auto_generate_on_conversion'));
        const autoGenEnabled = autoGenSetting ? (autoGenSetting.settingValue as any)?.enabled !== false : true;

        if (autoGenEnabled) {
          const assignedProducts = await db.select().from(clientProducts).where(eq(clientProducts.clientId, clientId));
          const assignedBundles = await db.select().from(clientBundles).where(eq(clientBundles.clientId, clientId));
          const assignedPackages = await db.select().from(clientPackages).where(eq(clientPackages.clientId, clientId));

          const generationItems: any[] = [];
          for (const cp of assignedProducts) {
            let qty = 1;
            const [qi] = await db.select({ quantity: quoteItems.quantity }).from(quoteItems)
              .where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.productId, cp.productId), eq(quoteItems.itemType, 'product')))
              .limit(1);
            if (qi) qty = qi.quantity;
            generationItems.push({ productId: cp.productId, quantity: qty });
          }
          for (const cb of assignedBundles) {
            let qty = 1;
            const [qi] = await db.select({ quantity: quoteItems.quantity }).from(quoteItems)
              .where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.bundleId, cb.bundleId), eq(quoteItems.itemType, 'bundle')))
              .limit(1);
            if (qi) qty = qi.quantity;
            generationItems.push({ bundleId: cb.bundleId, quantity: qty });
          }
          for (const cpkg of assignedPackages) {
            let qty = 1;
            const [qi] = await db.select({ quantity: quoteItems.quantity }).from(quoteItems)
              .where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.packageId, cpkg.packageId), eq(quoteItems.itemType, 'package')))
              .limit(1);
            if (qi) qty = qi.quantity;
            generationItems.push({ packageId: cpkg.packageId, quantity: qty });
          }

          if (generationItems.length > 0) {
            const result = await generateTasksFromTemplates({
              clientId, items: generationItems, generationType: 'onboarding', cycleStartDate: new Date(),
            });
            console.log(`[Quote Fulfillment] Generated ${result.totalTasksCreated} onboarding tasks for client ${clientId}`);
          }

          const [cycleLengthSetting] = await db.select().from(taskSettings)
            .where(eq(taskSettings.settingKey, 'task_mapping_default_cycle_length'));
          const defaultCycleLength = (cycleLengthSetting?.settingValue as any)?.value ?? 30;
          const [advanceGenSetting] = await db.select().from(taskSettings)
            .where(eq(taskSettings.settingKey, 'task_mapping_default_advance_generation_days'));
          const defaultAdvanceDays = (advanceGenSetting?.settingValue as any)?.value ?? 3;

          const existingConfig = await db.select().from(clientRecurringConfig)
            .where(eq(clientRecurringConfig.clientId, clientId)).limit(1);
          if (existingConfig.length === 0) {
            await db.insert(clientRecurringConfig).values({
              clientId, cycleStartDate: new Date(),
              cycleLengthDays: defaultCycleLength, advanceGenerationDays: defaultAdvanceDays, status: 'active',
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
