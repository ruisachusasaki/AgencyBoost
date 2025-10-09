# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system for marketing agencies. It manages clients, projects, campaigns, leads, tasks, and invoices, with integrated reporting and a responsive interface. The system aims to enhance efficiency and operational oversight, providing a modern solution for agencies.

## Recent Changes
- **Migrated Workflow Templates to Database Storage** - Successfully migrated workflow templates from in-memory storage to PostgreSQL database for persistent storage across server restarts. Updated DbStorage class methods (getWorkflowTemplates, createWorkflowTemplate, updateWorkflowTemplate, deleteWorkflowTemplate) to use Drizzle ORM database operations with proper error handling, timestamp management, and UUID generation. Templates now reliably persist in the `workflow_templates` table.
- **Implemented Workflow "Save As Template" Feature** - Added ability to save existing workflows as reusable templates for users with workflows.canCreate permission. Features include: "Save As Template" button positioned left of ACTIVATE button in workflow detail modal, proper RBAC integration using requirePermission('workflows', 'canCreate'), GET /api/workflow-templates endpoint for fetching templates, POST /api/workflows/:id/save-as-template endpoint for creating templates from workflows, audit logging for template creation, and saved templates appearing in Workflows > Templates tab. Implementation uses permission-based access control without role-based shortcuts, ensuring consistent security between frontend visibility and backend enforcement.
- **Cleaned Up Workflows Analytics Tab** - Removed "Available Triggers" and "Available Actions" sections from main Workflows > Analytics tab, keeping only key performance metrics (Active Workflows, Total Executions, Success Rate, Automated Tasks). Detailed email/SMS analytics remain in individual workflow detail modals.
- **Implemented Workflow Action Analytics** - Added comprehensive email and SMS performance tracking for workflow actions. Features dedicated `workflow_action_analytics` table with optimized indexes (workflow_id and composite workflow_id/action_type), API endpoint for fetching analytics, and enhanced Analytics tab in WorkflowDetail modal displaying Email Analytics (Total Sent, Delivered %, Open %, Clicked, Replied %, Bounced %, Unsubscribed %, Accepted %, Rejected %, Complained %) and SMS Analytics (Total Sent, Delivered %, Clicked %, Failed %, Opted Out %) with color-coded metrics and percentage-based calculations.
- **Implemented Job Application Watchers/Followers System** - Added ability to assign team members as watchers to job applications, granting visibility even if they're not the hiring manager. Features include: dedicated `job_application_watchers` table, updated backend filtering to include watched applications, watcher management UI in applicant detail page with avatar display, and API endpoints (GET/POST/DELETE) for managing watchers. Watchers appear in a dedicated card in the applicant sidebar with easy add/remove functionality.
- **Enhanced Workflow Creation with Inline Status Selection** - Added comprehensive status selection UI directly in the "Add Workflow" form, eliminating the need for a separate "Configure Status Flow" step after creation. Features two-column layout with "Available Statuses" and "Workflow Progression" sections, drag-and-drop-style reordering with up/down chevrons, visual status indicators with color dots, and automatic persistence of selected statuses when creating workflows. Status selection only appears during creation; editing existing workflows continues to use the dedicated "Configure Status Flow" dialog.
- **Implemented comprehensive Sales Reports system** - Built two production-ready report types: Pipeline Report (lead distribution by stage with conversion rates between stages) and Sales Rep Report (performance metrics including appointments, pitches, closed deals, close rates, and average MRR). Features dedicated reporting tables (lead_stage_transitions, sales_activities, deals) with optimized composite indexes for performant date-filtered queries. Includes date range filtering, team summary metrics, and detailed breakdowns with visual stage indicators.
- **Implemented full Replit Auth OIDC authentication system** - Replaced development mode authentication bypass with production-ready Replit Auth integration. Features include: OIDC-based login flow, automatic user provisioning from Replit Auth claims, first-user admin bootstrap, session management with PostgreSQL, and secure logout with session clearing. Added `replitAuthSub` field to staff table to link Replit Auth users with CRM staff records.
- **Implemented comprehensive Client Approval Workflow system** - Enables compliance review of client assets (video/image ads) before publication with task attachments shown in Client Portal and client approval/annotation capabilities
- Successfully implemented profile photo upload functionality and header profile image display with clickable navigation
- Added emergency contact fields (name, phone, relationship) to database schema and Personal tab form
- Resolved critical emergency contact save functionality issue by implementing two-step database update approach
- Fixed persistent database query bug that was preventing staff profile updates
- Emergency contact form now successfully saves all contact information (name, phone, relationship)
- Completed comprehensive color system update from old teal (#46a1a0) to new vibrant teal (#00C9C6) throughout entire application
- Fixed email scheduling functionality with dedicated modal system following SMS pattern
- Updated CSS custom properties and fixed hardcoded color values in all major components including Workflows, Clients Smart Lists, Marketing page, and Social Media page

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.
UX Organization: Project Templates integrated as tabs under Projects section rather than separate navigation.
Checkbox Design: Bulk action checkboxes should be square, task completion checkboxes should be circular.
Filter Preferences: Simplified filtering with only essential filters (search and department, not position) for time off reports.
Settings Organization: Removed Settings > Support section (old ticketing system feature no longer needed).
Color Scheme Consistency: ALWAYS maintain the primary teal theme color (`hsl(179, 100%, 39%)` / `#00C9C6`) throughout ALL features. Replace any blue buttons, accents, or styling with the primary theme color to ensure visual consistency across the entire application.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API.
- **Database**: PostgreSQL with Drizzle ORM.

### UI/UX Decisions
- Responsive sidebar navigation and mobile-first design.
- Optimized 3-column layouts using Radix UI primitives, shadcn/ui components, and Tailwind CSS.
- Enhanced visual design for elements like pipeline views and professional icon picker.
- Component-scoped CSS with design system variables to prevent styling issues.

### Technical Implementations
- **Data Models**: Relational schema for core entities (Clients, Projects, Campaigns, Leads, Tasks, Invoices).
- **Authentication & Authorization**: Production-ready Replit Auth OIDC authentication with session-based state management and role-based access control (Admin, Manager, User, Accounting) with granular permissions. Replit Auth handles secure login/logout flows via OpenID Connect (`server/replitAuth.ts`). User provisioning automatically creates staff records from Replit Auth claims (sub, email, name, profile image) with first-user admin bootstrap. Centralized middleware (`server/auth.ts`) handles permission checks (e.g., `requireAuth()`, `requirePermission()`, `requireAdmin()`). Session data stored in PostgreSQL via `connect-pg-simple` with automatic token refresh.
- **Data Management**: CRUD operations, audit logs, table sorting, pagination, CSV import/export.
- **Customization**: Custom Field Management with drag-and-drop reordering, and Marketing Template Management with WYSIWYG editor.
- **Task Management**: Dynamic project progress, hierarchical sub-task system (up to 5 levels), task dependencies (Finish to Start, Start to Start, Finish to Finish, Start to Finish), ClickUp-style recurring tasks, comprehensive bulk actions, and task status visibility controls.
- **Communication**: Smart Lists, enhanced Client Product Display, comprehensive Email and SMS communication with DND system, Document Management, Notes System, and Calendar Management. Unified Email and SMS template systems.
- **Lead Management**: Rebuilt leads page with staff assignment and enhanced lead card interactions.
- **Appointment Booking**: Integrated appointment booking for leads and clients.
- **Global Timer System**: ClickUp-style timer with cross-navigation persistence.
- **Activity Logging**: Comprehensive task activity tracking with timeline display.
- **Comments System**: Threaded comments with @mention notifications and emoji picker.
- **File & Media**: Advanced file upload, inline image display, browser-based voice recording, secure object storage, and HTML5 audio players.
- **Image Annotation**: Collaborative feedback system for images and PDFs with real-time annotation.
- **HR Features**: Time Off Request form with controlled date picker, optimized HR filter layout, Job Application Form Configuration System with a public careers page, and Job Application Watchers/Followers system allowing team members to be assigned visibility to specific applications beyond the hiring manager.
- **Knowledge Base**: Notion-like documentation platform with categories, hierarchy, social features, RBAC, and search.
- **Automation System**: GoHighLevel-style API-driven, database-backed automation with dynamic triggers (e.g., Task Overdue Timing Controls, Dynamic Lead Pipeline Integration, Field Change Trigger System, Note Added Trigger System, Inbound Webhook Trigger System).
- **Client Management**: Client Team Assignment and Client Health Scoring System with proactive monitoring, visual highlighting, and automated team notifications.
- **Client Approval Workflow**: Comprehensive system for compliance review of client assets before publication. Features client portal task attachment display, approval/annotation capabilities, secure client-portal authentication, ownership verification, and integration with existing ImageAnnotationModal for collaborative feedback on images and PDFs.
- **Sales Reports**: Comprehensive analytics system with Pipeline Report (lead distribution by stage, conversion rates between stages) and Sales Rep Report (appointments, pitches, closed deals, close rates, average MRR per rep). Date range filtering, dedicated reporting tables with composite indexes for performance, real-time data aggregation, and visual metrics display.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle Kit**: Database migration and schema management.

### UI and Styling
- **Radix UI**: Accessible headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **shadcn/ui**: Reusable UI components.

### Development Tools
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.
- **TanStack Query**: Server state management.

### Form and Validation
- **React Hook Form**: Performant form library.
- **Zod**: TypeScript-first schema validation.
- **Hookform Resolvers**: Integration between React Hook Form and Zod.

### Date and Utility Libraries
- **Date-fns**: Date utility library.
- **Class Variance Authority**: Utility for component variants.
- **clsx**: Conditional className utility.

### Session Management
- **Connect PG Simple**: PostgreSQL session store for Express.
- **Express Session**: Session middleware.