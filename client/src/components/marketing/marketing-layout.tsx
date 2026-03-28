import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Rocket, ChevronDown, Users, Target, ListChecks, BarChart3,
  CalendarDays, Layers, Headphones, BookOpen, GraduationCap,
  UserPlus, Briefcase, ClipboardList, FileText, Globe, Mail,
  Ticket, Phone, ArrowRight, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const solutionCategories = [
  {
    title: "Client Management",
    items: [
      { icon: Users, title: "CRM & Clients", description: "Centralize client data and relationships", href: "/solutions/crm" },
      { icon: Globe, title: "Client Portal", description: "Self-service portal for your clients", href: "/solutions/client-portal" },
      { icon: ClipboardList, title: "Client Onboarding", description: "Streamlined onboarding workflows", href: "/solutions/onboarding" },
      { icon: FileText, title: "Invoicing & Billing", description: "Professional invoices and payments", href: "/solutions/invoicing" },
    ]
  },
  {
    title: "Sales & Marketing",
    items: [
      { icon: Target, title: "Lead Pipeline", description: "Track and convert leads efficiently", href: "/solutions/leads" },
      { icon: BarChart3, title: "Proposals & Quotes", description: "Win deals with polished proposals", href: "/solutions/proposals" },
      { icon: Mail, title: "Campaigns", description: "Plan and execute marketing campaigns", href: "/solutions/campaigns" },
      { icon: Globe, title: "Social Media", description: "Manage all social channels", href: "/solutions/social-media" },
    ]
  },
  {
    title: "Project Management",
    items: [
      { icon: ListChecks, title: "Task Management", description: "Organize, assign, and track work", href: "/solutions/tasks" },
      { icon: Layers, title: "Workflow Automation", description: "Automate repetitive processes", href: "/solutions/workflows" },
      { icon: CalendarDays, title: "Calendar & Scheduling", description: "Team calendars and booking links", href: "/solutions/calendar" },
    ]
  },
  {
    title: "Team & HR",
    items: [
      { icon: Briefcase, title: "HR & People", description: "Complete HR management suite", href: "/solutions/hr" },
      { icon: UserPlus, title: "Hiring & Recruiting", description: "Job postings and applicant tracking", href: "/solutions/hiring" },
      { icon: GraduationCap, title: "Training & LMS", description: "Employee training and courses", href: "/solutions/training" },
    ]
  },
  {
    title: "Support & Knowledge",
    items: [
      { icon: Ticket, title: "Support Tickets", description: "Customer support ticketing system", href: "/solutions/tickets" },
      { icon: BookOpen, title: "Knowledge Base", description: "Internal docs and resources", href: "/solutions/knowledge-base" },
      { icon: Phone, title: "Call Center", description: "Built-in VoIP and call tracking", href: "/solutions/call-center" },
    ]
  },
];

export { solutionCategories };

function MegaMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {solutionCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{category.title}</h3>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={onClose}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors w-full text-left group"
                    >
                      <item.icon className="w-5 h-5 mt-0.5 text-gray-400 group-hover:text-[hsl(179,100%,39%)] transition-colors flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-[hsl(179,100%,39%)] transition-colors">{item.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                      </div>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <span className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">AgencyBoost</span>
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Solutions
                  <ChevronDown className={`w-4 h-4 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
                </button>
                <Link href="/pricing">
                  <span className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                    Pricing
                  </span>
                </Link>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button size="sm" className="text-white font-semibold" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                  Login
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solutions</p>
              {solutionCategories.map((category) => (
                <div key={category.title} className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 pl-2">{category.title}</p>
                  {category.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <item.icon className="w-4 h-4 text-gray-400" />
                        {item.title}
                      </button>
                    </Link>
                  ))}
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4">
                <Link href="/pricing">
                  <span className="block px-2 py-2 text-sm font-medium text-gray-700 cursor-pointer">Pricing</span>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="w-full mt-2 text-white font-semibold" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>

      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">AgencyBoost</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The all-in-one CRM and operations platform built specifically for marketing agencies.
              </p>
            </div>
            {solutionCategories.slice(0, 4).map((category) => (
              <div key={category.title}>
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">{category.title}</h4>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} Media Optimizers, LLC. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></Link>
              <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span></Link>
              <Link href="/careers"><span className="hover:text-white cursor-pointer transition-colors">Careers</span></Link>
              <Link href="/login"><span className="hover:text-white cursor-pointer transition-colors">Login</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
