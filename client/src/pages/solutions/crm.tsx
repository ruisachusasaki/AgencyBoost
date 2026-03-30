import {
  Users, Database, MessageSquare, BarChart3, Globe, FileText,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { CRMMockup } from "@/components/marketing/solution-mockups";

export default function CrmSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Client Management"
      badgeIcon={Users}
      headline="Your clients deserve"
      headlineAccent="a better experience."
      subheadline="Centralize every client relationship in one place. Track communications, manage subscriptions, monitor health scores, and deliver results — all from a single dashboard."
      mockup={<CRMMockup />}
      highlights={[
        {
          icon: Database,
          title: "360° Client Profiles",
          description: "Every detail in one place — contact info, contracts, notes, tasks, invoices, and communication history."
        },
        {
          icon: BarChart3,
          title: "Health Scoring",
          description: "Automatically track client health based on engagement, deliverables, and satisfaction metrics."
        },
        {
          icon: MessageSquare,
          title: "Communication History",
          description: "Log calls, emails, and meetings. Every team member sees the full conversation history."
        },
        {
          icon: FileText,
          title: "Contracts & Documents",
          description: "Store and manage client contracts, agreements, and important documents centrally."
        },
        {
          icon: Globe,
          title: "Client Portal",
          description: "Give clients their own login to view project status, approve deliverables, and submit requests."
        },
        {
          icon: Users,
          title: "Custom Fields",
          description: "Extend client profiles with custom fields tailored to your agency's workflow and data needs."
        },
      ]}
      benefitsTitle="Stop losing clients."
      benefitsAccent="Start retaining them."
      benefitsDescription="Agencies that centralize client management see higher retention rates, faster response times, and happier clients."
      benefits={[
        "Complete client history — no more searching through email threads",
        "Automated health scoring flags at-risk clients before they churn",
        "Custom fields let you track exactly what matters to your agency",
        "Client portal reduces back-and-forth emails by 60%",
        "Tag and segment clients for targeted communication",
        "Role-based access so team members see only relevant client data",
        "Bulk actions for efficient client management at scale",
        "Export and reporting for client portfolio analysis",
      ]}
      ctaTitle="Ready to transform your client relationships?"
      ctaDescription="Join agencies that use AgencyBoost to deliver exceptional client experiences and grow their business."
    />
  );
}
