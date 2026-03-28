import {
  Globe, ClipboardList, FileText, BarChart3, Mail, Globe as Globe2,
  Layers, CalendarDays, UserPlus, GraduationCap, BookOpen, Phone,
} from "lucide-react";
import SolutionPlaceholderPage from "./placeholder";

export function ClientPortalSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Client Management"
      badgeIcon={Globe}
      title="Give clients their own"
      titleAccent="self-service portal."
      description="A branded client portal where your clients can view project status, approve deliverables, submit requests, and stay in the loop — without endless email threads."
    />
  );
}

export function OnboardingSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Client Management"
      badgeIcon={ClipboardList}
      title="Onboard new clients"
      titleAccent="in minutes, not days."
      description="Automated onboarding workflows that collect client information, assign tasks, and kick off projects — so your team can start delivering immediately."
    />
  );
}

export function InvoicingSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Client Management"
      badgeIcon={FileText}
      title="Get paid faster with"
      titleAccent="professional invoicing."
      description="Create, send, and track invoices directly from your CRM. Automatic reminders, payment tracking, and integration with your client records."
    />
  );
}

export function ProposalsSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Sales & Marketing"
      badgeIcon={BarChart3}
      title="Win more deals with"
      titleAccent="polished proposals."
      description="Build beautiful proposals and quotes with your products and packages. Send, track, and close deals — all from one platform."
    />
  );
}

export function CampaignsSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Sales & Marketing"
      badgeIcon={Mail}
      title="Plan and execute"
      titleAccent="marketing campaigns."
      description="Organize campaigns, track performance, and coordinate your team's marketing efforts from a single dashboard."
    />
  );
}

export function SocialMediaSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Sales & Marketing"
      badgeIcon={Globe2}
      title="Manage all your"
      titleAccent="social channels."
      description="Schedule posts, track engagement, and manage multiple social media accounts for your agency and your clients."
    />
  );
}

export function WorkflowsSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Project Management"
      badgeIcon={Layers}
      title="Automate repetitive"
      titleAccent="processes."
      description="Build custom automation workflows that trigger actions, send notifications, and keep your agency running on autopilot."
    />
  );
}

export function CalendarSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Project Management"
      badgeIcon={CalendarDays}
      title="Your team's schedule,"
      titleAccent="all in one place."
      description="Manage team calendars, book client meetings, and share public booking links. Integrates with Google Calendar for seamless scheduling."
    />
  );
}

export function HiringSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Team & HR"
      badgeIcon={UserPlus}
      title="Hire the best talent"
      titleAccent="for your agency."
      description="Post job openings, receive applications, track candidates through your hiring pipeline, and send offer letters — all within AgencyBoost."
    />
  );
}

export function TrainingSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Team & HR"
      badgeIcon={GraduationCap}
      title="Train and develop"
      titleAccent="your team."
      description="Build courses, assign lessons, track completion, and ensure your team is always learning and growing with a built-in LMS."
    />
  );
}

export function KnowledgeBaseSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Support & Knowledge"
      badgeIcon={BookOpen}
      title="Your agency's knowledge,"
      titleAccent="organized and searchable."
      description="Build an internal knowledge base with articles, guides, and documentation. Keep your team aligned and informed."
    />
  );
}

export function CallCenterSolution() {
  return (
    <SolutionPlaceholderPage
      badge="Support & Knowledge"
      badgeIcon={Phone}
      title="Built-in VoIP and"
      titleAccent="call tracking."
      description="Make and receive calls directly from your CRM. Track call history, record conversations, and never miss a client call."
    />
  );
}
