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

### Technical Implementations
- **Authentication & Authorization**: Production-ready Replit Auth OIDC with session management, role-based access control (Admin, Manager, User, Accounting), and granular permissions. Includes automatic user provisioning and first-user admin bootstrapping.
- **Data Management**: Relational schema for core entities, CRUD operations, audit logs, table sorting, pagination, CSV import/export, and custom field management.
- **Task Management**: Hierarchical sub-tasks, task dependencies, recurring tasks, bulk actions, and dynamic project progress display.
- **Communication**: Smart Lists, Email/SMS with DND system, document management, notes, calendar management, and unified templating systems. Supports dynamic merge tags for client hub calendar appointments.
- **Lead Management**: Rebuilt leads page with staff assignment and enhanced lead card interactions.
- **Automation System**: GoHighLevel-style, API-driven, database-backed automation with dynamic triggers (e.g., field changes, inbound webhooks).
- **Client Management**: Client team assignment, health scoring, and a comprehensive client approval workflow for assets with annotation capabilities.
- **HR Features**: Time off requests, job application form configuration, and a job application watchers/followers system.
- **Sales Reports**: Comprehensive analytics system including Pipeline and Sales Rep Reports with date range filtering and performance-optimized data aggregation.
- **Activity & Comments**: Global timer system, comprehensive activity logging, and a threaded comments system with @mentions and emoji picker.
- **File & Media**: Advanced file uploads, inline image display, voice recording, secure object storage, and collaborative image/PDF annotation.
- **Knowledge Base**: Notion-like documentation platform with categories, hierarchy, RBAC, and search.

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