# AgencyBoost CRM System

## Overview
AgencyBoost is a comprehensive CRM system designed for marketing agencies to manage clients, projects, campaigns, leads, tasks, and invoices. Its primary purpose is to enhance operational efficiency and oversight through features like client asset approval workflows, robust automation, sales reporting, and a responsive user interface. The system aims to be a modern solution for agencies looking to streamline their operations.

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

### Google Calendar Integration (GoHighLevel-style)
- **Authentication**: Per-user OAuth 2.0 with Google Calendar API, each team member connects their own account
- **Two-Way Sync**: Bidirectional event synchronization between AgencyBoost and Google Calendar with conflict resolution
- **Incremental Sync**: Uses Google's syncToken API for 90% reduction in API calls, fetches only changes since last sync
- **Contact Creation**: Automatically creates leads from event attendees with email deduplication
- **Availability Blocking**: Real-time conflict detection prevents double-bookings across both systems
- **Workflow Triggers**: Calendar events trigger automation workflows (event.created, event.updated, event.deleted)
- **Optimized Storage**: Stores only essential event fields (~400 bytes vs 3KB per event), supports 3000+ users efficiently
- **Event Caching**: 7-day cache for fast availability checks, automatic cleanup of events >1 year old
- **Sync Preferences**: Per-connection toggles for two-way sync, contact creation, workflow triggers, and appointment blocking

### UI/UX Decisions
- Responsive sidebar navigation and mobile-first design using Radix UI, shadcn/ui, and Tailwind CSS for 3-column layouts.
- Enhanced visual design for pipeline views and an icon picker.
- Component-scoped CSS with design system variables.
- Responsive tab navigation with intelligent overflow menus for sections like HR, adapting to screen size breakpoints.
- **Dark/Light Mode**: Theme toggle in header (next to notifications) with localStorage persistence and system preference detection. Uses Tailwind's class-based dark mode with CSS variables defined in index.css.

### Technical Implementations
- **Authentication & Authorization**: Direct Google OAuth 2.0 authentication using google-auth-library (migrated from Replit Auth OIDC). Supports multi-user login where any user can authenticate with their own Google account. Automatic migration logic transitions existing Replit Auth users to Google Auth when email matches. Session management, role-based access control (Admin, Manager, User, Accounting), granular permissions system with templates and database schema. Note: OAuth flows work in incognito mode or production URL but may fail in Replit preview iframe due to third-party cookie restrictions.
- **Data Management**: Relational schema, CRUD, audit logs, sorting, pagination, CSV import/export, custom fields.
- **Task Management**: Hierarchical sub-tasks with scheduling, dependencies, recurring tasks, bulk actions, and dynamic project progress.
- **Communication**: Smart Lists, Email/SMS, document management, notes, calendar management with dynamic merge tags, and unified templating. Lead appointment merge tags support server-side interpolation.
- **Automation System**: GoHighLevel-style, API-driven, database-backed workflow engine with 25+ trigger definitions and 7 action types, featuring conditional evaluation and variable interpolation.
- **Client Management**: Client team assignment with drag-and-drop reordering in Settings, health scoring, asset approval workflow with annotation, customizable column views, and a Billing Information section. Includes comprehensive bulk actions (Delete, Assignee, Export, Add Tag, Remove Tag, Add to Workflow) with partial failure handling.
- **Google Calendar Integration**: User-based calendar sync where each team member connects their own Google account. Features two-way synchronization between AgencyBoost and Google Calendar, availability blocking to prevent double-bookings, automatic contact creation from calendar attendees, and workflow triggers for synced appointments. All authenticated users can manage their own calendar connections without requiring admin permissions.
- **HR Features**: Time off requests, job application form configuration, job application watchers, expense reports, and a 1-on-1 meeting tracker.
  - **Time Off Types System**: Simplified global time off types (Vacation, Sick, Personal Days, Service Days, etc.) that apply to ALL staff. Single flat list view replacing confusing nested policy hierarchy. Companies can customize their own time off types with configurable settings (default days per year, carry-over rules, colors). No policy validation on requests - all active types available to all users.
  - **1-on-1 Meetings**: Meeting recording link field for storing Fathom/Google Meet URLs. Position-specific KPIs automatically displayed based on staff member's role with status tracking (On-Track, Off-Track, Complete) per meeting using dropdown selectors. Two-tab navigation (My Direct Reports for managers, My 1v1 Meetings for all users) with custom styled buttons matching Calendar page Users/Calendars design (gray container, teal active state). URL-based routing supports direct access via `/hr/one-on-one` with browser history integration. Private notes and "Know Better" section (hire date, birthday, hobbies, family) excluded from direct reports' view for security. Comprehensive null-safety implementation with loading states, error handling, and safe computed variables ensures crash-free operation in both manager and employee views.
    - **Calendar Integration**: When scheduling 1-on-1 meetings with date/time, an internal AgencyBoost calendar appointment is ALWAYS created and appears on the Calendar page regardless of Google Calendar connection status. If the manager has Google Calendar connected with two-way sync enabled, the event also syncs to Google Calendar. Uses `server/oneOnOneMeetingService.ts` for calendar orchestration with proper America/New_York timezone handling via date-fns-tz, error recovery with cleanup of orphaned appointments, and non-fatal Google sync error handling. The `calendarAppointmentId` field links meetings to their calendar entries.
  - **1v1 Performance Reports**: Aggregated performance metrics with KPI tracking integration. Displays KPI progress (total, on-track, off-track, complete) with colored badges in main table and detailed 4-metric display in individual analysis view. Completion rates show Action Items and Goals only (talking points removed from display as they are discussion topics, not actionable items). Includes filtering, search, sorting, and role-based access control. Backend aggregates KPI data from `one_on_one_meeting_kpi_statuses` table.
  - **Organization Chart**: Interactive ReactFlow-based visualization with Dagre layout, department color-coding, search, and navigation controls. Includes a position-only structure builder with drag-and-drop functionality and position templates.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes.
- **Quotes Management**: Modern table-based layout matching Clients page design pattern with sortable columns (name, client, created date, total cost, margin %, status), inline status updates, action buttons with tooltips (View Quote for Eye icon, Edit Quote for Pencil icon), low margin highlighting, and pagination.
- **Lead Management**: Customizable lead source options managed via settings.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles.
- **Predictive Hiring Alerts**: Staffing capacity prediction with configurable alerts.
- **Team Workload Reports**: Comprehensive analytics for staff workload.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **File & Media**: Advanced uploads, inline media display, voice recording, secure object storage, and collaborative annotation.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, and enhanced search. Features include:
  - **Draft/Published Workflow**: Article status management (draft/published/archived) with color-coded badges and role-gated status changes. Full version history tracking with `knowledgeBaseArticleVersions` table and restore capability.
  - **Enhanced Search & Filtering**: Full-text search across title, excerpt, and content. Multi-filter panel with status, author, tag, and date range filters (any time/last 7 days/last 30 days/last year).
  - **Table of Contents**: Auto-generated sticky sidebar on desktop showing all headings (H1/H2/H3) extracted from Slate content with smooth scroll navigation.
  - **Breadcrumb Navigation**: Category hierarchy path displayed at top of article view (Resources > Category > Sub-category > Article).
  - **Related Articles**: Suggestions panel showing up to 5 articles from same category or with shared tags, displayed with excerpts below article content.
- **User Preferences**: Per-user view customization system storing column visibility.
- **Notification System**: Database-backed notification system with bell icon display, @mention detection in comments, notification settings panel, and My Mentions widget. Known limitation: duplicate staff names may cause incorrect notification routing (acceptable for CRM use case).
- **User Profile Settings**: Rich text editor (TipTap) for email signature in Settings > My Profile > Profile tab, with HTML formatting support and enable/disable toggle.
- **Multi-Dashboard System**: Users can create multiple named dashboards with tab-based navigation, management dialogs, and default settings.
- **Dashboard Widgets**: Customizable dashboard with drag-and-drop widget management, including widgets across various categories (Client Management, Sales & Revenue, Tasks, Lead Management, HR & Team, Calendar & Appointments, Activity & Alerts) with per-user layouts and real-time data.
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

## Future Enhancements
- **Customizable Theme Colors**: Allow agencies to customize their branding colors (primary theme color) from Settings > Business Profile. Would involve storing color preferences in database, loading at runtime, and updating CSS variables dynamically while ensuring accessibility/contrast requirements are met.