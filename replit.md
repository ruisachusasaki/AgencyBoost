# AgencyBoost CRM System

## Overview
AgencyBoost is a comprehensive CRM system designed for marketing agencies. Its primary purpose is to enhance operational efficiency and oversight across various agency functions. Key capabilities include streamlined management of clients, projects, campaigns, leads, tasks, and invoices. The system incorporates features such as client asset approval workflows, robust automation, detailed sales reporting, and a responsive user interface to support agency growth and productivity.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.
UX Organization: Project Templates integrated as tabs under Projects section rather than separate navigation.
Checkbox Design: Bulk action checkboxes should be square, task completion checkboxes should be circular.
Filter Preferences: Simplified filtering with only essential filters (search and department, not position) for time off reports.
Settings Organization: Removed Settings > Support section (old ticketing system feature no longer needed).
Color Scheme Consistency: ALWAYS maintain the primary teal theme color (`hsl(179, 100%, 39%)` / `#00C9C6`) throughout ALL features. Replace any blue buttons, accents, or styling with the primary theme color to ensure visual consistency across the entire application.
Super Admin: Joe Hupp is the super admin with full access to all features including all staff compensation data. In dev environment: joe@themediaoptimizers.com. In production/live environment: joe@boostmode.com.
Salary/Compensation: All admins can view and edit salary data for any staff member (no hierarchy restriction). Salary data is hidden from non-admin users across all API endpoints.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API.
- **Database**: PostgreSQL with Drizzle ORM.

### UI/UX Decisions
- Responsive design leveraging Radix UI, shadcn/ui, and Tailwind CSS.
- Dark/Light Mode with localStorage persistence and system preference detection.
- Component-scoped CSS using design system variables.

### Technical Implementations
- **Authentication & Authorization**: Direct Google OAuth 2.0, multi-user support, session management, and role-based access control (Admin, Manager, User, Accounting) with a hierarchical permission system.
- **Data Management**: Relational schema, standard CRUD operations, audit logs, sorting, pagination, CSV import/export, and custom fields.
- **Google Calendar Integration**: Per-user two-way sync with Google Calendar API, including availability blocking and workflow triggers.
- **Business Timezone**: Account-level timezone setting.
- **Task Management**: Hierarchical sub-tasks, scheduling, dependencies, recurring tasks, bulk actions. Features a section-based task intake form, templated description generation, and automatic assignment. Product-to-task mapping supports automated task generation on lead conversion, with a robust task generation engine handling variable interpolation (including custom field merge tags), quantity modes, and idempotency. Merge tags in task mapping templates are searchable and include both native fields (8) and all custom fields from Settings > Custom Fields.
- **Communication**: Smart Lists, Email/SMS, Twilio-based VoIP calling, document management, notes, calendar, and unified templating.
- **Automation System**: API-driven, database-backed workflow engine supporting triggers, actions, conditional evaluation, and variable interpolation, including Zapier-like Slack integration.
- **Client Management**: Team assignment, health scoring, asset approval workflows with annotation, customizable views, billing, and bulk actions.
- **HR Features**: Time off requests, job application forms, expense reports, 1-on-1 meeting tracker, performance reports, and an interactive organization chart. Includes PX Meetings for collaborative team meetings.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering.
- **Onboarding Contracting & Payment (Quotes as Proposals)**: Quotes function as proposals. Upon "sent" status, a public link is generated and emailed to clients for review, digital signing, and payment (Stripe via CardElement or ACH). A Stripe webhook handles payment confirmation, triggering lead-to-client conversion, deal creation, product transfer, and onboarding task generation. Proposal branding is customizable.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes.
- **Quotes Management**: Table-based layout with sortable columns, inline status updates, and low margin highlighting.
- **Lead Management**: Customizable lead source options.
- **Product Packages**: Allows creating packages of bundles and individual products with configurable quantities, including build fees, monthly retail prices, and profit margin calculations.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles/packages to the client.
- **Predictive Hiring Alerts**: Staffing capacity prediction with configurable alerts.
- **Team Workload Reports**: Analytics for staff workload.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **Time Entry Editing**: Admins and managers can edit time entries.
- **Long-Running Timer Alerts**: Background service for timers exceeding a threshold.
- **Weekly Hours System Alerts**: Background service notifies managers/admins if team members log fewer than a configurable threshold of hours weekly.
- **File & Media**: Advanced uploads, inline display, voice recording, secure object storage, and collaborative annotation.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, search, draft/published workflow, version history, and auto-generated Table of Contents.
- **AI Assistant**: OpenAI-powered chat widget indexing Knowledge Base content for quick answers with conversation history and source citations.
- **User Preferences**: Per-user view customization for column visibility and widths.
- **Notification System**: Database-backed system with bell icon and @mention detection.
- **User Profile Settings**: Rich text editor for email signatures.
- **Multi-Dashboard System**: Users can create multiple named dashboards with tab-based navigation.
- **Dashboard Widgets**: Customizable dashboards with drag-and-drop widget management and real-time data.
- **Global Search**: Intelligent search across clients, leads, and tasks.
- **Ticketing System**: Admin-only bug report and feature request tracking with CRUD, comments, status lifecycle, priority levels, type classification, response time analytics, screenshot uploads, Loom video field, automatic routing rules (with source-based matching), source tracking (`source` column — "AgencyBoost" for internal, form name for external), embeddable ticket intake forms (via Custom Forms system with field builder at Settings > Tickets > Forms tab), public ticket form page (`/public/ticket-form/:shortCode`), and Kanban view with drag-and-drop status updates.
- **Call Center Time Tracking**: Simplified clock-in/clock-out interface for call center staff, with client selection, weekly summaries, client switching, and a dedicated "Call Center Cost" report.

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