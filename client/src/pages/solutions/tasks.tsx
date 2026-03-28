import {
  ListChecks, Clock, Users, Layers, Tags, GitBranch,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function TasksSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Project Management"
      badgeIcon={ListChecks}
      headline="Deliver every project"
      headlineAccent="on time, every time."
      subheadline="Organize, assign, and track every task across your agency. From client deliverables to internal projects, never miss a deadline again."
      highlights={[
        {
          icon: ListChecks,
          title: "Task Boards & Lists",
          description: "Switch between kanban boards, list views, and calendar views. Organize tasks the way your team works best."
        },
        {
          icon: Clock,
          title: "Time Tracking",
          description: "Built-in timers and manual time entry on every task. Track billable hours per client without a separate tool."
        },
        {
          icon: Users,
          title: "Team Assignment",
          description: "Assign tasks to individuals or teams. Set watchers, add followers, and keep everyone in the loop."
        },
        {
          icon: GitBranch,
          title: "Dependencies & Sub-tasks",
          description: "Break complex projects into sub-tasks. Set dependencies so work flows in the right order."
        },
        {
          icon: Tags,
          title: "Tags & Custom Fields",
          description: "Tag tasks by client, project, or priority. Add custom fields to track exactly what you need."
        },
        {
          icon: Layers,
          title: "Task Templates",
          description: "Create reusable templates for recurring work. New client onboarding? Monthly reports? One click and it's set up."
        },
      ]}
      benefitsTitle="No more missed deadlines."
      benefitsAccent="No more dropped balls."
      benefitsDescription="When every task is tracked, assigned, and timed, your agency runs like clockwork."
      benefits={[
        "Multiple views — kanban, list, and calendar — for every workflow",
        "Built-in time tracking eliminates the need for separate time tools",
        "Task templates automate setup for recurring client work",
        "Sub-tasks and dependencies keep complex projects organized",
        "Priority levels and due dates surface what needs attention now",
        "Activity feed and comments keep all context in one place",
        "File attachments and links on every task",
        "Automated task creation when new clients are onboarded",
      ]}
      ctaTitle="Ready to get your agency organized?"
      ctaDescription="Stop managing projects in spreadsheets and chat threads. AgencyBoost brings everything together."
    />
  );
}
