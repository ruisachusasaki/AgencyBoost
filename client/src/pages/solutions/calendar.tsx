import {
  CalendarDays, Users, Globe, Clock, Video, Bell,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function CalendarSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Project Management"
      badgeIcon={CalendarDays}
      headline="Your team's schedule,"
      headlineAccent="all in one place."
      subheadline="Manage team calendars, book client meetings, and share public booking links. Integrates with Google Calendar for seamless scheduling."
      highlights={[
        {
          icon: CalendarDays,
          title: "Team Calendars",
          description: "Unified calendar view shows every team member's schedule, meetings, and availability at a glance."
        },
        {
          icon: Globe,
          title: "Public Booking Links",
          description: "Share booking links so clients and prospects can schedule meetings based on your real-time availability."
        },
        {
          icon: Users,
          title: "Round-Robin Scheduling",
          description: "Distribute meetings across team members automatically. Balance workloads and ensure fair distribution."
        },
        {
          icon: Video,
          title: "Video Meeting Integration",
          description: "Auto-generate Zoom or Google Meet links when meetings are booked. One-click to join from anywhere."
        },
        {
          icon: Bell,
          title: "Reminders & Notifications",
          description: "Automatic email and SMS reminders reduce no-shows. Customizable timing for different appointment types."
        },
        {
          icon: Clock,
          title: "Buffer & Availability",
          description: "Set buffer times between meetings, define working hours, and block off focus time automatically."
        },
      ]}
      benefitsTitle="No more scheduling chaos."
      benefitsAccent="Book it and forget it."
      benefitsDescription="Calendar integration eliminates double-bookings and back-and-forth emails. Your schedule works for you."
      benefits={[
        "Unified team calendar with real-time availability",
        "Public booking pages with customizable time slots",
        "Google Calendar two-way sync keeps everything current",
        "Automatic video meeting links for virtual appointments",
        "Email and SMS reminders reduce no-shows by up to 80%",
        "Buffer times and working hours prevent burnout",
        "Multiple calendar types — team, client, and personal",
        "Appointment analytics show booking trends and patterns",
      ]}
      ctaTitle="Ready to simplify your scheduling?"
      ctaDescription="Let clients book time with your team in seconds. No more email tennis for meeting times."
    />
  );
}
