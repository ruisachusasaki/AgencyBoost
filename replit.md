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
- **Data Management**: Relational schema for core entities, CRUD operations, audit logs, table sorting, pagination, CSV import/export, and custom field management.
- **Task Management**: Hierarchical sub-tasks, task dependencies, recurring tasks, bulk actions, and dynamic project progress display.
- **Communication**: Smart Lists, Email/SMS with DND system, document management, notes, calendar management, and unified templating systems. Supports dynamic merge tags for client hub calendar appointments. Calendar views (month, week, day) support filtering by selected calendars - when no calendars are selected, all appointments are shown; when one or more calendars are selected, only appointments from those calendars are displayed.
- **Lead Management**: Rebuilt leads page with staff assignment and enhanced lead card interactions.
- **Automation System**: GoHighLevel-style, API-driven, database-backed automation with dynamic triggers (e.g., field changes, inbound webhooks).
- **Client Management**: Client team assignment, health scoring, and a comprehensive client approval workflow for assets with annotation capabilities. Includes per-user customizable and saveable column views for the "All Clients" table with automatic persistence.
- **HR Features**: Time off requests with comprehensive pagination (Time Off tab, Who's Off calendar, and Approvals board), job application form configuration, and a job application watchers/followers system. Pagination includes page size controls (10/20/50/100), page navigation with up to 5 visible page buttons, and automatic page clamping when data changes to prevent empty-table states. Approvals board includes sortable columns (Employee, Type, Dates, Duration, Submitted) matching the Applications section pattern with visual indicators for active sort direction. Onboarding Submissions section includes both column sorting (Name, Start Date, Phone, Emergency Contact, Payment Platform, Submitted, Status) and pagination matching existing HR patterns. Expense Report Form with configurable fields in Settings > HR Settings (12 default fields: Full Name, Supervisor, Purpose, Expense Type, Date, Total, Department/Team, Client, Reimbursement, Payment Method, Notes, Receipt), submission form accessible to all users in HR > Expense Report tab, and Expense Submissions view (Admin/Accounting only) in HR > Expense Submissions tab with sortable columns (proper numeric sorting for Amount), pagination, status management (approve/reject/pending), and detailed view dialog with action buttons.
- **Sales Reports**: Comprehensive analytics system including Pipeline and Sales Rep Reports with date range filtering and performance-optimized data aggregation.
- **Quote to Client Products Transfer**: Automatic transfer of quote products/bundles to client's Products Tab when quote status changes to "accepted" with existing clientId. Includes duplicate prevention and audit logging.
- **Activity & Comments**: Global timer system, comprehensive activity logging, and a threaded comments system with @mentions and emoji picker.
- **File & Media**: Advanced file uploads with support for images, videos, audio, and documents. Inline media display (images, videos, audio players), voice recording, secure object storage, and collaborative annotation for images, PDFs, and videos with completion tracking. Annotations can be marked as completed (non-destructive workflow) with visual indicators: green pins with checkmarks for completed, red pins with numbers for active. Activity logging for annotation lifecycle (created, updated, completed, reopened, deleted).
- **Knowledge Base**: Notion-like documentation platform with categories, hierarchy, RBAC, and search.
- **User Preferences**: Per-user view customization system storing column visibility preferences in database with automatic save (500ms debounce) and load on page mount. Supports view-specific configurations across different tables and pages.

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