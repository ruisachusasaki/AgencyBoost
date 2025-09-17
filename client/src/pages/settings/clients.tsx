import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Contact, ArrowLeft, Settings } from "lucide-react";
import { Link } from "wouter";

export default function ClientsSettings() {
  const [activeTab, setActiveTab] = useState<"overview">("overview");

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back to Settings */}
        <div className="mb-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Contact className="h-8 w-8 text-primary" />
            Client Settings
          </h1>
          <p className="text-gray-600 mt-2">Configure client management settings and options</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Settings className="h-4 w-4" />
              Overview
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Settings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium mb-2">Coming Soon</h3>
                      <p className="text-sm text-gray-600">
                        Additional client management settings and configuration options will be added here.
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        In Development
                      </Badge>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium mb-2">Sub-tabs Ready</h3>
                      <p className="text-sm text-gray-600">
                        This section is prepared for additional sub-tabs and functionality as requested.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Ready for Configuration
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}