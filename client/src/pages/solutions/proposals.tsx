import {
  BarChart3, FileText, DollarSign, Send, Eye, CheckCircle2,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { ProposalsMockup } from "@/components/marketing/solution-mockups";

export default function ProposalsSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Sales & Marketing"
      badgeIcon={BarChart3}
      headline="Win more deals with"
      headlineAccent="polished proposals."
      subheadline="Build beautiful proposals and quotes with your products and packages. Send, track, and close deals — all from one platform."
      mockup={<ProposalsMockup />}
      highlights={[
        {
          icon: FileText,
          title: "Proposal Builder",
          description: "Drag-and-drop proposal editor with templates, product catalogs, and custom branding for professional presentations."
        },
        {
          icon: DollarSign,
          title: "Product & Package Pricing",
          description: "Build quotes from your product catalog. Bundle services into packages with tiered pricing options."
        },
        {
          icon: Send,
          title: "Digital Delivery",
          description: "Send proposals via unique links. Clients view, comment, and sign without downloading anything."
        },
        {
          icon: Eye,
          title: "View Tracking",
          description: "Know exactly when prospects open your proposal, how long they view each section, and when they're ready to buy."
        },
        {
          icon: CheckCircle2,
          title: "E-Signatures",
          description: "Built-in electronic signatures let clients accept proposals and sign contracts without leaving the platform."
        },
        {
          icon: BarChart3,
          title: "Pipeline Analytics",
          description: "Track win rates, average deal size, and proposal conversion rates to optimize your sales process."
        },
      ]}
      benefitsTitle="Close deals faster."
      benefitsAccent="Look professional doing it."
      benefitsDescription="Professional proposals with clear pricing, easy acceptance, and built-in tracking give you a competitive edge."
      benefits={[
        "Professional proposal templates with your branding",
        "Product catalog with packages, bundles, and add-ons",
        "Real-time view tracking shows prospect engagement",
        "Built-in e-signatures for instant acceptance",
        "Automatic follow-up reminders for pending proposals",
        "One-click conversion from proposal to active client",
        "Win rate analytics to optimize your sales approach",
        "Version history tracks all changes and revisions",
      ]}
      ctaTitle="Ready to close more deals?"
      ctaDescription="Stop sending proposals into the void. AgencyBoost gives you the tools to present, track, and close."
    />
  );
}
