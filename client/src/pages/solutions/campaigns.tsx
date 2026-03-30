import {
  Mail, BarChart3, CalendarDays, Target, Users, Layers,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { CampaignsMockup } from "@/components/marketing/solution-mockups";

export default function CampaignsSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Sales & Marketing"
      badgeIcon={Mail}
      headline="Plan and execute"
      headlineAccent="marketing campaigns."
      subheadline="Organize campaigns, track performance, and coordinate your team's marketing efforts from a single dashboard."
      mockup={<CampaignsMockup />}
      highlights={[
        {
          icon: CalendarDays,
          title: "Campaign Calendar",
          description: "Visual campaign calendar shows every initiative, deadline, and launch date across all clients."
        },
        {
          icon: Target,
          title: "Campaign Planning",
          description: "Plan campaigns with objectives, target audiences, budgets, and timelines in a structured workflow."
        },
        {
          icon: Layers,
          title: "Multi-Channel Execution",
          description: "Coordinate email, social, paid ads, and content marketing from one campaign brief."
        },
        {
          icon: Users,
          title: "Team Collaboration",
          description: "Assign campaign tasks to team members, track deliverables, and keep everyone aligned on deadlines."
        },
        {
          icon: BarChart3,
          title: "Performance Tracking",
          description: "Track campaign KPIs, ROI, and performance metrics. Generate client-ready reports with one click."
        },
        {
          icon: Mail,
          title: "Email Campaigns",
          description: "Build and send email campaigns with templates, merge tags, and engagement tracking."
        },
      ]}
      benefitsTitle="Campaigns that deliver."
      benefitsAccent="Results that speak."
      benefitsDescription="Stop managing campaigns in spreadsheets. A centralized campaign hub keeps your team aligned and your clients informed."
      benefits={[
        "Visual campaign calendar across all clients and channels",
        "Structured campaign briefs with objectives and budgets",
        "Multi-channel coordination from a single dashboard",
        "Task assignment and deadline tracking per campaign",
        "Performance metrics and ROI tracking built in",
        "Client-ready reports generated automatically",
        "Template library for faster campaign setup",
        "Campaign history and learnings archived for future use",
      ]}
      ctaTitle="Ready to run campaigns that deliver?"
      ctaDescription="From planning to reporting, AgencyBoost keeps your campaigns organized and your results visible."
    />
  );
}
