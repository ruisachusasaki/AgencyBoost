import {
  UserPlus, FileText, Filter, MessageSquare, CheckCircle2, BarChart3,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function HiringSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Team & HR"
      badgeIcon={UserPlus}
      headline="Hire the best talent"
      headlineAccent="for your agency."
      subheadline="Post job openings, receive applications, track candidates through your hiring pipeline, and send offer letters — all within AgencyBoost."
      highlights={[
        {
          icon: FileText,
          title: "Job Postings",
          description: "Create professional job listings with descriptions, requirements, and application forms. Publish to your careers page instantly."
        },
        {
          icon: Filter,
          title: "Applicant Pipeline",
          description: "Visual kanban board tracks candidates from application to offer. Drag and drop between stages with notes and ratings."
        },
        {
          icon: MessageSquare,
          title: "Team Collaboration",
          description: "Hiring managers leave notes, share feedback, and rate candidates collaboratively before making decisions."
        },
        {
          icon: CheckCircle2,
          title: "Offer Letters",
          description: "Generate and send professional offer letters with e-signature capability. Track acceptance status in real time."
        },
        {
          icon: UserPlus,
          title: "IC Agreements",
          description: "For contractors and freelancers, generate independent contractor agreements with built-in e-signature."
        },
        {
          icon: BarChart3,
          title: "Hiring Analytics",
          description: "Track time-to-hire, source effectiveness, and pipeline conversion rates to optimize your recruiting process."
        },
      ]}
      benefitsTitle="Great agencies start with"
      benefitsAccent="great hires."
      benefitsDescription="A structured hiring process helps you find better talent faster. No more lost resumes or forgotten follow-ups."
      benefits={[
        "Branded careers page with active job listings",
        "Structured application forms collect what you need",
        "Visual pipeline tracks every candidate's progress",
        "Collaborative scoring and notes for hiring teams",
        "Automated email notifications at each pipeline stage",
        "Offer letter generation with e-signature",
        "IC agreement support for contractors",
        "Source tracking shows where your best hires come from",
      ]}
      ctaTitle="Ready to build your dream team?"
      ctaDescription="Find, evaluate, and hire top talent with a recruiting pipeline built right into your CRM."
    />
  );
}
