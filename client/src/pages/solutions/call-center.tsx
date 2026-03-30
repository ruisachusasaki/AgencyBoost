import {
  Phone, Headphones, BarChart3, Users, Clock, Voicemail,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { CallCenterMockup } from "@/components/marketing/solution-mockups";

export default function CallCenterSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Support & Knowledge"
      badgeIcon={Phone}
      headline="Built-in VoIP and"
      headlineAccent="call tracking."
      subheadline="Make and receive calls directly from your CRM. Track call history, log conversations, and never miss a client call again."
      mockup={<CallCenterMockup />}
      highlights={[
        {
          icon: Phone,
          title: "Browser-Based Calling",
          description: "Make and receive calls directly from your browser. No separate phone system or softphone needed."
        },
        {
          icon: Headphones,
          title: "Call Center Dashboard",
          description: "Live dashboard shows active calls, queue status, and agent availability for real-time management."
        },
        {
          icon: Clock,
          title: "Call Logging",
          description: "Every call is automatically logged with duration, outcome, and notes. Full call history per client."
        },
        {
          icon: Voicemail,
          title: "Voicemail & Recording",
          description: "Voicemail transcription and optional call recording for quality assurance and training purposes."
        },
        {
          icon: Users,
          title: "Call Routing",
          description: "Route incoming calls to the right team member based on client assignment, department, or availability."
        },
        {
          icon: BarChart3,
          title: "Call Analytics",
          description: "Track call volume, average duration, response times, and missed calls to optimize your phone support."
        },
      ]}
      benefitsTitle="Every call counts."
      benefitsAccent="Never miss one."
      benefitsDescription="Phone calls are still the fastest way to resolve issues and build relationships. Built-in VoIP means your CRM and phone system are one and the same."
      benefits={[
        "Browser-based calling — no hardware or softphone needed",
        "Automatic call logging linked to client records",
        "Incoming call routing based on client and team rules",
        "Voicemail with transcription for quick review",
        "Call recording for training and quality assurance",
        "Real-time dashboard shows queue and agent status",
        "Call analytics track volume, duration, and response time",
        "Click-to-call from any client or lead profile",
      ]}
      ctaTitle="Ready to upgrade your phone system?"
      ctaDescription="Ditch the separate phone system. AgencyBoost puts calling, tracking, and analytics in one platform."
    />
  );
}
