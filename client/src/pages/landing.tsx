import { useState } from "react";
import { Link } from "wouter";
import { 
  ArrowRight, BarChart3, Users, Target, CheckCircle2, Zap, Shield, 
  Clock, TrendingUp, Layers, CalendarDays, ListChecks, Rocket,
  ChevronRight, Star, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Centralize client data, track interactions, and manage relationships from one dashboard."
  },
  {
    icon: Target,
    title: "Lead Tracking & Conversion",
    description: "Capture leads, nurture them through your pipeline, and convert them into paying clients seamlessly."
  },
  {
    icon: ListChecks,
    title: "Task Automation",
    description: "Auto-generate onboarding and recurring tasks when clients sign up. Never miss a deliverable."
  },
  {
    icon: BarChart3,
    title: "Sales & Quoting",
    description: "Build quotes with products, bundles, and packages. Track your pipeline from proposal to close."
  },
  {
    icon: CalendarDays,
    title: "Calendar & Scheduling",
    description: "Manage team calendars, book client meetings, and share public booking links."
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Track billable hours per task and client. Manual entry and live timers built in."
  },
  {
    icon: Layers,
    title: "Workflow Builder",
    description: "Create custom automation workflows to streamline your agency operations."
  },
  {
    icon: TrendingUp,
    title: "Reports & Analytics",
    description: "Real-time dashboards and reports to measure performance across every department."
  },
  {
    icon: Shield,
    title: "Roles & Permissions",
    description: "Granular access control so every team member sees only what they need."
  }
];

const benefits = [
  "All-in-one platform built specifically for marketing agencies",
  "Automated onboarding tasks when clients are converted",
  "Custom product bundles and package pricing",
  "Team management with roles, permissions, and departments",
  "Built-in knowledge base and training system",
  "Client portal for transparency and communication",
  "Ticket system for support requests",
  "HR module for hiring and contractor management"
];

function ContactSection() {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/contact-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tcpaConsent }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to boost your agency?
        </h2>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          Join marketing agencies that use AgencyBoost to streamline operations, 
          automate workflows, and deliver better results for their clients.
        </p>

        {submitted ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-lg mx-auto border border-white/20">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Thank you!</h3>
            <p className="text-white/80">We received your inquiry and will be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-lg mx-auto border border-white/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-white text-gray-900 border-0 placeholder:text-gray-400"
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-white text-gray-900 border-0 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white text-gray-900 border-0 placeholder:text-gray-400"
              />
              <Input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white text-gray-900 border-0 placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-start gap-3 mb-6 text-left">
              <Checkbox
                id="tcpa-consent"
                checked={tcpaConsent}
                onCheckedChange={(checked) => setTcpaConsent(checked === true)}
                className="mt-0.5 border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-teal-600"
              />
              <label htmlFor="tcpa-consent" className="text-xs leading-relaxed cursor-pointer" style={{ color: "#111827" }}>
                By checking this box, I consent to receive calls, text messages, and/or emails from Media Optimizers, LLC 
                at the contact information provided. I understand that these communications may be generated using an 
                automated system and that consent is not a condition of purchase. Message and data rates may apply. 
                I can opt out at any time by replying STOP or contacting us directly.
              </label>
            </div>

            {error && <p className="text-red-200 text-sm mb-4">{error}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full px-8 py-6 text-lg font-semibold bg-white hover:bg-gray-100"
              style={{ color: "hsl(179, 100%, 39%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Get Started
                  <Send className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AgencyBoost</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button size="sm" className="text-white font-semibold" style={{ backgroundColor: "#00C7C4" }}>
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 mb-8">
            <Zap className="w-4 h-4" style={{ color: "hsl(179, 100%, 39%)" }} />
            <span className="text-sm font-medium text-gray-700">Built for marketing agencies</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            Run your agency<br />
            <span style={{ color: "hsl(179, 100%, 39%)" }}>like a machine.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            AgencyBoost is the all-in-one CRM and operations platform that helps marketing agencies 
            manage clients, automate tasks, track time, and scale with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-white px-8 py-6 text-lg" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your agency
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From lead capture to client delivery, AgencyBoost handles every step of your agency workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "hsla(179, 100%, 39%, 0.1)" }}>
                  <feature.icon className="w-6 h-6" style={{ color: "hsl(179, 100%, 39%)" }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Stop juggling tools.<br />
                <span style={{ color: "hsl(179, 100%, 39%)" }}>Start scaling.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Most agencies piece together 5-10 different tools to manage their operations. 
                AgencyBoost replaces them all with one purpose-built platform.
              </p>
              <Link href="/login">
                <Button size="lg" className="text-white px-6" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                  Start Using AgencyBoost
                  <ChevronRight className="ml-1 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-1">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "hsl(179, 100%, 39%)" }} />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Contact Form */}
      <ContactSection />

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">AgencyBoost</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy">
                <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              </Link>
              <Link href="/terms">
                <span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span>
              </Link>
              <Link href="/login">
                <span className="hover:text-white cursor-pointer transition-colors">Login</span>
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Media Optimizers, LLC. All rights reserved.</p>
            <p className="mt-1 text-gray-500">AgencyBoost is a product of Media Optimizers, LLC.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
