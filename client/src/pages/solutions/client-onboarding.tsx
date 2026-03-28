import {
  ClipboardList, Zap, FileText, Users, CheckCircle2, CalendarDays,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function ClientOnboardingSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Client Management"
      badgeIcon={ClipboardList}
      headline="Onboard new clients"
      headlineAccent="in minutes, not days."
      subheadline="Automated onboarding workflows that collect client information, assign tasks, and kick off projects — so your team can start delivering immediately."
      highlights={[
        {
          icon: ClipboardList,
          title: "Onboarding Checklists",
          description: "Pre-built and customizable checklists ensure every new client gets a consistent, thorough onboarding experience."
        },
        {
          icon: Zap,
          title: "Auto-Task Generation",
          description: "When a lead converts to a client, automatically create all the onboarding tasks your team needs to execute."
        },
        {
          icon: FileText,
          title: "Information Collection",
          description: "Send branded intake forms to collect brand guidelines, access credentials, and project requirements."
        },
        {
          icon: Users,
          title: "Team Assignment",
          description: "Automatically assign team members based on client type, package, or department for immediate kickoff."
        },
        {
          icon: CalendarDays,
          title: "Kickoff Scheduling",
          description: "Auto-schedule kickoff meetings and key milestones based on your onboarding timeline templates."
        },
        {
          icon: CheckCircle2,
          title: "Progress Tracking",
          description: "Track onboarding progress in real time. Know exactly which clients are fully set up and which need attention."
        },
      ]}
      benefitsTitle="First impressions matter."
      benefitsAccent="Make yours flawless."
      benefitsDescription="A smooth onboarding experience sets the tone for the entire client relationship. Automate the process so nothing falls through the cracks."
      benefits={[
        "Customizable onboarding templates for different client types",
        "Automatic task creation when leads convert to clients",
        "Branded intake forms collect everything you need upfront",
        "Team members are auto-assigned based on client package",
        "Kickoff meetings scheduled automatically",
        "Progress dashboard shows onboarding status at a glance",
        "Reduce time-to-first-deliverable by up to 50%",
        "Consistent experience for every client, every time",
      ]}
      ctaTitle="Ready to streamline your onboarding?"
      ctaDescription="Turn your onboarding chaos into a repeatable, automated process that impresses every new client."
    />
  );
}
