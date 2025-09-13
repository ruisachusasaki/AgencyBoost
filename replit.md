# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system for marketing agencies. It manages clients, projects, campaigns, leads, tasks, and invoices, with integrated reporting and a responsive interface. The system aims to enhance efficiency and operational oversight, providing a modern solution for agencies.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.
UX Organization: Project Templates integrated as tabs under Projects section rather than separate navigation.
Checkbox Design: Bulk action checkboxes should be square, task completion checkboxes should be circular.
Filter Preferences: Simplified filtering with only essential filters (search and department, not position) for time off reports.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API.
- **Database**: PostgreSQL with Drizzle ORM.

### UI/UX Decisions
- Responsive sidebar navigation and mobile-first design.
- Optimized 3-column layouts using Radix UI primitives, shadcn/ui components, and Tailwind CSS.
- Enhanced visual design for elements like pipeline views and professional icon picker.
- Component-scoped CSS with design system variables to prevent styling issues.

### Technical Implementations
- **Data Models**: Relational schema for core entities (Clients, Projects, Campaigns, Leads, Tasks, Invoices).
- **Authentication & Authorization**: Session-based authentication with role-based access control (Admin, Manager, User, Accounting) and granular permissions. Centralized middleware (`server/auth.ts`) handles authentication and permission checks (e.g., `requireAuth()`, `requirePermission()`, `requireAdmin()`).
- **Data Management**: CRUD operations, audit logs, table sorting, pagination, CSV import/export.
- **Customization**: Custom Field Management with drag-and-drop reordering, and Marketing Template Management with WYSIWYG editor.
- **Task Management**: Dynamic project progress, hierarchical sub-task system (up to 5 levels), task dependencies (Finish to Start, Start to Start, Finish to Finish, Start to Finish), ClickUp-style recurring tasks, comprehensive bulk actions, and task status visibility controls.
- **Communication**: Smart Lists, enhanced Client Product Display, comprehensive Email and SMS communication with DND system, Document Management, Notes System, and Calendar Management. Unified Email and SMS template systems.
- **Lead Management**: Rebuilt leads page with staff assignment and enhanced lead card interactions.
- **Appointment Booking**: Integrated appointment booking for leads and clients.
- **Global Timer System**: ClickUp-style timer with cross-navigation persistence.
- **Activity Logging**: Comprehensive task activity tracking with timeline display.
- **Comments System**: Threaded comments with @mention notifications and emoji picker.
- **File & Media**: Advanced file upload, inline image display, browser-based voice recording, secure object storage, and HTML5 audio players.
- **Image Annotation**: Collaborative feedback system for images and PDFs with real-time annotation.
- **HR Features**: Time Off Request form with controlled date picker, optimized HR filter layout, and a Job Application Form Configuration System with a public careers page.
- **Knowledge Base**: Notion-like documentation platform with categories, hierarchy, social features, RBAC, and search.
- **Automation System**: GoHighLevel-style API-driven, database-backed automation with dynamic triggers (e.g., Task Overdue Timing Controls, Dynamic Lead Pipeline Integration, Field Change Trigger System, Note Added Trigger System, Inbound Webhook Trigger System).
- **Client Management**: Client Team Assignment and Client Health Scoring System with proactive monitoring, visual highlighting, and automated team notifications.

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