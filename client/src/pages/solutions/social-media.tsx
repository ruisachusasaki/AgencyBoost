import {
  Globe, CalendarDays, BarChart3, Image, Users, MessageSquare,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function SocialMediaSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Sales & Marketing"
      badgeIcon={Globe}
      headline="Manage all your"
      headlineAccent="social channels."
      subheadline="Schedule posts, track engagement, and manage multiple social media accounts for your agency and your clients — all from one place."
      highlights={[
        {
          icon: CalendarDays,
          title: "Content Calendar",
          description: "Visual content calendar with drag-and-drop scheduling across all platforms and client accounts."
        },
        {
          icon: Image,
          title: "Asset Management",
          description: "Upload, organize, and reuse creative assets. Keep brand-approved images and videos in one library."
        },
        {
          icon: BarChart3,
          title: "Engagement Analytics",
          description: "Track likes, shares, comments, and follower growth across all accounts with unified reporting."
        },
        {
          icon: Users,
          title: "Multi-Client Management",
          description: "Manage social accounts for multiple clients from one dashboard. Switch contexts in one click."
        },
        {
          icon: MessageSquare,
          title: "Comment Monitoring",
          description: "Monitor and respond to comments across all platforms. Never miss a client mention or DM."
        },
        {
          icon: Globe,
          title: "Cross-Platform Posting",
          description: "Create once, publish everywhere. Customize content for each platform while maintaining your message."
        },
      ]}
      benefitsTitle="Social at scale."
      benefitsAccent="Without the chaos."
      benefitsDescription="Managing social media for multiple clients shouldn't mean juggling a dozen tools. One platform handles it all."
      benefits={[
        "Unified calendar across all clients and platforms",
        "Bulk scheduling for efficient content management",
        "Brand asset library with organized media storage",
        "Cross-platform analytics in a single dashboard",
        "Approval workflows for client content sign-off",
        "Comment monitoring and response management",
        "Hashtag tracking and performance analysis",
        "Client-ready social media reports on demand",
      ]}
      ctaTitle="Ready to simplify social media management?"
      ctaDescription="Manage every client's social presence from one powerful dashboard. Less tab-switching, more impact."
    />
  );
}
