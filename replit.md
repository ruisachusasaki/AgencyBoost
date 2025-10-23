# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system for marketing agencies. It manages clients, projects, campaigns, leads, tasks, and invoices, with integrated reporting and a responsive interface. The system aims to enhance efficiency and operational oversight, providing a modern solution for agencies with features like client asset approval workflows, sales reporting, and robust automation capabilities.

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
- Responsive sidebar navigation and mobile-first design utilizing Radix UI primitives, shadcn/ui components, and Tailwind CSS for optimized 3-column layouts.
- Enhanced visual design for elements like pipeline views and a professional icon picker.
- Component-scoped CSS with design system variables to prevent styling issues.
- Responsive tab navigation with intelligent overflow menus: HR section tabs automatically adapt to screen size, showing visible tabs inline and placing overflow tabs in a "..." dropdown menu. Breakpoints: XL (≥1400px) shows all tabs (up to 20), Large (≥1200px) shows 6, Medium (≥900px) shows 4, Small (≥600px) shows 3, and Extra Small (<600px) shows 2 tabs.

### Technical Implementations
- **Authentication & Authorization**: Production-ready Replit Auth OIDC with session management, role-based access control (Admin, Manager, User, Accounting), and granular permissions. Includes automatic user provisioning and first-user admin bootstrapping.
- **Admin Impersonation ("Login As")**: Secure admin-only feature allowing administrators to impersonate other users for debugging and support purposes. Accessible via user menu dropdown (top right avatar), includes searchable user selection dialog, real-time impersonation banner with exit functionality, and comprehensive audit logging for all impersonation sessions (start/stop events). Session management tracks original admin ID and impersonated user ID with secure role verification on all impersonation endpoints.
- **Data Management**: Relational schema for core entities, CRUD operations, audit logs, table sorting, pagination, CSV import/export, and custom field management.
- **Task Management**: Hierarchical sub-tasks, task dependencies, recurring tasks, bulk actions, and dynamic project progress display.
- **Communication**: Smart Lists, Email/SMS with DND system, document management, notes, calendar management, and unified templating systems. Supports dynamic merge tags for client hub calendar appointments. Calendar views (month, week, day) support filtering by selected calendars - when no calendars are selected, all appointments are shown; when one or more calendars are selected, only appointments from those calendars are displayed.
- **Lead Management**: Rebuilt leads page with staff assignment and enhanced lead card interactions.
- **Automation System**: **PRODUCTION-READY** GoHighLevel-style, API-driven, database-backed automation with complete workflow execution engine. Features include: **25+ trigger definitions** across 8 categories (Contact Management, Form Management, HR Management, Client Lifecycle), **workflow execution engine** (`server/workflow-engine.ts`) that processes actions sequentially with state tracking and error recovery, **7 action types** (create_task, update_contact, send_email, send_notification, wait, add_tag, assign_staff), **condition evaluation** with support for array-to-array and array-to-scalar comparisons, **trigger emission system** with `emitTrigger()` helper integrated throughout application routes, **execution logging** stored in `workflowExecutions` table with detailed step-by-step tracking, **variable interpolation** using `{{trigger.field}}` syntax in action configs, and **non-blocking execution** with try-catch error handling to prevent automation failures from disrupting main application flow. Client Lifecycle trigger emissions include: client_updated (fires on PUT /api/clients/:id with changed fields tracking), client_status_toggle (fires on archive/restore), client_health_score_changed (fires when health indicator changes color), client_product_added (fires when products/bundles added to client), client_team_changed (fires on team assignment changes), and client_brief_updated (fires on brief section updates). System supports conditional workflow execution based on trigger config matching (e.g., only run workflow if changedFields includes "email"). All workflows tracked with totalRuns, successfulRuns, failedRuns metrics.
- **Client Management**: Client team assignment, health scoring, and a comprehensive client approval workflow for assets with annotation capabilities. Includes per-user customizable and saveable column views for the "All Clients" table with automatic persistence.
- **HR Features**: Time off requests with comprehensive pagination (Time Off tab, Who's Off calendar, and Approvals board), job application form configuration, and a job application watchers/followers system. Pagination includes page size controls (10/20/50/100), page navigation with up to 5 visible page buttons, and automatic page clamping when data changes to prevent empty-table states. Approvals board includes sortable columns (Employee, Type, Dates, Duration, Submitted) matching the Applications section pattern with visual indicators for active sort direction. Onboarding Submissions section includes both column sorting (Name, Start Date, Phone, Emergency Contact, Payment Platform, Submitted, Status) and pagination matching existing HR patterns. Expense Report Form with configurable fields in Settings > HR Settings (12 default fields: Full Name, Supervisor, Purpose, Expense Type, Date, Total, Department/Team, Client, Reimbursement, Payment Method, Notes, Receipt). Configuration supports custom options for select fields with spaces preserved in option names (e.g., "Account Management"). Form prioritizes configured options from Settings, falling back to database values when unconfigured. Submission form accessible to all users in HR > Expense Report tab. Expense Submissions view (Admin/Accounting only) in HR > Expense Submissions tab with sortable columns (proper numeric sorting for Amount), pagination, status management (approve/reject/pending), and detailed view dialog with action buttons. Configuration changes require Admin, settings.canManage, or hr.canManage permissions.
- **Sales Reports**: Comprehensive analytics system including Pipeline and Sales Rep Reports with date range filtering and performance-optimized data aggregation.
- **Sales Settings**: Dynamic minimum margin threshold system allowing admins to configure the minimum acceptable margin percentage for quotes (default 35%). Settings are managed in Settings > Sales > General Settings and automatically apply to all quote validations, margin indicators, and low-margin filters throughout the Sales module. Supports validation range of 0-100% with proper handling of edge values.
- **Quote to Client Products Transfer**: Automatic transfer of quote products/bundles to client's Products Tab when quote status changes to "accepted" with existing clientId. Includes duplicate prevention and audit logging.
- **Predictive Hiring Alerts**: Intelligent staffing capacity prediction system that analyzes pipeline data and historical close rates to forecast when teams will need additional staff. Features include: configurable capacity settings per department/role in Settings > Staff > Capacity Settings (max clients per staff, alert thresholds, custom notification recipients, customizable alert messages), automated calculation of historical metrics (close rate, average pipeline time), visual hiring predictions in Reports > Team Workload showing current vs. projected capacity with color-coded indicators (green/yellow/red), and manual notification trigger to alert managers when teams approach capacity thresholds. Predictions use formula: `predicted_clients = leads_in_pipeline × historical_close_rate`, with capacity alerts when `(current + predicted) / max_capacity >= alert_threshold`. Supports per-setting customization: select specific staff members to notify (defaults to all managers/admins if none selected) and create custom alert messages with dynamic placeholders ({department}, {role}, {capacity_percentage}, {current_clients}, {predicted_clients}, {max_capacity}).
- **Team Workload Reports**: Comprehensive team workload analytics in Reports > Team Workload with filtering and pagination for the Detailed Staff Workload table. Features include: search by staff name, filter by department, filter by role, pagination matching system-wide patterns (10/20/50/100 page sizes, smart page navigation with up to 5 visible page buttons), automatic page adjustment when filters change, and empty state handling for no matches. All filter changes reset to page 1 for better UX. Settings > Staff > Staff Members table also includes full pagination with the same pattern.
- **Activity & Comments**: Global timer system, comprehensive activity logging, and a threaded comments system with @mentions and emoji picker.
- **File & Media**: Advanced file uploads with support for images, videos, audio, and documents. Inline media display (images, videos, audio players), voice recording, secure object storage, and collaborative annotation for images, PDFs, and videos with completion tracking. Annotations can be marked as completed (non-destructive workflow) with visual indicators: green pins with checkmarks for completed, red pins with numbers for active. Activity logging for annotation lifecycle (created, updated, completed, reopened, deleted).
- **Knowledge Base**: Notion-like documentation platform with categories, hierarchy, RBAC, and search.
- **User Preferences**: Per-user view customization system storing column visibility preferences in database with automatic save (500ms debounce) and load on page mount. Supports view-specific configurations across different tables and pages.
- **Dashboard Widgets**: Customizable dashboard system with drag-and-drop widget management. Features include: **widget catalog** with 6 CLIENT MANAGEMENT WIDGETS (Client Health Overview, Recent Clients, Client Approval Queue, Client Distribution by Vertical, Client Portal Activity, Client Team Assignments), **per-user widget layouts** stored in database with position/size preferences, **team assignment filtering** ensuring users only see data for clients they're assigned to via Client Hub Team Assignments, **add/remove widget UI** with searchable dialog for browsing available widgets (filters by name, description, category), **drag-and-drop repositioning** using react-grid-layout with visual grip handles on all widgets (12-column responsive grid, 60px row height, saves positions only on drag stop), **resize functionality** allowing users to resize widgets via corner/edge handles (saves sizes only on resize stop), **optimistic UI updates** with proper snapshot-and-rollback error handling to maintain UI/backend consistency during failures, and **real-time data updates** using TanStack Query for efficient caching and invalidation. Database schema includes `dashboardWidgets` table for widget definitions (type, name, description, category, icon, default sizes) and `userDashboardWidgets` table for user-specific instances (x, y, width, height, order, custom settings). Backend API provides CRUD operations with proper authentication and team-scoped data fetching. Widget data queries follow pattern: `/api/dashboard-widgets/{type}/data` with automatic filtering based on `clientTeamAssignments` table. Dashboard supports future expansion with additional widget categories (Sales, Tasks, HR, etc.) through consistent architecture.

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