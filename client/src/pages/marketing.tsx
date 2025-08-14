import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, FileText } from "lucide-react";
import EmailTemplates from "./marketing/email";
import SmsTemplates from "./marketing/sms";
import Forms from "./marketing/forms";

export default function Marketing() {
  const [location] = useLocation();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location === "/marketing/sms") {
      return "sms";
    } else if (location === "/marketing/forms") {
      return "forms";
    } else if (location === "/marketing" || location === "/marketing/email") {
      return "email";
    }
    return "email"; // default to email
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: "email",
      name: "Email",
      href: "/marketing",
      icon: Mail,
    },
    {
      id: "sms",
      name: "SMS",
      href: "/marketing/sms",
      icon: MessageSquare,
    },
    {
      id: "forms",
      name: "Forms",
      href: "/marketing/forms",
      icon: FileText,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "forms":
        return <Forms />;
      case "sms":
        return <SmsTemplates />;
      case "email":
      default:
        return <EmailTemplates />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">
            Manage your email campaigns, SMS messaging, and forms
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center space-x-2 border-b-2 py-2 px-1 text-sm font-medium transition-colors hover:text-foreground",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
}