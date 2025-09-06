import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimerProvider } from "@/contexts/TimerContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientBriefDemo from "@/pages/client-brief-demo";
import Projects from "@/pages/projects";
import ProjectEdit from "@/pages/project-edit";

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
import Support from "@/pages/settings/support";
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
import CareersPage from "@/pages/careers";
import KnowledgeBase from "@/pages/knowledge-base";
import ArticleView from "@/pages/article-view";
import Training from "@/pages/training";
import CourseDetail from "@/pages/training/course-detail";
import CreateCourse from "@/pages/training/create-course";
import EditCourse from "@/pages/training/edit-course";
import LessonManagement from "@/pages/training/lesson-management";
import CreateLesson from "@/pages/training/create-lesson";
import EditLesson from "@/pages/training/edit-lesson";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientBriefDemo} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id/edit" component={ProjectEdit} />

      <Route path="/marketing" component={Campaigns} />
      <Route path="/leads" component={Leads} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/tasks/:taskId" component={TaskDetail} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/reports" component={Reports} />
      <Route path="/social-media" component={SocialMedia} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/workflows/build" component={WorkflowBuilder} />
      <Route path="/hr" component={HRPage} />
      <Route path="/hr/applicant/:id" component={ApplicantDetailPage} />
      <Route path="/training" component={Training} />
      <Route path="/training/courses/:id" component={CourseDetail} />
      <Route path="/training/courses/:id/edit" component={EditCourse} />
      <Route path="/training/courses/:id/lessons" component={LessonManagement} />
      <Route path="/training/courses/:id/lessons/create" component={CreateLesson} />
      <Route path="/training/courses/:courseId/lessons/:id/edit" component={EditLesson} />
      <Route path="/training/create" component={CreateCourse} />
      <Route path="/resources" component={KnowledgeBase} />
      <Route path="/resources/articles/:id" component={ArticleView} />
      <Route path="/calendar" component={CalendarMain} />
      <Route path="/calendar/settings" component={CalendarSettings} />
      <Route path="/calendar-settings" component={CalendarSettings} />
      <Route path="/settings/calendar-settings" component={CalendarSettings} />
      <Route path="/settings/calendar/:id/edit" component={CalendarEdit} />
      <Route path="/book/:customUrl" component={PublicBooking} />
      <Route path="/embed/:customUrl" component={BookingEmbed} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/business-profile" component={BusinessProfile} />
      <Route path="/settings/my-profile" component={MyProfile} />
      <Route path="/settings/staff" component={Staff} />
      <Route path="/settings/staff/:id" component={StaffDetail} />
      <Route path="/settings/teams/:id" component={TeamDetail} />
      <Route path="/settings/support" component={Support} />
      <Route path="/settings/hr-settings" component={HRSettings} />
      <Route path="/settings/roles-permissions" component={RolesPermissions} />
      <Route path="/settings/permission-audit" component={PermissionAudit} />
      <Route path="/settings/integrations" component={Integrations} />
      <Route path="/settings/custom-fields" component={CustomFields} />
      <Route path="/settings/custom-fields/:id/edit" component={EditFolder} />
      <Route path="/settings/tags" component={Tags} />
      <Route path="/settings/products" component={Products} />
      <Route path="/settings/tasks" component={TasksSettings} />
      <Route path="/settings/automation-triggers" component={AutomationTriggers} />
      <Route path="/settings/audit-logs" component={AuditLogs} />
      <Route path="/form-builder">
        {() => <FormBuilder />}
      </Route>
      <Route path="/form-builder/:id">
        {(params) => <FormBuilder formId={params.id} />}
      </Route>
      <Route path="/forms-test" component={FormsTest} />
      <Route path="/careers" component={CareersPage} />
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
          <MainLayout>
            <Router />
          </MainLayout>
        </TooltipProvider>
      </TimerProvider>
    </QueryClientProvider>
  );
}

export default App;
