# AgencyBoost CRM System

## Overview
AgencyBoost is a comprehensive CRM system designed for marketing agencies. Its primary purpose is to enhance operational efficiency and oversight through features like client asset approval workflows, robust automation, sales reporting, and a responsive user interface. It aims to streamline client, project, campaign, lead, task, and invoice management, providing a modern solution for agencies.

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
- Responsive sidebar navigation and mobile-first design using Radix UI, shadcn/ui, and Tailwind CSS for 3-column layouts.
- Enhanced visual design for pipeline views and an icon picker.
- Component-scoped CSS with design system variables.
- Responsive tab navigation with intelligent overflow menus for sections like HR, adapting to screen size breakpoints.
- Dark/Light Mode with localStorage persistence and system preference detection, using Tailwind's class-based dark mode with global CSS overrides.

### Technical Implementations
- **Authentication & Authorization**: Direct Google OAuth 2.0 authentication (migrated from Replit Auth OIDC) with multi-user support, automatic migration logic, session management, and role-based access control (Admin, Manager, User, Accounting).
    - **Granular Permission System**: Three-level permission enforcement: (1) Module-level page access using RequirePermission route wrappers, (2) Sub-tab/section visibility using useHasPermissions hook to filter tabs dynamically, (3) Action-level controls using PermissionGate component for delete/export buttons. Permission keys follow "module.permission_key" format (e.g., "clients.delete_clients", "reports.view_sales_reports"). Admin users automatically have all permissions. Permissions defined in shared/permission-templates.ts.
- **Data Management**: Relational schema, CRUD operations, audit logs, sorting, pagination, CSV import/export, and custom fields.
- **Google Calendar Integration**: Per-user OAuth 2.0 with Google Calendar API, featuring two-way sync, incremental sync, contact creation from attendees, availability blocking, workflow triggers, optimized storage, event caching, and sync preferences.
- **Business Timezone**: Account-level timezone setting with a lightweight API endpoint, React hook, and timezone-aware helper functions for consistent date calculations.
- **Task Management**: Hierarchical sub-tasks, scheduling, dependencies, recurring tasks, bulk actions, and dynamic project progress.
    - **Task Intake Form**: Section-based hierarchical intake form with conditional visibility. 23 sections covering Task Basics, Department Selection (Creative/DevOps/Data), and department-specific sub-sections. 111 questions with 180 answer options. 5 TRIGGER questions drive visibility logic: department, creative_type, devops_type, data_type, priority_level. Visibility conditions use JSON structure with single rules ({triggerQuestionId, requiredValues}) or complex rules ({rules: [...], logic: "AND"}).
- **Communication**: Smart Lists, Email/SMS, VoIP calling (Twilio-based browser calling for leads), document management, notes, calendar management with dynamic merge tags, and unified templating.
- **Automation System**: GoHighLevel-style, API-driven, database-backed workflow engine with 25+ trigger definitions and 13+ action types, featuring conditional evaluation and variable interpolation.
    - **Slack Workflow Integration**: Full Zapier-like Slack support with 6 action types (Send Message, Send DM, Add Reaction, Create Channel, Set Topic, Create Reminder) and 4 trigger types (Message Received, Reaction Added, Bot Mentioned, Channel Created). Uses Slack Events API webhook with signature verification.
- **Client Management**: Client team assignment (drag-and-drop), health scoring, asset approval workflow with annotation, customizable column views, billing information, and comprehensive bulk actions.
- **HR Features**: Time off requests (simplified global types with customizable settings), job application forms, watchers, expense reports, and a 1-on-1 meeting tracker.
    - **1-on-1 Meetings**: Includes meeting recording links, position-specific KPI tracking, two-tab navigation, URL-based routing, private notes, and null-safety. Integrates with the internal AgencyBoost calendar, and optionally Google Calendar for synced events.
    - **1v1 Performance Reports**: Aggregates KPI performance with tracking, filtering, search, sorting, and role-based access control.
    - **Organization Chart**: Interactive ReactFlow-based visualization with Dagre layout, department color-coding, search, and position-only structure builder.
    - **PX Meetings**: Team meeting feature for managers/admins with 5 customizable segments (What's Working/KPIs, Sales Opportunities, Areas of Opportunities, Action Plan, Action Items), multi-attendee support, recording links, and full CRUD operations. Accessible via "PX Meetings" tab in HR section.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes.
- **Quotes Management**: Modern table-based layout with sortable columns, inline status updates, action buttons, low margin highlighting, and pagination.
- **Lead Management**: Customizable lead source options.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles.
- **Predictive Hiring Alerts**: Staffing capacity prediction with configurable alerts.
- **Team Workload Reports**: Comprehensive analytics for staff workload.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **Time Entry Editing**: Admins and managers can edit time entries in the TimeSheet View when viewing "All Users". Clickable time cells show a pencil icon on hover, opening an edit modal to adjust durations. API endpoints enforce role-based access control.
- **File & Media**: Advanced uploads, inline media display, voice recording, secure object storage, and collaborative annotation.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, enhanced search, draft/published workflow with version history, auto-generated sticky Table of Contents, breadcrumb navigation, and related articles suggestions.
- **AI Assistant**: OpenAI-powered chat widget that indexes Knowledge Base content (SOPs/Playbooks) to provide quick answers to team questions. Features a floating chat interface in the bottom-right corner, keyword-based article search, conversation history, and source citations.
- **User Preferences**: Per-user view customization system storing column visibility and widths. Tasks Table View supports drag-to-resize columns with pixel-based width persistence.
- **Notification System**: Database-backed system with bell icon, @mention detection, settings panel, and My Mentions widget.
- **User Profile Settings**: Rich text editor (TipTap) for email signature with HTML formatting support.
- **Multi-Dashboard System**: Users can create multiple named dashboards with tab-based navigation and management dialogs.
- **Dashboard Widgets**: Customizable dashboard with drag-and-drop widget management, offering various categories of real-time data widgets.
- **Global Search**: Intelligent search across clients, leads, and tasks with debouncing, real-time results, type-specific icons, and direct navigation.

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