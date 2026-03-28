import {
  GraduationCap, BookOpen, Video, BarChart3, CheckCircle2, Award,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function TrainingSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Team & HR"
      badgeIcon={GraduationCap}
      headline="Train and develop"
      headlineAccent="your team."
      subheadline="Build courses, assign lessons, track completion, and ensure your team is always learning and growing with a built-in learning management system."
      highlights={[
        {
          icon: BookOpen,
          title: "Course Builder",
          description: "Create structured courses with modules, lessons, and quizzes. Rich text, video, and file attachments supported."
        },
        {
          icon: Video,
          title: "Video Lessons",
          description: "Upload or embed training videos with Loom integration. Visual learning for processes, tools, and best practices."
        },
        {
          icon: GraduationCap,
          title: "Learning Paths",
          description: "Define learning paths by role or department. New hires follow structured onboarding courses automatically."
        },
        {
          icon: CheckCircle2,
          title: "Progress Tracking",
          description: "Track lesson completion, quiz scores, and overall course progress for every team member."
        },
        {
          icon: BarChart3,
          title: "Analytics Dashboard",
          description: "See completion rates, engagement metrics, and knowledge gaps across your team at a glance."
        },
        {
          icon: Award,
          title: "Certificates",
          description: "Auto-generate completion certificates for courses. Motivate learning and document team capabilities."
        },
      ]}
      benefitsTitle="A trained team is"
      benefitsAccent="a productive team."
      benefitsDescription="Consistent training reduces mistakes, speeds up onboarding, and builds institutional knowledge that stays even when people move on."
      benefits={[
        "Full course builder with rich text, video, and attachments",
        "Structured learning paths per role and department",
        "Automatic assignment of courses to new hires",
        "Quiz and assessment support with scoring",
        "Progress tracking per employee across all courses",
        "Completion certificates generated automatically",
        "Video integration with Loom and embedded players",
        "Training analytics identify knowledge gaps",
      ]}
      ctaTitle="Ready to invest in your team's growth?"
      ctaDescription="Build a culture of continuous learning with a training platform built right into your agency tools."
    />
  );
}
