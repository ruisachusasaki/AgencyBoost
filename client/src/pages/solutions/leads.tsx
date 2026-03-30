import {
  Target, Filter, TrendingUp, Users, CalendarDays, Zap,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { LeadsMockup } from "@/components/marketing/solution-mockups";

export default function LeadsSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Sales & Marketing"
      badgeIcon={Target}
      headline="Turn prospects into"
      headlineAccent="paying clients."
      subheadline="Capture, score, and nurture leads through a visual pipeline. Know exactly where every deal stands and what to do next to close it."
      mockup={<LeadsMockup />}
      highlights={[
        {
          icon: Filter,
          title: "Visual Pipeline",
          description: "Drag-and-drop kanban board shows every lead's stage at a glance. Customize stages to match your sales process."
        },
        {
          icon: TrendingUp,
          title: "Lead Scoring",
          description: "Automatically score leads based on engagement, budget, and fit. Focus your time on the deals most likely to close."
        },
        {
          icon: Users,
          title: "Contact Management",
          description: "Store detailed contact information, company data, and interaction history for every lead."
        },
        {
          icon: CalendarDays,
          title: "Appointment Booking",
          description: "Share booking links so leads can schedule discovery calls and demos directly on your calendar."
        },
        {
          icon: Zap,
          title: "Auto-Conversion",
          description: "When a lead closes, automatically create a client profile, generate onboarding tasks, and kick off your workflow."
        },
        {
          icon: Target,
          title: "Source Tracking",
          description: "Track where your leads come from — referrals, ads, website forms, or manual entry — to optimize your marketing spend."
        },
      ]}
      benefitsTitle="Close more deals."
      benefitsAccent="Waste less time."
      benefitsDescription="A structured pipeline eliminates guesswork. Know exactly which leads need attention and what action to take next."
      benefits={[
        "Visual kanban pipeline with customizable stages",
        "Lead scoring prioritizes your highest-value prospects",
        "One-click conversion from lead to client with auto-onboarding",
        "Appointment scheduling with public booking links",
        "Source tracking shows which channels drive the most revenue",
        "Detailed lead profiles with full communication history",
        "Bulk import leads from spreadsheets or other CRMs",
        "Activity logging keeps your entire team aligned on every deal",
      ]}
      ctaTitle="Ready to build a predictable sales pipeline?"
      ctaDescription="Stop letting leads fall through the cracks. AgencyBoost gives you the tools to close more deals, faster."
    />
  );
}
