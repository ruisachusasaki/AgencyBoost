import {
  Ticket, Clock, Users, BarChart3, MessageSquare, Filter,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";
import { TicketsMockup } from "@/components/marketing/solution-mockups";

export default function TicketsSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Support & Knowledge"
      badgeIcon={Ticket}
      headline="Support that scales"
      headlineAccent="with your agency."
      subheadline="A full-featured ticketing system built right into your CRM. Track issues, measure response times, and keep clients happy — without another tool."
      mockup={<TicketsMockup />}
      highlights={[
        {
          icon: Ticket,
          title: "Ticket Management",
          description: "Create, assign, and track support tickets with priorities, categories, and custom statuses."
        },
        {
          icon: Clock,
          title: "SLA & Response Tracking",
          description: "Automatically track first response time, resolution time, and SLA compliance for every ticket."
        },
        {
          icon: Users,
          title: "Team Routing",
          description: "Auto-assign tickets based on category, priority, or round-robin. Make sure the right person handles every issue."
        },
        {
          icon: BarChart3,
          title: "Reports & Analytics",
          description: "Dashboard with resolution rates, response times, ticket volume trends, and team performance metrics."
        },
        {
          icon: MessageSquare,
          title: "Client-Facing Forms",
          description: "Share public ticket submission forms so clients can submit requests directly — no email needed."
        },
        {
          icon: Filter,
          title: "Tags & Categorization",
          description: "Organize tickets by type, source, and custom tags. Filter and search to find anything instantly."
        },
      ]}
      benefitsTitle="Happy clients stay longer."
      benefitsAccent="Support makes the difference."
      benefitsDescription="Fast, organized support is the #1 driver of client retention for agencies. Built-in ticketing means no more lost emails or forgotten requests."
      benefits={[
        "Tickets linked directly to client profiles for full context",
        "Public submission forms eliminate email back-and-forth",
        "Automatic SLA tracking ensures nothing slips through the cracks",
        "Kanban and list views for managing ticket queues",
        "Screenshot and file attachments on every ticket",
        "Response time analytics identify bottlenecks in your process",
        "Team performance reports show who's resolving the most tickets",
        "Loom video integration for visual bug reports and explanations",
      ]}
      ctaTitle="Ready to deliver world-class support?"
      ctaDescription="Your clients expect fast, professional support. AgencyBoost makes it effortless."
    />
  );
}
