import {
  Globe, Shield, FileText, MessageSquare, BarChart3, Bell,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { ClientPortalMockup } from "@/components/marketing/solution-mockups";

export default function ClientPortalSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Client Management"
      badgeIcon={Globe}
      headline="Give clients their own"
      headlineAccent="self-service portal."
      subheadline="A branded client portal where your clients can view project status, approve deliverables, submit requests, and stay in the loop — without endless email threads."
      mockup={<ClientPortalMockup />}
      highlights={[
        {
          icon: BarChart3,
          title: "Project Dashboards",
          description: "Clients see real-time project status, deliverable progress, and key milestones at a glance."
        },
        {
          icon: FileText,
          title: "Document Sharing",
          description: "Share reports, creative assets, and contracts securely. Clients download what they need, when they need it."
        },
        {
          icon: MessageSquare,
          title: "In-Portal Messaging",
          description: "Clients can leave comments, ask questions, and approve deliverables without switching to email."
        },
        {
          icon: Bell,
          title: "Automated Notifications",
          description: "Clients receive updates when tasks are completed, reports are ready, or action is needed from them."
        },
        {
          icon: Shield,
          title: "Branded Experience",
          description: "Customize the portal with your agency logo and colors. Clients feel like they're using your platform."
        },
        {
          icon: Globe,
          title: "Secure Login",
          description: "Each client gets their own secure login. Control what they see with granular permission settings."
        },
      ]}
      benefitsTitle="Less email."
      benefitsAccent="More transparency."
      benefitsDescription="Agencies that offer client portals reduce support emails by 60% and increase client satisfaction scores dramatically."
      benefits={[
        "Branded portal with your logo and colors",
        "Real-time project status visible to clients 24/7",
        "Secure document sharing and download center",
        "In-portal commenting and approval workflows",
        "Automated notifications keep clients informed",
        "Reduce back-and-forth emails by up to 60%",
        "Granular permissions control what each client sees",
        "Mobile-friendly so clients can check in from anywhere",
      ]}
      ctaTitle="Ready to impress your clients?"
      ctaDescription="Give clients the transparency they crave with a professional, branded portal."
    />
  );
}
