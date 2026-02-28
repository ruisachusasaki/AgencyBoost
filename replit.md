# AgencyBoost CRM System

## Overview
AgencyBoost is a comprehensive CRM system for marketing agencies, aiming to enhance operational efficiency and oversight. It streamlines client, project, campaign, lead, task, and invoice management through features like client asset approval workflows, robust automation, sales reporting, and a responsive user interface.

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
- Responsive sidebar navigation and mobile-first design using Radix UI, shadcn/ui, and Tailwind CSS.
- Dark/Light Mode with localStorage persistence and system preference detection.
- Component-scoped CSS with design system variables.

### Technical Implementations
- **Authentication & Authorization**: Direct Google OAuth 2.0 with multi-user support, session management, and role-based access control (Admin, Manager, User, Accounting). Features a comprehensive hierarchical permission system (module.tab.action format) with Admin bypass and backward compatibility for existing permissions.
- **Data Management**: Relational schema, CRUD, audit logs, sorting, pagination, CSV import/export, and custom fields.
- **Google Calendar Integration**: Per-user two-way sync with Google Calendar API, including incremental sync, contact creation, availability blocking, and workflow triggers.
- **Business Timezone**: Account-level timezone setting for consistent date calculations.
- **Task Management**: Hierarchical sub-tasks, scheduling, dependencies, recurring tasks, bulk actions. Features a section-based task intake form with conditional visibility, templated description generation, and automatic assignment rules based on form answers.
- **Communication**: Smart Lists, Email/SMS, Twilio-based VoIP calling, document management, notes, calendar management, and unified templating.
- **Automation System**: API-driven, database-backed workflow engine with triggers and action types, supporting conditional evaluation and variable interpolation. Includes full Zapier-like Slack integration for various actions and triggers.
- **Client Management**: Client team assignment, health scoring, asset approval workflow with annotation, customizable column views, billing information, and bulk actions.
- **HR Features**: Time off requests, job application forms, expense reports, 1-on-1 meeting tracker (on-demand recurring, integrates with internal/Google Calendar), 1v1 performance reports, and an interactive organization chart. Includes PX Meetings, a collaborative team meeting feature with customizable segments, recurring options, field-level auto-save, and presence tracking.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes.
- **Quotes Management**: Modern table-based layout with sortable columns, inline status updates, and low margin highlighting.
- **Lead Management**: Customizable lead source options.
- **Product Packages**: Packages system under Settings > Products that allows creating packages containing both bundles and individual products with configurable quantities. Packages can be assigned to clients and added to quotes. Tables: `product_packages`, `package_items`, `client_packages`. Quote items support `itemType: 'package'` with `packageId`.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles/packages.
- **Predictive Hiring Alerts**: Staffing capacity prediction with configurable alerts.
- **Team Workload Reports**: Comprehensive analytics for staff workload.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **Time Entry Editing**: Admins and managers can edit time entries in the TimeSheet View.
- **Long-Running Timer Alerts**: Background service notifies users and admins of timers exceeding a configurable threshold.
- **Weekly Hours System Alerts**: Built-in background service that automatically notifies managers and admins when team members log fewer than a configurable threshold (default 40 hours) per week. Runs on a configurable check day, with persistent duplicate prevention, calendar time inclusion option, and settings UI in Settings > Tasks.
- **File & Media**: Advanced uploads, inline media display, voice recording, secure object storage, and collaborative annotation.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, search, draft/published workflow, version history, auto-generated Table of Contents, and related articles suggestions.
- **AI Assistant**: OpenAI-powered chat widget indexing Knowledge Base content for quick answers, featuring conversation history and source citations.
- **User Preferences**: Per-user view customization for column visibility and widths, including drag-to-resize for task tables.
- **Notification System**: Database-backed system with bell icon, @mention detection, and settings panel.
- **User Profile Settings**: Rich text editor for email signatures.
- **Multi-Dashboard System**: Users can create multiple named dashboards with tab-based navigation.
- **Dashboard Widgets**: Customizable dashboards with drag-and-drop widget management and real-time data.
- **Global Search**: Intelligent search across clients, leads, and tasks with real-time results and direct navigation.
- **Ticketing System**: Admin-only bug report and feature request tracking with CRUD, comments, status lifecycle, priority levels, type classification, response time analytics, screenshot uploads, Loom video URL field, and automatic ticket routing rules.
- **Call Center Time Tracking**: Simplified clock-in/clock-out interface for call center staff. Users select a client and start/stop timers. Features weekly summary with date/client/hours breakdown, client switching mid-shift, auto-redirect for call-center-only users, and a dedicated "Call Center Cost" report under Reports showing labor cost by client using staff hourly rates. Managed through normal Settings > Staff with call_center permission module. Table: `call_center_time_entries`.

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

## Production Deployment Architecture
- **Target**: VM (always-running for background services)
- **Build**: Pre-built `dist/` folder committed to repo. Build command is `echo "pre-built"`. To rebuild: `vite build && esbuild server/prodEntry.ts server/appWorker.ts server/index.ts --platform=node --packages=external --bundle --splitting --format=esm --outdir=dist`
- **Entry Point**: `dist/prodEntry.js` — tiny HTTP server (2.4KB) that responds to health checks instantly in under 7ms
- **Key Design**: `prodEntry.ts` starts listening on the port immediately, then forks `appWorker.js` as a child process on port+1. The heavy Express app loads in the child process without blocking the main event loop. Once the child signals "ready", prodEntry proxies all requests to it.
- **Important**: `server/index.ts` auto-starts unless `PROD_ENTRY` env var is set (which `prodEntry.ts` sets before importing). This prevents duplicate server.listen() conflicts.
- **Important**: `dist/` is NOT in `.gitignore` — pre-built files are included in deployment to avoid build timeouts.