import {
  Layers, Zap, GitBranch, Bell, Clock, Settings,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { WorkflowsMockup } from "@/components/marketing/solution-mockups";

export default function WorkflowsSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Project Management"
      badgeIcon={Layers}
      headline="Automate repetitive"
      headlineAccent="processes."
      subheadline="Build custom automation workflows that trigger actions, send notifications, and keep your agency running on autopilot."
      mockup={<WorkflowsMockup />}
      highlights={[
        {
          icon: GitBranch,
          title: "Visual Workflow Builder",
          description: "Drag-and-drop builder lets you create automation workflows without writing code. If-then logic, branching, and loops."
        },
        {
          icon: Zap,
          title: "Trigger-Based Automation",
          description: "Set triggers based on events — new client, task completed, invoice overdue — and let the system handle the rest."
        },
        {
          icon: Bell,
          title: "Smart Notifications",
          description: "Automatically notify the right people at the right time via email, SMS, or in-app alerts."
        },
        {
          icon: Clock,
          title: "Scheduled Actions",
          description: "Schedule recurring workflows — weekly reports, monthly check-ins, quarterly reviews — that run automatically."
        },
        {
          icon: Settings,
          title: "Custom Actions",
          description: "Create tasks, update records, send emails, or trigger webhooks as part of your automated workflows."
        },
        {
          icon: Layers,
          title: "Template Library",
          description: "Start with pre-built workflow templates for common agency processes and customize them to fit your needs."
        },
      ]}
      benefitsTitle="Work smarter."
      benefitsAccent="Not harder."
      benefitsDescription="Automation eliminates manual work and human error. Your team focuses on strategy and creativity while the system handles the routine."
      benefits={[
        "Visual drag-and-drop workflow builder — no code required",
        "Event-based triggers respond to real-time changes",
        "Multi-step workflows with branching and conditions",
        "Automatic task creation, assignment, and notifications",
        "Scheduled workflows for recurring processes",
        "Pre-built templates for common agency automations",
        "Webhook support for connecting external tools",
        "Audit log tracks every automated action",
      ]}
      ctaTitle="Ready to automate your agency?"
      ctaDescription="Stop doing manually what a workflow can handle. Build once, run forever."
    />
  );
}
