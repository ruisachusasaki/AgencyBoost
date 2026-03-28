import { Link } from "wouter";
import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketingLayout from "./marketing-layout";

interface FeatureHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturePageProps {
  badge: string;
  badgeIcon: LucideIcon;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  highlights: FeatureHighlight[];
  benefitsTitle: string;
  benefitsAccent: string;
  benefitsDescription: string;
  benefits: string[];
  ctaTitle: string;
  ctaDescription: string;
}

export default function FeaturePageTemplate({
  badge,
  badgeIcon: BadgeIcon,
  headline,
  headlineAccent,
  subheadline,
  highlights,
  benefitsTitle,
  benefitsAccent,
  benefitsDescription,
  benefits,
  ctaTitle,
  ctaDescription,
}: FeaturePageProps) {
  return (
    <MarketingLayout>
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 mb-8">
            <BadgeIcon className="w-4 h-4" style={{ color: "hsl(179, 100%, 39%)" }} />
            <span className="text-sm font-medium text-gray-700">{badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            {headline}<br />
            <span style={{ color: "hsl(179, 100%, 39%)" }}>{headlineAccent}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-white px-8 py-6 text-lg" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need, built in
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Purpose-built features that work together seamlessly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "hsla(179, 100%, 39%, 0.1)" }}>
                  <item.icon className="w-6 h-6" style={{ color: "hsl(179, 100%, 39%)" }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {benefitsTitle}<br />
                <span style={{ color: "hsl(179, 100%, 39%)" }}>{benefitsAccent}</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {benefitsDescription}
              </p>
              <Link href="/login">
                <Button size="lg" className="text-white px-6" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                  Start Using AgencyBoost
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-1">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "hsl(179, 100%, 39%)" }} />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {ctaTitle}
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {ctaDescription}
          </p>
          <Link href="/login">
            <Button size="lg" className="px-8 py-6 text-lg font-semibold bg-white hover:bg-gray-100" style={{ color: "hsl(179, 100%, 39%)" }}>
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
