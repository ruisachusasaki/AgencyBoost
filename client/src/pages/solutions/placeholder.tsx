import { Link } from "wouter";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketingLayout from "@/components/marketing/marketing-layout";

interface PlaceholderPageProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  titleAccent: string;
  description: string;
}

export default function SolutionPlaceholderPage({
  badge,
  badgeIcon: BadgeIcon,
  title,
  titleAccent,
  description,
}: PlaceholderPageProps) {
  return (
    <MarketingLayout>
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 mb-8">
            <BadgeIcon className="w-4 h-4" style={{ color: "hsl(179, 100%, 39%)" }} />
            <span className="text-sm font-medium text-gray-700">{badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            {title}<br />
            <span style={{ color: "hsl(179, 100%, 39%)" }}>{titleAccent}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-white px-8 py-6 text-lg" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                Explore All Solutions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
