import {
  Briefcase, UserPlus, CalendarDays, GraduationCap, ClipboardList, Users,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function HrSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Team & HR"
      badgeIcon={Briefcase}
      headline="Manage your team"
      headlineAccent="not just your clients."
      subheadline="A complete HR suite built for agencies. Hire, onboard, train, and manage your team — all within the same platform you use to run your business."
      highlights={[
        {
          icon: Users,
          title: "Staff Directory",
          description: "Centralized employee profiles with roles, departments, contact info, and an interactive org chart."
        },
        {
          icon: UserPlus,
          title: "Hiring & Recruiting",
          description: "Post job openings, receive applications, track candidates through your hiring pipeline, and send offer letters."
        },
        {
          icon: ClipboardList,
          title: "Onboarding & Offboarding",
          description: "Customizable checklists ensure every new hire gets a consistent, thorough onboarding experience."
        },
        {
          icon: CalendarDays,
          title: "Time Off & PTO",
          description: "Employees request time off, managers approve, and everyone sees who's out — all in one place."
        },
        {
          icon: GraduationCap,
          title: "Training & LMS",
          description: "Build courses, assign lessons, track completion, and ensure your team is always learning and growing."
        },
        {
          icon: Briefcase,
          title: "1-on-1 Meetings",
          description: "Schedule and track one-on-one meetings with agendas, notes, and action items. Build a culture of feedback."
        },
      ]}
      benefitsTitle="Your team is your agency."
      benefitsAccent="Invest in them."
      benefitsDescription="Great agencies are built on great teams. AgencyBoost gives you the HR tools to hire, develop, and retain top talent — without a separate HR platform."
      benefits={[
        "Full hiring pipeline from job posting to signed offer letter",
        "Customizable onboarding checklists for every role",
        "Built-in LMS with courses, quizzes, and completion tracking",
        "PTO and time-off management with calendar integration",
        "1-on-1 meeting tracking with agenda templates",
        "Expense report submission and approval workflows",
        "Org chart visualization shows team structure at a glance",
        "Employee profiles with roles, permissions, and department info",
      ]}
      ctaTitle="Ready to build a world-class team?"
      ctaDescription="Stop managing your team across email, spreadsheets, and Slack. AgencyBoost brings it all together."
    />
  );
}
