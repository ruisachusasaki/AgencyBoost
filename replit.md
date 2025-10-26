# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive CRM system designed for marketing agencies to manage clients, projects, campaigns, leads, tasks, and invoices. Its primary purpose is to enhance operational efficiency and oversight through features like client asset approval workflows, robust automation, sales reporting, and a responsive user interface. The system aims to be a modern solution for agencies looking to streamline their operations.

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

### Technical Implementations
- **Authentication & Authorization**: Replit Auth OIDC, session management, role-based access control (Admin, Manager, User, Accounting), and granular permissions. Includes admin impersonation with audit logging.
- **Data Management**: Relational schema, CRUD, audit logs, sorting, pagination, CSV import/export, custom fields.
- **Task Management**: Hierarchical sub-tasks, dependencies, recurring tasks, bulk actions, and dynamic project progress.
- **Communication**: Smart Lists, Email/SMS with DND, document management, notes, calendar management with dynamic merge tags, and unified templating. Calendar views support filtering by selected calendars.
- **Automation System**: GoHighLevel-style, API-driven, database-backed workflow engine with 25+ trigger definitions across various categories (Contact, Form, HR, Client Lifecycle) and 7 action types. Features conditional evaluation, trigger emission system, execution logging, variable interpolation, and non-blocking execution.
- **Client Management**: Client team assignment, health scoring, and an asset approval workflow with annotation capabilities. Includes per-user customizable and saveable column views for client tables. Client detail page includes Billing Information section with inline-editable MRR (Monthly Recurring Revenue) and Client Vertical fields for categorization and revenue tracking.
- **HR Features**: Time off requests with pagination, job application form configuration, job application watchers, and expense report management with configurable fields and submission tracking.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering and optimized data aggregation.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes, applied to validations and indicators.
- **Lead Management**: Customizable lead source options managed through Settings > Leads page. Admins can add, edit, reorder, and toggle active/inactive status of lead sources. The lead creation/edit form dynamically loads active sources from the database. Default sources include Website, Referral, Social Media, Advertising, and Cold Outreach.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles to client's profile with duplicate prevention.
- **Predictive Hiring Alerts**: Staffing capacity prediction based on pipeline data and close rates, with configurable alerts, visual predictions, and manual notification triggers.
- **Team Workload Reports**: Comprehensive analytics with filtering, search, and pagination for detailed staff workload tables.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **File & Media**: Advanced uploads, inline media display, voice recording, secure object storage, and collaborative annotation for various file types with completion tracking and activity logging.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, and search.
- **User Preferences**: Per-user view customization system storing column visibility preferences in the database.
- **Dashboard Widgets**: Customizable dashboard with drag-and-drop widget management, including 35 widgets across Client Management, Sales & Revenue, Tasks, Lead Management, and HR & Team categories. Features per-user widget layouts, team assignment filtering, add/remove UI, resizing, optimistic UI updates, real-time data updates, category-based filtering with color-coded badges (blue=Client Management, green=Sales, purple=Tasks, yellow=Leads, orange=HR & Team), and search functionality.
  - **Client Management Widgets** (6): Client Health Overview, Recent Clients, Client Approval Queue, Client Distribution by Vertical, Client Portal Activity, Client Team Assignments
  - **Sales & Revenue Widgets** (7): Sales Pipeline Overview, Quote Status Summary, Revenue This Month, MRR Tracker, Win Rate, Top Performing Sales Reps, Recent Deals Won
  - **Tasks Widgets** (8): My Tasks, Overdue Tasks, Tasks Due This Week, Task Completion Rate, Tasks Requiring Client Approval, Tasks by Status, Time Tracked This Week, Team Workload
  - **Lead Management Widgets** (6): New Leads Today/Week, Leads by Pipeline Stage, My Assigned Leads, Stale Leads, Lead Conversion Rate, Lead Source Breakdown
  - **HR & Team Widgets** (8): Pending Time Off Requests, Who's Off Today/This Week, New Job Applications, Onboarding Queue, Pending Expense Reports, Team Capacity Alerts, Team Birthday/Anniversary Calendar, Training Completion Status - All HR & Team widgets enforce strict permission checks ensuring only users with HR module access (canView or canManage) can view sensitive HR data
- **Multi-Dashboard System**: Users can create multiple named dashboards for different purposes (similar to GoHighLevel). Features include tab-based navigation between dashboards, dashboard management dialog for creating/renaming/deleting dashboards with up/down arrow button reordering (default dashboard always locked in position 1), default dashboard settings, and automatic default dashboard initialization for new users. The system handles stale localStorage by validating stored dashboard IDs against the server and falling back to valid dashboards when needed.

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