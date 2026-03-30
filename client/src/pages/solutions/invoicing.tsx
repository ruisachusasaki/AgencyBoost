import {
  FileText, DollarSign, Clock, BarChart3, Send, CreditCard,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { InvoicingMockup } from "@/components/marketing/solution-mockups";

export default function InvoicingSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Client Management"
      badgeIcon={FileText}
      headline="Get paid faster with"
      headlineAccent="professional invoicing."
      subheadline="Create, send, and track invoices directly from your CRM. Automatic reminders, payment tracking, and seamless integration with your client records."
      mockup={<InvoicingMockup />}
      highlights={[
        {
          icon: FileText,
          title: "Professional Invoices",
          description: "Generate polished, branded invoices with your logo, custom line items, and payment terms in seconds."
        },
        {
          icon: Send,
          title: "One-Click Sending",
          description: "Email invoices directly to clients from the platform. Track opens and views so you know when they've seen it."
        },
        {
          icon: Clock,
          title: "Automatic Reminders",
          description: "Set up payment reminders that automatically follow up on overdue invoices — no manual chasing required."
        },
        {
          icon: CreditCard,
          title: "Online Payments",
          description: "Accept credit card and ACH payments online. Clients pay with one click and you get paid faster."
        },
        {
          icon: BarChart3,
          title: "Revenue Tracking",
          description: "Dashboard shows outstanding, paid, and overdue invoices. Track monthly recurring revenue at a glance."
        },
        {
          icon: DollarSign,
          title: "Subscription Billing",
          description: "Set up recurring invoices for retainer clients. Automatically generate and send invoices each billing cycle."
        },
      ]}
      benefitsTitle="Stop chasing payments."
      benefitsAccent="Start getting paid."
      benefitsDescription="Integrated invoicing means no more exporting data to a separate billing tool. Everything lives in one place."
      benefits={[
        "Branded invoices generated from client and subscription data",
        "Online payment acceptance with credit card and ACH",
        "Automatic payment reminders for overdue invoices",
        "Recurring billing for retainer and subscription clients",
        "Revenue dashboard with AR aging and payment trends",
        "Invoice history linked directly to client profiles",
        "Tax-ready reporting for end-of-year accounting",
        "Multi-currency support for international clients",
      ]}
      ctaTitle="Ready to get paid on time, every time?"
      ctaDescription="Integrated invoicing eliminates the billing bottleneck and keeps cash flowing into your agency."
    />
  );
}
