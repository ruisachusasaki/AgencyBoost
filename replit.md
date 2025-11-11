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
- **Authentication & Authorization**: Replit Auth OIDC, session management, role-based access control (Admin, Manager, User, Accounting), granular permissions system with templates and database schema.
- **Data Management**: Relational schema, CRUD, audit logs, sorting, pagination, CSV import/export, custom fields.
- **Task Management**: Hierarchical sub-tasks with scheduling, dependencies, recurring tasks, bulk actions, and dynamic project progress.
- **Communication**: Smart Lists, Email/SMS, document management, notes, calendar management with dynamic merge tags, and unified templating. Lead appointment merge tags support server-side interpolation.
- **Automation System**: GoHighLevel-style, API-driven, database-backed workflow engine with 25+ trigger definitions and 7 action types, featuring conditional evaluation and variable interpolation.
- **Client Management**: Client team assignment with drag-and-drop reordering in Settings, health scoring, asset approval workflow with annotation, customizable column views, and a Billing Information section. Includes comprehensive bulk actions (Delete, Assignee, Export, Add Tag, Remove Tag, Add to Workflow) with partial failure handling.
- **HR Features**: Time off requests, job application form configuration, job application watchers, expense reports, and a 1-on-1 meeting tracker.
  - **1-on-1 Performance Reports**: Aggregated metrics, filtering, search, sorting, and role-based access control.
  - **Organization Chart**: Interactive ReactFlow-based visualization with Dagre layout, department color-coding, search, and navigation controls. Includes a position-only structure builder with drag-and-drop functionality and position templates.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes.
- **Quotes Management**: Modern table-based layout matching Clients page design pattern with sortable columns (name, client, created date, total cost, margin %, status), inline status updates, action buttons, low margin highlighting, and pagination.
- **Lead Management**: Customizable lead source options managed via settings.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles.
- **Predictive Hiring Alerts**: Staffing capacity prediction with configurable alerts.
- **Team Workload Reports**: Comprehensive analytics for staff workload.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **File & Media**: Advanced uploads, inline media display, voice recording, secure object storage, and collaborative annotation.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, and search.
- **User Preferences**: Per-user view customization system storing column visibility.
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