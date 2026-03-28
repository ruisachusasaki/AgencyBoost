import {
  BookOpen, Search, FolderOpen, FileText, Users, Lock,
} from "lucide-react";
import FeaturePageTemplate from "@/components/marketing/feature-page-template";

export default function KnowledgeBaseSolutionPage() {
  return (
    <FeaturePageTemplate
      badge="Support & Knowledge"
      badgeIcon={BookOpen}
      headline="Your agency's knowledge,"
      headlineAccent="organized and searchable."
      subheadline="Build an internal knowledge base with articles, guides, and documentation. Keep your team aligned and informed with a single source of truth."
      highlights={[
        {
          icon: FileText,
          title: "Rich Article Editor",
          description: "Full-featured editor with headings, tables, code blocks, callouts, and embedded media for professional documentation."
        },
        {
          icon: FolderOpen,
          title: "Categories & Folders",
          description: "Organize articles into categories and folders. Nested structure makes it easy to find anything."
        },
        {
          icon: Search,
          title: "Instant Search",
          description: "Full-text search finds answers in seconds. Search across titles, content, and tags simultaneously."
        },
        {
          icon: Users,
          title: "Team Contributions",
          description: "Any team member can write and publish articles. Collaborative editing keeps documentation current."
        },
        {
          icon: Lock,
          title: "Access Control",
          description: "Control who can view, edit, and manage articles. Department-specific knowledge stays with the right teams."
        },
        {
          icon: BookOpen,
          title: "SOPs & Processes",
          description: "Document standard operating procedures so processes are followed consistently, even when people are out."
        },
      ]}
      benefitsTitle="Document once."
      benefitsAccent="Answer forever."
      benefitsDescription="Every time someone asks 'how do we do this?', the answer should already be written down. A good knowledge base saves hours every week."
      benefits={[
        "Rich text editor with tables, code blocks, and callouts",
        "Organized folder and category structure",
        "Full-text search across all articles and documents",
        "Version history tracks changes and authors",
        "Role-based access control for sensitive documentation",
        "Article analytics show most-viewed and most-needed content",
        "Tags and cross-references link related articles",
        "Pin important articles for quick team access",
      ]}
      ctaTitle="Ready to build your knowledge base?"
      ctaDescription="Stop answering the same questions twice. Document your processes and empower your team to find answers."
    />
  );
}
