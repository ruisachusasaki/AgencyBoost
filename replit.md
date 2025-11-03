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
- **Authentication & Authorization**: Replit Auth OIDC, session management, role-based access control (Admin, Manager, User, Accounting), and granular permissions system. Includes admin impersonation with audit logging.
  - **Granular Permissions System**: GoHighLevel-style fine-grained permission control with module-level toggles and hierarchical sub-permissions. Features include:
    - Permission templates defining sub-permissions for all modules (Clients, Marketing, Sales, Tasks, HR, Calendar, Automation, etc.)
    - Expandable UI with module toggles and individual sub-permission checkboxes
    - Database schema with unique constraint on (roleId, permissionKey) to prevent duplicates
    - Backward compatibility with existing legacy permissions
    - Sub-permission state preservation when toggling modules on/off
    - API endpoints support both legacy and granular permissions simultaneously
- **Data Management**: Relational schema, CRUD, audit logs, sorting, pagination, CSV import/export, custom fields.
- **Task Management**: Hierarchical sub-tasks with start/due date scheduling, dependencies, recurring tasks, bulk actions, and dynamic project progress. Sub-task creation form includes calendar date pickers for start and due dates, allowing precise scheduling directly from the task detail page.
- **Communication**: Smart Lists, Email/SMS with DND, document management, notes, calendar management with dynamic merge tags, and unified templating. Calendar views support filtering by selected calendars.
  - **Lead Appointment Merge Tags**: Server-side merge tag interpolation system for lead appointments with 15 available tags across two categories. Tags in appointment titles and descriptions (e.g., {{name}}, {{email}}, {{company}}) are automatically replaced with actual lead and appointment data when fetched. Includes Lead Information tags (name, email, phone, company, source, status, value, assignedTo, notes, lastContactDate) and Appointment Details tags (appointmentDate, appointmentTime, calendarName, teamMember, location). Frontend provides organized dropdown menu for easy tag insertion during appointment creation.
- **Automation System**: GoHighLevel-style, API-driven, database-backed workflow engine with 25+ trigger definitions across various categories (Contact, Form, HR, Client Lifecycle) and 7 action types. Features conditional evaluation, trigger emission system, execution logging, variable interpolation, and non-blocking execution.
- **Client Management**: Client team assignment, health scoring, and an asset approval workflow with annotation capabilities. Includes per-user customizable and saveable column views for client tables. Client detail page includes Billing Information section with inline-editable MRR (Monthly Recurring Revenue) and Client Vertical fields for categorization and revenue tracking.
- **HR Features**: Time off requests with pagination, job application form configuration, job application watchers, expense report management with configurable fields and submission tracking, and 1-on-1 meeting tracker for managers to conduct weekly meetings with direct reports (inspired by HeyRamp.com). Features keyboard shortcuts (Enter to submit inputs, Shift+Enter for newlines in textareas) for efficient data entry.
  - **1-on-1 Performance Reports**: Accessible under Reports > 1-on-1 Performance with role-based viewing (individuals see their own data, managers see direct reports, admins see all). Displays aggregated metrics including total meetings, average performance points, completion rates for talking points/action items/goals, most common feeling and progression status. Features comprehensive filtering (date range, feeling, progression status, department), search, sorting capabilities, and a dedicated granular permission (`reports.view_1on1_performance`) in Settings > Roles & Permissions for access control.
  - **Organization Chart**: Interactive hierarchical visualization and management system with two components:
    - **Org Chart Display** (HR > Org Chart tab): ReactFlow-based visualization showing team structure based on staff.managerId relationships. Implementation details:
      - **Layout Engine**: Dagre hierarchical layout algorithm with vertical top-down orientation (80px horizontal spacing, 120px vertical spacing) prevents node overlapping and provides professional org chart appearance
      - **Visual Design**: Department color-coded nodes with avatar images, position titles, client assignment counts, and expand/collapse functionality showing child counts
      - **Connecting Lines**: ReactFlow edges with Handle components (top/bottom connection points) render smooth lines between managers and direct reports
      - **Search & Focus**: Live search bar filters staff by name, position, or department with auto-focus feature that recursively expands collapsed ancestors using requestAnimationFrame polling (up to 30 attempts) and queries live ReactFlow state via getNode() to center and highlight target nodes for 3 seconds
      - **Navigation Controls**: Zoom in/out buttons, fit view, mini-map component for large organizational structures, pan/drag canvas
      - **Performance**: Optimized for 20-50+ staff members with efficient re-rendering and memoization
    - **Org Chart Structure Builder** (Settings > HR Settings > Org Chart tab): Position-only (people-based) hierarchical org chart builder. Features include:
      - Pure position-to-position reporting structure (e.g., CEO → VP → Manager) without departments
      - Drag-and-drop interface using react-beautiful-dnd for building org hierarchy
      - Position templates managed via Settings > Staff > Teams (team_positions table)
      - "Add Position" buttons throughout the UI (header, root level, inline drop zones) for quick position creation
      - Position instances created from master templates, allowing multiple instances of same position (e.g., multiple "Executive Assistant" positions)
      - Search functionality in "Add Position" modal for quick template selection
      - Automatic parent-child relationships when adding positions via inline buttons
      - Updates positions.parentPositionId and positions.orderIndex fields to persist hierarchy
      - Optimistic UI updates with proper cache invalidation
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
- **Multi-Dashboard System**: Users can create multiple named dashboards for different purposes (similar to GoHighLevel). Features include tab-based navigation between dashboards, dashboard management dialog for creating/renaming/deleting dashboards with up/down arrow button reordering (default dashboard always locked in position 1), default dashboard settings, and automatic default dashboard initialization for new users. The system handles stale localStorage by validating stored dashboard IDs against the server and falling back to valid dashboards when needed.
- **Dashboard Widgets**: Customizable dashboard with drag-and-drop widget management, including widgets across Client Management, Sales & Revenue, Tasks, Lead Management, HR & Team, Calendar & Appointments, and Activity & Alerts categories. Features per-user widget layouts, team assignment filtering, add/remove UI, resizing, optimistic UI updates, real-time data updates, category-based filtering with color-coded badges (blue=Client Management, green=Sales, purple=Tasks, yellow=Leads, orange=HR & Team, cyan=Calendar & Appointments, red=Activity & Alerts), and search functionality.
  - **Activity & Alerts Widgets** (2): My Mentions (aggregates @mentions from task comments, file annotations, and knowledge base comments with dual-path resolution for task attachments and comment files), System Alerts (high-priority and system notifications)
- **Global Search**: Intelligent search functionality accessible from the header search bar that searches across clients, leads, and tasks. Features include:
  - Debounced search with 300ms delay and 2-character minimum
  - Real-time search results displayed in a dropdown popover
  - Type-specific icons and color-coded badges (blue for clients, purple for leads, orange for tasks)
  - Direct navigation to entity detail pages on result selection
  - Parallel database queries for optimal performance (up to 5 results per entity type)
  - Error handling with user-friendly messaging
  - Only includes entities with dedicated detail pages for proper navigation

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