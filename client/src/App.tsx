import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import EnhancedClientDetail from "@/pages/enhanced-client-detail";
import Projects from "@/pages/projects";
import Campaigns from "@/pages/campaigns";
import Leads from "@/pages/leads";
import Tasks from "@/pages/tasks";
import Invoices from "@/pages/invoices";
import Reports from "@/pages/reports";
import SocialMedia from "@/pages/social-media";
import Workflows from "@/pages/workflows";
import Settings from "@/pages/settings";
import BusinessProfile from "@/pages/settings/business-profile";
import MyProfile from "@/pages/settings/my-profile";
import Staff from "@/pages/settings/staff";
import Support from "@/pages/settings/support";
import RolesPermissions from "@/pages/settings/roles-permissions";
import Integrations from "@/pages/settings/integrations";
import CustomFields from "@/pages/settings/custom-fields";
import Tags from "@/pages/settings/tags";
import Products from "@/pages/settings/products";
import AuditLogs from "@/pages/settings/audit-logs";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={EnhancedClientDetail} />
      <Route path="/projects" component={Projects} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/leads" component={Leads} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/reports" component={Reports} />
      <Route path="/social-media" component={SocialMedia} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/business-profile" component={BusinessProfile} />
      <Route path="/settings/my-profile" component={MyProfile} />
      <Route path="/settings/staff" component={Staff} />
      <Route path="/settings/support" component={Support} />
      <Route path="/settings/roles-permissions" component={RolesPermissions} />
      <Route path="/settings/integrations" component={Integrations} />
      <Route path="/settings/custom-fields" component={CustomFields} />
      <Route path="/settings/tags" component={Tags} />
      <Route path="/settings/products" component={Products} />
      <Route path="/settings/audit-logs" component={AuditLogs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainLayout>
          <Router />
        </MainLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
