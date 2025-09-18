import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimerProvider } from "@/contexts/TimerContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import AuthGate from "@/components/AuthGate";
import Clients from "@/pages/clients";
import EnhancedClientDetail from "@/pages/enhanced-client-detail";

import Campaigns from "@/pages/campaigns";
import Leads from "@/pages/leads";
import Tasks from "@/pages/tasks";
import TaskDetail from "@/pages/task-detail";
import Invoices from "@/pages/invoices";
import Reports from "@/pages/reports";
import SocialMedia from "@/pages/social-media";
import Workflows from "@/pages/workflows";
import WorkflowBuilder from "@/pages/workflow-builder";
import Calendar from "@/pages/calendar";
import CalendarMain from "@/pages/calendar-main";
import CalendarSettings from "@/pages/calendar-settings";
import CalendarEdit from "@/pages/calendar-edit";
import PublicBooking from "@/pages/public-booking";
import BookingEmbed from "@/pages/booking-embed";
import Settings from "@/pages/settings";
import BusinessProfile from "@/pages/settings/business-profile";
import MyProfile from "@/pages/settings/my-profile";
import Staff from "@/pages/settings/staff";
import StaffDetail from "@/pages/settings/staff-detail";
import TeamDetail from "@/pages/settings/team-detail";
import RolesPermissions from "@/pages/settings/roles-permissions";
import Integrations from "@/pages/settings/integrations";
import CustomFields from "@/pages/settings/custom-fields";
import EditFolder from "@/pages/settings/edit-folder";
import Tags from "@/pages/settings/tags";
import Products from "@/pages/settings/products";
import AuditLogs from "@/pages/settings/audit-logs";
import PermissionAudit from "@/pages/settings/permission-audit";
import TasksSettings from "@/pages/settings/tasks";
import AutomationTriggers from "@/pages/settings/automation-triggers";
import MainLayout from "@/components/layout/main-layout";
import FormBuilder from "@/pages/form-builder";
import FormsTest from "@/pages/forms-test";
import HRPage from "@/pages/hr";
import ApplicantDetailPage from "@/pages/applicant-detail";
import HRSettings from "@/pages/settings/hr-settings";
import ClientsSettings from "@/pages/settings/clients";
import CareersPage from "@/pages/careers";
import KnowledgeBase from "@/pages/knowledge-base";
import ArticleView from "@/pages/article-view";
import Training from "@/pages/training";
import TrainingAnalytics from "@/pages/training/analytics";
import CourseDetail from "@/pages/training/course-detail";
import LessonDetail from "@/pages/training/lesson-detail";
import CreateCourse from "@/pages/training/create-course";
import EditCourse from "@/pages/training/edit-course";
import LessonManagement from "@/pages/training/lesson-management";
import CreateLesson from "@/pages/training/create-lesson";
import EditLesson from "@/pages/training/edit-lesson";

function Router() {
  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/login" component={LoginPage} />
      <Route path="/book/:customUrl" component={PublicBooking} />
      <Route path="/embed/:customUrl" component={BookingEmbed} />
      <Route path="/careers" component={CareersPage} />
      
      {/* Protected routes - authentication required */}
      <Route path="/">
        {() => (
          <AuthGate>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/clients">
        {() => (
          <AuthGate>
            <MainLayout>
              <Clients />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/clients/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <EnhancedClientDetail />
            </MainLayout>
          </AuthGate>
        )}
      </Route>

      <Route path="/marketing">
        {() => (
          <AuthGate>
            <MainLayout>
              <Campaigns />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/leads">
        {() => (
          <AuthGate>
            <MainLayout>
              <Leads />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/tasks">
        {() => (
          <AuthGate>
            <MainLayout>
              <Tasks />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/tasks/:taskId">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <TaskDetail />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/invoices">
        {() => (
          <AuthGate>
            <MainLayout>
              <Invoices />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/reports">
        {() => (
          <AuthGate>
            <MainLayout>
              <Reports />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/social-media">
        {() => (
          <AuthGate>
            <MainLayout>
              <SocialMedia />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/workflows">
        {() => (
          <AuthGate>
            <MainLayout>
              <Workflows />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/workflows/build">
        {() => (
          <AuthGate>
            <MainLayout>
              <WorkflowBuilder />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/hr">
        {() => (
          <AuthGate>
            <MainLayout>
              <HRPage />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/hr/applicant/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <ApplicantDetailPage />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training">
        {() => (
          <AuthGate>
            <MainLayout>
              <Training />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/analytics">
        {() => (
          <AuthGate>
            <MainLayout>
              <TrainingAnalytics />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <CourseDetail />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/lessons/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <LessonDetail />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id/edit">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <EditCourse />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id/lessons">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <LessonManagement />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id/lessons/create">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <CreateLesson />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:courseId/lessons/:id/edit">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <EditLesson />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/create">
        {() => (
          <AuthGate>
            <MainLayout>
              <CreateCourse />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/resources">
        {() => (
          <AuthGate>
            <MainLayout>
              <KnowledgeBase />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/resources/articles/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <ArticleView />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/calendar">
        {() => (
          <AuthGate>
            <MainLayout>
              <CalendarMain />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/calendar/settings">
        {() => (
          <AuthGate>
            <MainLayout>
              <CalendarSettings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/calendar-settings">
        {() => (
          <AuthGate>
            <MainLayout>
              <CalendarSettings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings">
        {() => (
          <AuthGate>
            <MainLayout>
              <Settings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/business-profile">
        {() => (
          <AuthGate>
            <MainLayout>
              <BusinessProfile />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/my-profile">
        {() => (
          <AuthGate>
            <MainLayout>
              <MyProfile />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/staff">
        {() => (
          <AuthGate>
            <MainLayout>
              <Staff />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/staff/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <StaffDetail />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/teams/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <TeamDetail />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/hr-settings">
        {() => (
          <AuthGate>
            <MainLayout>
              <HRSettings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/clients">
        {() => (
          <AuthGate>
            <MainLayout>
              <ClientsSettings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/roles-permissions">
        {() => (
          <AuthGate>
            <MainLayout>
              <RolesPermissions />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/permission-audit">
        {() => (
          <AuthGate>
            <MainLayout>
              <PermissionAudit />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/integrations">
        {() => (
          <AuthGate>
            <MainLayout>
              <Integrations />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/custom-fields">
        {() => (
          <AuthGate>
            <MainLayout>
              <CustomFields />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/custom-fields/:id/edit">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <EditFolder />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/calendar-settings">
        {() => (
          <AuthGate>
            <MainLayout>
              <CalendarSettings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/calendar/:id/edit">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <CalendarEdit />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/tags">
        {() => (
          <AuthGate>
            <MainLayout>
              <Tags />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/products">
        {() => (
          <AuthGate>
            <MainLayout>
              <Products />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/tasks">
        {() => (
          <AuthGate>
            <MainLayout>
              <TasksSettings />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/automation-triggers">
        {() => (
          <AuthGate>
            <MainLayout>
              <AutomationTriggers />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/audit-logs">
        {() => (
          <AuthGate>
            <MainLayout>
              <AuditLogs />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/form-builder">
        {() => (
          <AuthGate>
            <MainLayout>
              <FormBuilder />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/form-builder/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <FormBuilder formId={params.id} />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/forms-test">
        {() => (
          <AuthGate>
            <MainLayout>
              <FormsTest />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TimerProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </TimerProvider>
    </QueryClientProvider>
  );
}

export default App;
