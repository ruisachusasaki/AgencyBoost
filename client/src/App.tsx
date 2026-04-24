import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimerProvider } from "@/contexts/TimerContext";
import { MeetingTimerProvider } from "@/contexts/MeetingTimerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import LandingPage from "@/pages/landing";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfUsePage from "@/pages/terms-of-use";
import AuthGate from "@/components/AuthGate";
import Clients from "@/pages/clients";
import EnhancedClientDetail from "@/pages/enhanced-client-detail";

import Campaigns from "@/pages/campaigns";
import Sales from "@/pages/sales";
import RequirePermission from "@/components/RequirePermission";
import Leads from "@/pages/leads";
import LeadDetail from "@/pages/lead-detail";
import Tasks from "@/pages/tasks";
import TaskDetail from "@/pages/task-detail";
import TaskTemplatesPage from "@/pages/task-templates";
import Reports from "@/pages/reports";
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
import SalesSettings from "@/pages/settings/sales";
import AiAssistantSettings from "@/pages/settings/ai-assistant";
import LeadsSettings from "@/pages/settings/leads";
import TicketsSettings from "@/pages/settings/tickets";
import EmailLoggingSettings from "@/pages/settings/email-logging";
import MainLayout from "@/components/layout/main-layout";
import FormBuilder from "@/pages/form-builder";
import SurveyBuilder from "@/pages/survey-builder";
import FormsTest from "@/pages/forms-test";
import HRPage from "@/pages/hr";
import ApplicantDetailPage from "@/pages/applicant-detail";
import HRSettings from "@/pages/settings/hr-settings";
import TemplateBuilder from "@/components/onboarding/TemplateBuilder";
import ICAgreementEditor from "@/components/icagreement/ICAgreementEditor";
import ClientsSettings from "@/pages/settings/clients";
import CareersPage from "@/pages/careers";
import OnboardingPage from "@/pages/onboarding";
import ClientOnboarding from "@/pages/client-onboarding";
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
import ClientPortalLogin from "@/pages/client-portal/login";
import ClientPortalDashboard from "@/pages/client-portal/dashboard";
import ClientPortalAuthGuard from "@/components/ClientPortalAuthGuard";
import HelpSupport from "@/pages/help-support";
import NotificationsPage from "@/pages/notifications";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import PublicSurvey from "@/pages/public-survey";
import PublicTicketForm from "@/pages/public-ticket-form";
import PublicProposal from "@/pages/public-proposal";
import SignOfferPage from "@/pages/sign-offer";
import TicketsPage from "@/pages/tickets";
import TicketDetailPage from "@/pages/ticket-detail";
import CallCenter from "@/pages/call-center";
import CrmSolutionPage from "@/pages/solutions/crm";
import LeadsSolutionPage from "@/pages/solutions/leads";
import TasksSolutionPage from "@/pages/solutions/tasks";
import TicketsSolutionPage from "@/pages/solutions/tickets";
import HrSolutionPage from "@/pages/solutions/hr";
import ClientPortalSolutionPage from "@/pages/solutions/client-portal";
import ClientOnboardingSolutionPage from "@/pages/solutions/client-onboarding";
import InvoicingSolutionPage from "@/pages/solutions/invoicing";
import ProposalsSolutionPage from "@/pages/solutions/proposals";
import CampaignsSolutionPage from "@/pages/solutions/campaigns";
import SocialMediaSolutionPage from "@/pages/solutions/social-media";
import WorkflowsSolutionPage from "@/pages/solutions/workflows";
import CalendarSolutionPage from "@/pages/solutions/calendar";
import HiringSolutionPage from "@/pages/solutions/hiring";
import TrainingSolutionPage from "@/pages/solutions/training";
import KnowledgeBaseSolutionPage from "@/pages/solutions/knowledge-base";
import CallCenterSolutionPage from "@/pages/solutions/call-center";
import PricingPage from "@/pages/pricing";
import { AIAssistantWidget } from "@/components/ai-assistant-widget";
import { VoipProvider } from "@/hooks/use-voip";
import { ActiveCallPanel } from "@/components/voip";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    if (!location.includes('#')) {
      window.scrollTo(0, 0);
    }
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/" component={LandingPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfUsePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/client-portal/login" component={ClientPortalLogin} />
      <Route path="/client-portal/dashboard">
        {() => (
          <ClientPortalAuthGuard>
            <ClientPortalDashboard />
          </ClientPortalAuthGuard>
        )}
      </Route>
      <Route path="/client-portal">
        {() => (
          <ClientPortalAuthGuard>
            <ClientPortalDashboard />
          </ClientPortalAuthGuard>
        )}
      </Route>
      <Route path="/book/:customUrl" component={PublicBooking} />
      <Route path="/embed/:customUrl" component={BookingEmbed} />
      <Route path="/proposal/:token" component={PublicProposal} />
      <Route path="/sign-offer/:token" component={SignOfferPage} />
      <Route path="/careers" component={CareersPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/solutions/crm" component={CrmSolutionPage} />
      <Route path="/solutions/leads" component={LeadsSolutionPage} />
      <Route path="/solutions/tasks" component={TasksSolutionPage} />
      <Route path="/solutions/tickets" component={TicketsSolutionPage} />
      <Route path="/solutions/hr" component={HrSolutionPage} />
      <Route path="/solutions/client-portal" component={ClientPortalSolutionPage} />
      <Route path="/solutions/onboarding" component={ClientOnboardingSolutionPage} />
      <Route path="/solutions/invoicing" component={InvoicingSolutionPage} />
      <Route path="/solutions/proposals" component={ProposalsSolutionPage} />
      <Route path="/solutions/campaigns" component={CampaignsSolutionPage} />
      <Route path="/solutions/social-media" component={SocialMediaSolutionPage} />
      <Route path="/solutions/workflows" component={WorkflowsSolutionPage} />
      <Route path="/solutions/calendar" component={CalendarSolutionPage} />
      <Route path="/solutions/hiring" component={HiringSolutionPage} />
      <Route path="/solutions/training" component={TrainingSolutionPage} />
      <Route path="/solutions/knowledge-base" component={KnowledgeBaseSolutionPage} />
      <Route path="/solutions/call-center" component={CallCenterSolutionPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/client-onboarding/:token" component={ClientOnboarding} />
      <Route path="/s/:shortCode">
        {(params) => <PublicSurvey shortCode={params.shortCode} />}
      </Route>
      <Route path="/embed/survey/:shortCode">
        {(params) => <PublicSurvey shortCode={params.shortCode} embed={true} />}
      </Route>
      <Route path="/public/ticket-form/:shortCode" component={PublicTicketForm} />
      
      {/* Protected routes - authentication required */}
      <Route path="/dashboard">
        {() => (
          <AuthGate>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/notifications">
        {() => (
          <AuthGate>
            <MainLayout>
              <NotificationsPage />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/clients">
        {() => (
          <AuthGate>
            <RequirePermission module="clients">
              <MainLayout>
                <Clients />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/clients/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="clients">
              <MainLayout>
                <EnhancedClientDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/marketing">
        {() => (
          <AuthGate>
            <RequirePermission module="campaigns">
              <MainLayout>
                <Campaigns />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/sales">
        {() => (
          <AuthGate>
            <RequirePermission module="sales">
              <MainLayout>
                <Sales />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/leads">
        {() => (
          <AuthGate>
            <RequirePermission module="leads">
              <MainLayout>
                <Leads />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/leads/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="leads">
              <MainLayout>
                <LeadDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/tasks">
        {() => (
          <AuthGate>
            <RequirePermission module="tasks">
              <MainLayout>
                <Tasks />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/tasks/:taskId">
        {(params) => (
          <AuthGate>
            <RequirePermission module="tasks">
              <MainLayout>
                <TaskDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/task-templates">
        {() => (
          <AuthGate>
            <RequirePermission module="tasks" permission="tasks.templates.manage">
              <MainLayout>
                <TaskTemplatesPage />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/reports">
        {() => (
          <AuthGate>
            <RequirePermission module="reports">
              <MainLayout>
                <Reports />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/tickets/:id">
        {() => (
          <AuthGate>
            <RequirePermission module="tickets">
              <MainLayout>
                <TicketDetailPage />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/tickets">
        {() => (
          <AuthGate>
            <RequirePermission module="tickets">
              <MainLayout>
                <TicketsPage />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/call-center">
        {() => (
          <AuthGate>
            <RequirePermission module="call_center">
              <MainLayout>
                <CallCenter />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/workflows">
        {() => (
          <AuthGate>
            <RequirePermission module="workflows">
              <MainLayout>
                <Workflows />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/workflows/build">
        {() => (
          <AuthGate>
            <RequirePermission module="workflows" permission="workflows.list.edit">
              <MainLayout>
                <WorkflowBuilder />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/hr/applicant/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="hr" permission="hr.applications.view">
              <MainLayout>
                <ApplicantDetailPage />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/hr/px-meetings/:meetingId">
        {(params) => (
          <AuthGate>
            <RequirePermission module="hr">
              <MainLayout>
                <HRPage initialTab="px-meetings" meetingId={params.meetingId} />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/hr/:tab">
        {(params) => (
          <AuthGate>
            <RequirePermission module="hr">
              <MainLayout>
                <HRPage initialTab={params.tab} />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/hr">
        {() => (
          <AuthGate>
            <RequirePermission module="hr">
              <MainLayout>
                <HRPage />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training">
        {() => (
          <AuthGate>
            <RequirePermission module="training">
              <MainLayout>
                <Training />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/analytics">
        {() => (
          <AuthGate>
            <RequirePermission module="training" permission="training.analytics.view">
              <MainLayout>
                <TrainingAnalytics />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="training" permission="training.courses.view">
              <MainLayout>
                <CourseDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/lessons/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="training" permission="training.lessons.view">
              <MainLayout>
                <LessonDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id/edit">
        {(params) => (
          <AuthGate>
            <RequirePermission module="training" permission="training.courses.edit">
              <MainLayout>
                <EditCourse />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id/lessons">
        {(params) => (
          <AuthGate>
            <RequirePermission module="training" permission="training.lessons.edit">
              <MainLayout>
                <LessonManagement />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:id/lessons/create">
        {(params) => (
          <AuthGate>
            <RequirePermission module="training" permission="training.lessons.edit">
              <MainLayout>
                <CreateLesson />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/courses/:courseId/lessons/:id/edit">
        {(params) => (
          <AuthGate>
            <RequirePermission module="training" permission="training.lessons.edit">
              <MainLayout>
                <EditLesson />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/training/create">
        {() => (
          <AuthGate>
            <RequirePermission module="training" permission="training.courses.edit">
              <MainLayout>
                <CreateCourse />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/resources">
        {() => (
          <AuthGate>
            <RequirePermission module="knowledge_base">
              <MainLayout>
                <KnowledgeBase />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/resources/articles/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="knowledge_base" permission="knowledge_base.articles.view">
              <MainLayout>
                <ArticleView />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      {/* Additional route for /articles/:id - redirect to correct path */}
      <Route path="/articles/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="knowledge_base" permission="knowledge_base.articles.view">
              <MainLayout>
                <ArticleView />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/calendar">
        {() => (
          <AuthGate>
            <RequirePermission module="calendar">
              <MainLayout>
                <CalendarMain />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/calendar/settings">
        {() => (
          <AuthGate>
            <RequirePermission module="calendar" permission="calendar.all.manage">
              <MainLayout>
                <CalendarSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/calendar-settings">
        {() => (
          <AuthGate>
            <RequirePermission module="calendar" permission="calendar.all.manage">
              <MainLayout>
                <CalendarSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings">
        {() => (
          <AuthGate>
            <RequirePermission module="settings">
              <MainLayout>
                <Settings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/business-profile">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.business_profile.view">
              <MainLayout>
                <BusinessProfile />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/settings/email-logging">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.email_logging.view">
              <MainLayout>
                <EmailLoggingSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/help-support">
        {() => (
          <AuthGate>
            <MainLayout>
              <HelpSupport />
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
            <RequirePermission module="settings" permission="settings.staff.view">
              <MainLayout>
                <Staff />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/staff/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.staff.view">
              <MainLayout>
                <StaffDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/teams/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.staff.view">
              <MainLayout>
                <TeamDetail />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/hr-settings">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.px_settings.view">
              <MainLayout>
                <HRSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/settings/hr/onboarding-templates/:id">
        {(params) => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.px_settings.view">
              <MainLayout>
                <TemplateBuilder templateId={parseInt(params.id)} />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/hr/ic-agreement/new">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.px_settings.view">
              <MainLayout>
                <ICAgreementEditor />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/settings/hr/ic-agreement/:id">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.px_settings.view">
              <MainLayout>
                <ICAgreementEditor />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/settings/clients">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.clients.view">
              <MainLayout>
                <ClientsSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/sales">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.sales.view">
              <MainLayout>
                <SalesSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/leads">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.leads.view">
              <MainLayout>
                <LeadsSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/roles-permissions">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.roles_permissions.view">
              <MainLayout>
                <RolesPermissions />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/permission-audit">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.permission_audit.view">
              <MainLayout>
                <PermissionAudit />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/integrations">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.integrations.view">
              <MainLayout>
                <Integrations />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/ai-assistant">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.ai_assistant.view">
              <MainLayout>
                <AiAssistantSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/custom-fields">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.custom_fields.view">
              <MainLayout>
                <CustomFields />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/custom-fields/:id/edit">
        {(params) => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.custom_fields.manage">
              <MainLayout>
                <EditFolder />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/calendar-settings">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.calendar.view">
              <MainLayout>
                <CalendarSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/calendar/:id/edit">
        {(params) => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.calendar.manage">
              <MainLayout>
                <CalendarEdit />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/tags">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.tags.view">
              <MainLayout>
                <Tags />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/products">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.products.view">
              <MainLayout>
                <Products />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/tasks">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.tasks.view">
              <MainLayout>
                <TasksSettings />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/automation-triggers">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.workflows.view">
              <MainLayout>
                <AutomationTriggers />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/settings/audit-logs">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.audit_logs.view">
              <MainLayout>
                <AuditLogs />
              </MainLayout>
            </RequirePermission>
          </AuthGate>
        )}
      </Route>

      <Route path="/settings/tickets">
        {() => (
          <AuthGate>
            <RequirePermission module="settings" permission="settings.tickets.view">
              <MainLayout>
                <TicketsSettings />
              </MainLayout>
            </RequirePermission>
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
      
      <Route path="/survey-builder/new">
        {() => (
          <AuthGate>
            <MainLayout>
              <SurveyBuilder surveyId="new" />
            </MainLayout>
          </AuthGate>
        )}
      </Route>
      
      <Route path="/survey-builder/:id">
        {(params) => (
          <AuthGate>
            <MainLayout>
              <SurveyBuilder surveyId={params.id} />
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
    </>
  );
}

function useUnstickBodyPointerEvents() {
  useEffect(() => {
    // Workaround for a known Radix UI bug where closing a Dialog/AlertDialog
    // (especially when combined with a toast firing or rapid state changes
    // after a mutation) leaves `pointer-events: none` on <body>, blocking
    // every click on the page until the user refreshes.
    // See: https://github.com/radix-ui/primitives/issues/2122
    const clearIfStuck = () => {
      if (document.body.style.pointerEvents === "none") {
        const stillOpen = document.querySelector(
          '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]'
        );
        if (!stillOpen) {
          document.body.style.pointerEvents = "";
        }
      }
    };

    const observer = new MutationObserver(clearIfStuck);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Safety net in case the mutation observer misses an edge case.
    const interval = window.setInterval(clearIfStuck, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}

function App() {
  useUnstickBodyPointerEvents();
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TimerProvider>
          <MeetingTimerProvider>
            <TooltipProvider>
              <VoipProvider>
              <Toaster />
                <ActiveCallPanel />
              <Router />
            </VoipProvider>
            </TooltipProvider>
          </MeetingTimerProvider>
        </TimerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
