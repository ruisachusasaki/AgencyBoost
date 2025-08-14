import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Megaphone, Mail, FileText } from "lucide-react";
import Campaigns from "./campaigns";
import Forms from "./marketing/forms";

export default function Marketing() {
  const [location] = useLocation();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location === "/marketing/templates" || location === "/marketing") {
      return "templates";
    } else if (location === "/marketing/forms") {
      return "forms";
    }
    return "templates"; // default to templates (which is current campaigns page)
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: "campaigns",
      name: "Campaigns",
      href: "/marketing/campaigns",
      icon: Megaphone,
      disabled: true, // Will implement later
    },
    {
      id: "templates",
      name: "Templates",
      href: "/marketing",
      icon: Mail,
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
      case "templates":
      default:
        return <Campaigns />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">
            Manage your marketing campaigns, templates, and forms
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            if (tab.disabled) {
              return (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center space-x-2 border-b-2 border-transparent py-2 px-1 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                  <span className="text-xs">(Coming Soon)</span>
                </div>
              );
            }
            
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